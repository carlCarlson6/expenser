/** Currency formatter shared by the dashboard charts (axes, tooltips, donut). */
export function currencyFormatter(
  currency: string,
  locale: string,
  maximumFractionDigits = 0,
): (value: number) => string {
  return (value) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(value);
}