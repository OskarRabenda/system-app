import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchFoods,
  lookupBarcode,
  RateLimitError,
  type FoodHit,
} from "../foodSearch";
import ManualFoodForm, { type ManualEntry } from "./ManualFoodForm";
import BarcodeScanner from "./BarcodeScanner";

const DEBOUNCE_MS = 550; // upstream allows ~10 searches/min, so type-ahead must be lazy
const DEFAULT_GRAMS = 100;

type Props = {
  onAdd: (hit: FoodHit, grams: number) => void;
  onAddManual: (entry: ManualEntry) => void;
  onClose: () => void;
};

export default function AddFoodPanel({ onAdd, onAddManual, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<FoodHit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grams, setGrams] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"search" | "manual" | "scan">("search");
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const manual = mode === "manual";

  useEffect(() => {
    if (mode === "search") inputRef.current?.focus();
  }, [mode]);

  // A scanned code is an exact match, so it skips search and adds directly.
  const handleDetected = useCallback(
    (code: string) => {
      setScanStatus("Looking up…");
      lookupBarcode(code)
        .then((found) => {
          if (!found) {
            setScanStatus(`No product for ${code}. Try search or add manually.`);
            return;
          }
          onAdd(found, DEFAULT_GRAMS);
        })
        .catch(() => setScanStatus("Lookup failed. Check your connection."));
    },
    [onAdd],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const q = query.trim();
    if (mode !== "search" || q.length < 2) {
      setHits([]);
      setError(null);
      setBusy(false);
      return;
    }

    const controller = new AbortController();
    setBusy(true);
    const id = setTimeout(() => {
      searchFoods(q, controller.signal)
        .then((results) => {
          setHits(results);
          setError(results.length ? null : "Nothing found. Try another name.");
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(
            err instanceof RateLimitError
              ? err.message
              : "Search is unavailable right now.",
          );
          setHits([]);
        })
        .finally(() => setBusy(false));
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query, mode]);

  const gramsFor = (id: string) => grams[id] ?? DEFAULT_GRAMS;

  return (
    <div className="sheet-backdrop" onPointerDown={onClose}>
      <div
        className="sheet glass"
        role="dialog"
        aria-modal="true"
        aria-label="Add food"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="glass-sheen" aria-hidden="true" />
        <div className="sheet-body">
          <header className="sheet-head">
            <h2>
              {mode === "manual"
                ? "Add it yourself"
                : mode === "scan"
                  ? "Scan barcode"
                  : "Add food"}
            </h2>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </header>

          {mode === "scan" ? (
            <BarcodeScanner
              status={scanStatus}
              onDetected={handleDetected}
              onClose={() => {
                setScanStatus(null);
                setMode("search");
              }}
            />
          ) : manual ? (
            <ManualFoodForm
              initialName={query}
              onSubmit={onAddManual}
              onCancel={() => setMode("search")}
            />
          ) : (
            <>
              <div className="search-row">
                <input
                  ref={inputRef}
                  className="search-input"
                  type="search"
                  placeholder="Search groceries — e.g. snickers"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="scan-btn"
                  onClick={() => setMode("scan")}
                  title="Scan a barcode"
                  aria-label="Scan a barcode"
                >
                  ▥
                </button>
              </div>

              <p className="sheet-hint">
                {busy
                  ? "Searching…"
                  : error
                    ? error
                    : hits.length
                      ? `${hits.length} suggestions · values per 100 g`
                      : "Type at least two letters."}
              </p>

              <ul className="hits">
                {hits.map((hit) => (
                  <li key={hit.id} className="hit">
                    <div className="hit-main">
                      <span className="hit-name">
                        {hit.name}
                        {hit.store && <span className="hit-store">local</span>}
                      </span>
                      <span className="hit-macros">
                        {hit.brand ? `${hit.brand} · ` : ""}
                        {hit.per100.calories} kcal · {hit.per100.protein}g P
                        <em> /100g</em>
                      </span>
                    </div>
                    <div className="hit-actions">
                      <label className="grams">
                        <input
                          type="number"
                          min={1}
                          max={2000}
                          step={10}
                          value={gramsFor(hit.id)}
                          onChange={(e) =>
                            setGrams((g) => ({
                              ...g,
                              [hit.id]: Math.max(1, Number(e.target.value) || 0),
                            }))
                          }
                        />
                        <span>g</span>
                      </label>
                      <button
                        type="button"
                        className="add-btn"
                        onClick={() => onAdd(hit, gramsFor(hit.id))}
                      >
                        Add
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="ghost-btn wide"
                onClick={() => setMode("manual")}
              >
                Can’t find it? Enter it manually
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
