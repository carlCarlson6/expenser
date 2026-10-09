import type { ChartType } from "./chart";

/** Line-art glyphs for each chart shape, drawn on a 16×16 grid and inheriting
 *  `currentColor` so the active/inactive pill styles them automatically. */
const paths: Record<ChartType, React.ReactNode> = {
  bar: (
    <>
      <rect x="2" y="8" width="3" height="6" rx="0.5" />
      <rect x="6.5" y="4" width="3" height="10" rx="0.5" />
      <rect x="11" y="6" width="3" height="8" rx="0.5" />
    </>
  ),
  line: (
    <path
      d="M2 12.5 6 8l3 3 5-6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  area: (
    <>
      <path d="M2 12.5 6 8l3 3 5-6.5V14H2Z" opacity="0.9" />
      <path
        d="M2 12.5 6 8l3 3 5-6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.5"
      />
    </>
  ),
  cumulative: (
    <>
      <path
        d="M2 13V11h4V8.5h4V6h4V3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  stacked: (
    <>
      <rect x="2" y="9.5" width="3" height="4.5" rx="0.5" />
      <rect x="6.5" y="7" width="3" height="7" rx="0.5" opacity="0.75" />
      <rect x="11" y="4" width="3" height="10" rx="0.5" opacity="0.5" />
    </>
  ),
  donut: (
    <>
      <path
        d="M8 2a6 6 0 1 0 6 6h-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 3.2A6 6 0 0 1 12.8 6.25H9.75Z"
        fill="currentColor"
        opacity="0.55"
      />
    </>
  ),
  heatmap: (
    <>
      {[0, 1, 2, 3].map((col) =>
        [0, 1].map((row) => (
          <rect
            key={`${col}-${row}`}
            x={2 + col * 3.25}
            y={3 + row * 5}
            width="2.5"
            height="4"
            rx="0.75"
            opacity={0.35 + col * 0.2}
          />
        )),
      )}
    </>
  ),
};

export function ChartIcon({
  type,
  className,
}: {
  type: ChartType;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      focusable="false"
      className={className}
      fill="currentColor"
    >
      {paths[type]}
    </svg>
  );
}