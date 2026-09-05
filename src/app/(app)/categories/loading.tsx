import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-5 w-80" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-14" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
        <div className="min-w-[540px]">
          <div className="border-b p-4">
            <div className="grid grid-cols-4 gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16 justify-self-end" />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-b p-4 last:border-b-0">
              <div className="grid grid-cols-4 items-center gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24 justify-self-end" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
