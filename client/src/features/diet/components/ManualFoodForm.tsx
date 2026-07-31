import { useState, type FormEvent } from "react";
import type { Macros } from "../data";

export type ManualEntry = {
  name: string;
  portion: string;
  macros: Macros;
};

type Props = {
  /** Pre-fills the name with whatever was already typed into the search box. */
  initialName?: string;
  onSubmit: (entry: ManualEntry) => void;
  onCancel: () => void;
};

const numeric = (v: string) => Math.max(0, Number(v) || 0);

export default function ManualFoodForm({
  initialName = "",
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(initialName);
  const [portion, setPortion] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const canSave = name.trim().length > 0 && numeric(calories) > 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSubmit({
      name: name.trim(),
      portion: portion.trim() || "1 portion",
      macros: {
        calories: Math.round(numeric(calories)),
        protein: Math.round(numeric(protein)),
        carbs: Math.round(numeric(carbs)),
        fat: Math.round(numeric(fat)),
      },
    });
  };

  return (
    <form className="manual" onSubmit={submit}>
      <p className="sheet-hint">Enter what you ate — values for the whole portion.</p>

      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Protein bar"
          autoFocus
        />
      </label>

      <label className="field">
        <span>Amount</span>
        <input
          value={portion}
          onChange={(e) => setPortion(e.target.value)}
          placeholder="e.g. 1 bar (optional)"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Calories</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="kcal"
          />
        </label>
        <label className="field">
          <span>Protein</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="g"
          />
        </label>
        <label className="field">
          <span>Carbs</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="g"
          />
        </label>
        <label className="field">
          <span>Fat</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="g"
          />
        </label>
      </div>

      <div className="manual-actions">
        <button type="button" className="ghost-btn" onClick={onCancel}>
          Back to search
        </button>
        <button type="submit" className="add-btn" disabled={!canSave}>
          Add
        </button>
      </div>
    </form>
  );
}
