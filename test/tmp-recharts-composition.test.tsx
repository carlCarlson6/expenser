import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Bar, BarChart, Line } from "recharts";

// Temporary: verifies that a <Line> child is actually rendered inside a
// <BarChart> in Recharts 3 (the dashboard's bar variant overlays the
// previous-period baseline this way).
describe("recharts composition", () => {
  it("renders a Line inside a BarChart", () => {
    const html = renderToStaticMarkup(
      <BarChart width={400} height={200} data={[{ x: "a", v: 1, c: 2 }]}>
        <Bar dataKey="v" />
        <Line dataKey="c" />
      </BarChart>,
    );
    expect(html).toContain("recharts-bar");
    expect(html).toContain("recharts-line");
  });
});
