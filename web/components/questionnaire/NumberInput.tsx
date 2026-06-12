"use client";

import { useState, useEffect } from "react";

interface NumberInputProps {
  value: number | "";
  onChange: (v: number | "") => void;
  min: number;
  max: number;
  unit?: string;
  placeholder?: string;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  unit,
  placeholder,
}: NumberInputProps) {
  const [raw, setRaw] = useState(value === "" ? "" : String(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaw(value === "" ? "" : String(value));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setRaw(v);
    const n = parseInt(v, 10);
    if (v === "" || isNaN(n)) {
      setError(null);
      onChange("");
    } else if (n < min) {
      setError(`Minimum is ${min}`);
      onChange(n);
    } else if (n > max) {
      setError(`Maximum is ${max}`);
      onChange(n);
    } else {
      setError(null);
      onChange(n);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <input
          type="number"
          value={raw}
          onChange={handleChange}
          min={min}
          max={max}
          placeholder={placeholder ?? `${min}–${max}`}
          className="text-4xl font-bold text-center w-32 border-b-2 border-saffron bg-transparent focus:outline-none text-neutral-900 pb-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
        {unit && (
          <span className="text-xl font-medium text-neutral-400">{unit}</span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && (
        <p className="text-xs text-neutral-400">
          Enter a value between {min} and {max}
        </p>
      )}
    </div>
  );
}
