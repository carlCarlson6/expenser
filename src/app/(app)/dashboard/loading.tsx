import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-5 w-64" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-1 h-4 w-56" />
          </CardHeader>
          <CardContent>
            <Skeleton className="aspect-video w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
