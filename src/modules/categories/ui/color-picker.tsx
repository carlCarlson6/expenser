"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HexColorPicker } from "react-colorful";

import { cx } from "@/shared/ui/cx";

import { CATEGORY_PALETTE, isHexColor, normalizeHex } from "../data/palette";

const swatchBase =
  "cursor-pointer rounded-full border-2 transition-transform hover:scale-110";

/**
 * Saturation/value picker + hue bar, palette swatches, and a hex field.
 * Shared by the category modal and the inline row popover.
 *
 * `onChange` fires continuously while dragging — use it only to drive local
 * preview state. `onCommit` fires once the gesture ends, which is where an
 * expensive save (a Server Action) belongs. When omitted, commit falls back
 * to `onChange`, which is what a plain form wants.
 */
export function ColorControls({
  value,
  onChange,
  onCommit,
  size = "md",
}: {
  value: string;
  onChange: (hex: string) => void;
  onCommit?: (hex: string) => void;
  size?: "sm" | "md";
}) {
  const t = useTranslations("categories");
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);

  // Reset the text field when `value` changes from elsewhere (swatch, wheel,
  // dialog reset). Adjusted during render rather than in an effect so the
  // field never shows a stale value for a frame.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  const commit = onCommit ?? onChange;
  const pick = (hex: string) => {
    onChange(hex);
    commit(hex);
  };

  const dot = size === "sm" ? "h-6 w-6" : "h-7 w-7";

  return (
    <div className="space-y-3">
      <div role="group" aria-label={t("colorWheel")}>
        <HexColorPicker
          color={value}
          onChange={onChange}
          onChangeEnd={commit}
          className={size === "sm" ? "h-40 w-full" : "h-52 w-full"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CATEGORY_PALETTE.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            aria-pressed={value === swatch}
            onClick={() => pick(swatch)}
            className={cx(swatchBase, dot)}
            style={{
              backgroundColor: swatch,
              borderColor: value === swatch ? "#18181b" : "transparent",
            }}
          />
        ))}
      </div>

      <input
        type="text"
        value={draft}
        aria-label={t("hexColor")}
        spellCheck={false}
        autoComplete="off"
        maxLength={7}
        onChange={(e) => {
          setDraft(e.target.value);
          const next = normalizeHex(e.target.value);
          if (isHexColor(next)) onChange(next);
        }}
        onBlur={() => {
          // Snap back to the current color if the field was left invalid.
          setDraft(value);
          commit(value);
        }}
        className={cx(
          "w-28 rounded-lg border bg-white px-2 py-1 font-mono text-xs text-zinc-900 focus:outline-none",
          isHexColor(normalizeHex(draft))
            ? "border-zinc-300 focus:border-zinc-500"
            : "border-red-400",
        )}
      />
    </div>
  );
}

/**
 * Form-bound wrapper around `ColorControls`: writes the selected hex into a
 * hidden `color` input so it travels with the surrounding form.
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
  const [color, setColor] = useState(() =>
    initial && isHexColor(initial)
      ? normalizeHex(initial)
      : CATEGORY_PALETTE[0],
  );

  return (
    <div>
      {label && (
        <span className="mb-1 block text-sm font-medium text-zinc-700">
          {label}
        </span>
      )}
      <input type="hidden" name={name} value={color} />
      <ColorControls value={color} onChange={setColor} />
    </div>
  );
}
