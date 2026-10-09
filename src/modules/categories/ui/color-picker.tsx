"use client";

import { useState } from "react";

import { CATEGORY_PALETTE } from "../data/palette";

/**
 * Color picker: a swatch grid plus a native color input for custom values.
 * Writes the selected hex into a hidden `color` input so it travels with
 * the surrounding form.
 */
export function ColorPicker({
  name = "color",
  initial,
  label,
}: {
  name?: string;
  initial?: string;
  label?: string;
}) {
  const [color, setColor] = useState(initial ?? CATEGORY_PALETTE[0]);

  return (
    <div>
      {label && (
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          {label}
        </span>
      )}
      <input type="hidden" name={name} value={color} />

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            onClick={() => setColor(swatch)}
            className="h-7 w-7 cursor-pointer rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: swatch,
              borderColor: color.toLowerCase() === swatch ? "#18181b" : "transparent",
            }}
          />
        ))}

        <label
          className="relative h-7 w-7 cursor-pointer overflow-hidden rounded-full border-2 border-zinc-300"
          style={{ backgroundColor: color }}
          title={color}
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Custom color"
          />
        </label>

        <span className="font-mono text-xs text-zinc-500">{color}</span>
      </div>
    </div>
  );
}
