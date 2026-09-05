import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="mb-4 h-10 w-full max-w-[140px]" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
