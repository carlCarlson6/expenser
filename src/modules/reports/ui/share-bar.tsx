/** CSS-only share bar for category breakdowns (server-renderable). */
export function ShareBar({ share }: { share: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
      <div
        className="h-full rounded-full bg-zinc-700"
        style={{ width: `${Math.max(2, Math.round(share * 100))}%` }}
      />
    </div>
  );
}
