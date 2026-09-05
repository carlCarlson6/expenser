import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
