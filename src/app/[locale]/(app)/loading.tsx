import { Skeleton } from "@/shared/ui/skeleton";

export default function DashboardLoading() {
  const card = "rounded-xl border border-zinc-200 bg-white p-5";

  return (
    <section className="space-y-4">
      <Skeleton className="h-8 w-56" />

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className={card}>
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className={card}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
        <div className={card}>
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className={card}>
          <Skeleton className="mb-2 h-4 w-20" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <div className={card}>
        <Skeleton className="mb-3 h-4 w-32" />
        <Skeleton className="h-64 w-full" />
        <div className="mt-4 flex flex-wrap gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className={card}>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      <div className={card}>
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </section>
  );
}
