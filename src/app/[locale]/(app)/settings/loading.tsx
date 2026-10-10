import { Skeleton } from "@/shared/ui/skeleton";

export default function SettingsLoading() {
  return (
    <section className="mx-auto max-w-md">
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="space-y-5 rounded-xl border border-zinc-200 bg-white p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
    </section>
  );
}
