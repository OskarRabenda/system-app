import type { Macros } from "./data";

/**
 * Food lookup against Open Food Facts (search-a-licious).
 *
 * Free and keyless, but two constraints shape this module:
 *  - it sends no CORS headers, so calls go through the /off dev proxy;
 *  - search is rate limited to ~10 requests per minute per IP, so results are
 *    cached per query and callers must debounce.
 */

const ENDPOINT = "/off-search/search";
const PAGE_SIZE = 10; // per query; deduping trims this back before display
const MAX_SUGGESTIONS = 6; // keep the panel small — it sits over the page
const FIELDS =
  "code,product_name,brands,quantity,nutriments,stores,countries_tags";

/**
 * Dutch supermarkets, ranked first.
 *
 * Filtering hard on `stores:(...)` was tempting but far too lossy — the store
 * field is sparsely filled, so "hagelslag" dropped from 24 hits to 3. These
 * are used as a ranking boost instead, which keeps coverage while putting the
 * products actually on the shelf here at the top.
 */
const HOME_STORES = ["albert heijn", "ah", "jumbo", "lidl"];
const HOME_COUNTRY = "en:netherlands";

/**
 * The database is worldwide, so an unfiltered search returns French, Italian
 * and Norwegian product names. `en` covers international brands, `nl` covers
 * Dutch supermarket items (Albert Heijn, Jumbo) that carry no English label.
 *
 * A bare `OR` between terms is rejected upstream, but a field-grouped one is
 * accepted, so both languages cost no extra requests.
 */
const LANGS = ["en", "nl"];
const LANG_FILTER = `lang:(${LANGS.join(" OR ")})`;

export type FoodHit = {
  id: string;
  name: string;
  brand?: string;
  /** Macros per 100 g, which is how Open Food Facts normalises everything. */
  per100: Macros;
  /** Named when the product is stocked by a local supermarket. */
  store?: string;
  /** 2 = local shelf, 1 = sold in NL, 0 = elsewhere. Drives ranking. */
  local: number;
};

type RawHit = {
  code?: string;
  product_name?: string;
  brands?: string | string[];
  stores?: string | string[];
  countries_tags?: string[];
  nutriments?: Record<string, number | undefined>;
};

const cache = new Map<string, FoodHit[]>();

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;

function toBrand(brands: RawHit["brands"]): string | undefined {
  if (!brands) return undefined;
  const first = Array.isArray(brands) ? brands[0] : brands.split(",")[0];
  return first?.trim() || undefined;
}

function toHit(raw: RawHit): FoodHit | null {
  const name = raw.product_name?.trim();
  if (!name) return null;
  const n = raw.nutriments ?? {};
  const per100: Macros = {
    calories: Math.round(num(n["energy-kcal_100g"])),
    protein: Math.round(num(n["proteins_100g"]) * 10) / 10,
    carbs: Math.round(num(n["carbohydrates_100g"]) * 10) / 10,
    fat: Math.round(num(n["fat_100g"]) * 10) / 10,
  };
  // Entries with no energy value are unusable for a calorie tally.
  if (per100.calories <= 0 && per100.protein <= 0) return null;

  const brand = toBrand(raw.brands);
  const storeText = [
    Array.isArray(raw.stores) ? raw.stores.join(" ") : (raw.stores ?? ""),
    brand ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const store = HOME_STORES.find((s) => storeText.includes(s));
  const inCountry = (raw.countries_tags ?? []).includes(HOME_COUNTRY);

  return {
    id: raw.code || name,
    name,
    brand,
    per100,
    store,
    local: store ? 2 : inCountry ? 1 : 0,
  };
}

/**
 * The same product is listed once per country with a different barcode, so
 * deduping on the barcode alone still shows "Snickers" several times. Name
 * plus brand collapses those; genuinely different variants ("Snickers Ice
 * Cream", "xtreme fun size") keep their own names and survive.
 */
function dedupeKey(hit: FoodHit): string {
  const name = hit.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const brand = (hit.brand ?? "").toLowerCase().trim();
  return `${name}|${brand}`;
}

/**
 * Crowd-sourced entries are uneven: the same bar appears at 487 kcal/100g and
 * at 124, because someone typed the per-bar figure into the per-100g field.
 * Energy should be roughly 4·protein + 4·carbs + 9·fat, so comparing the two
 * scores how much an entry can be trusted. Higher is better; used both to
 * drop nonsense and to pick the best of a duplicate set.
 */
function quality(hit: FoodHit): number {
  const { calories, protein, carbs, fat } = hit.per100;
  if (calories <= 0) return -1;
  const complete =
    (protein > 0 ? 1 : 0) + (carbs > 0 ? 1 : 0) + (fat > 0 ? 1 : 0);
  const computed = 4 * protein + 4 * carbs + 9 * fat;
  if (computed <= 0) return complete; // no macros to check against
  const drift = Math.abs(computed - calories) / calories;
  return complete + (1 - Math.min(drift, 1));
}

/** Energy that no real food per 100 g can have, plus wildly inconsistent macros. */
function isPlausible(hit: FoodHit): boolean {
  const { calories, protein, carbs, fat } = hit.per100;
  if (calories <= 0 || calories > 900) return false;
  const computed = 4 * protein + 4 * carbs + 9 * fat;
  if (computed <= 0) return true; // macros simply missing — still usable
  return Math.abs(computed - calories) / calories <= 0.5;
}

/**
 * Look a product up by its barcode. This hits the product endpoint rather than
 * the search service, so it is exact and carries no search rate limit.
 */
export async function lookupBarcode(
  code: string,
  signal?: AbortSignal,
): Promise<FoodHit | null> {
  const res = await fetch(
    `/off-product/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`,
    { signal },
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Barcode lookup failed (${res.status})`);
  const body = (await res.json()) as { status?: number; product?: RawHit };
  if (!body.product || body.status === 0) return null;
  return toHit(body.product);
}

export class RateLimitError extends Error {
  constructor() {
    super("Too many searches just now — wait a moment and try again.");
    this.name = "RateLimitError";
  }
}

async function run(q: string, signal?: AbortSignal): Promise<RawHit[]> {
  const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&page_size=${PAGE_SIZE}&fields=${FIELDS}`;
  const res = await fetch(url, { signal });
  if (res.status === 429) throw new RateLimitError();
  if (!res.ok) throw new Error(`Food search failed (${res.status})`);
  const body = (await res.json()) as { hits?: RawHit[] };
  return body.hits ?? [];
}

/**
 * Two queries, merged.
 *
 * The upstream index matches whole words, so a half-typed "snick" finds
 * nothing useful while "snickers" finds hundreds. Wildcards are only
 * supported on the brands field (`product_name:snick*` returns a 500), so a
 * brand-prefix query runs alongside the plain one to give type-ahead
 * suggestions. `OR` in a single query is rejected upstream, hence two calls.
 */
export async function searchFoods(
  query: string,
  signal?: AbortSignal,
): Promise<FoodHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const cached = cache.get(q);
  if (cached) return cached;

  const lastWord = q.split(/\s+/).pop() ?? q;
  const settled = await Promise.allSettled([
    run(`${q} ${LANG_FILTER}`, signal),
    run(`brands:${lastWord}* ${LANG_FILTER}`, signal),
  ]);

  // Only give up if both failed; a rate limit on either is worth surfacing.
  if (settled.every((s) => s.status === "rejected")) {
    const reason = (settled[0] as PromiseRejectedResult).reason;
    throw reason instanceof Error ? reason : new Error("Food search failed");
  }

  const lists = settled.map((outcome) =>
    outcome.status === "fulfilled"
      ? outcome.value.map(toHit).filter((h): h is FoodHit => h !== null)
      : [],
  );

  /* Interleaved, not concatenated. Straight concatenation buries the brand
     matches behind every literal match, so typing "snick" would list obscure
     "Snick nut" products before any Snickers. Alternating puts a brand hit in
     the first couple of rows, which is what a half-typed brand name means. */
  const order: string[] = [];
  const best = new Map<string, FoodHit>();
  const longest = Math.max(...lists.map((l) => l.length), 0);
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const hit = list[i];
      if (!hit || !isPlausible(hit)) continue;
      const key = dedupeKey(hit);
      const held = best.get(key);
      if (!held) {
        order.push(key);
        best.set(key, hit);
      } else if (quality(hit) > quality(held)) {
        // Same product, better-looking numbers — keep the position, swap the data.
        best.set(key, hit);
      }
    }
  }
  // Stable sort: local shelf first, then anything sold here, then the rest.
  // Within a tier the interleaved order (and so relevance) is preserved.
  const results = order
    .map((key) => best.get(key)!)
    .sort((a, b) => b.local - a.local);

  const top = results.slice(0, MAX_SUGGESTIONS);
  cache.set(q, top);
  return top;
}
