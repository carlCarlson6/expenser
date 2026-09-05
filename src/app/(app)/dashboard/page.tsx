import { auth } from "@clerk/nextjs/server";
import { categories } from "@/composition/categories-composition";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const seeded = await categories.seedDefaults(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Your spending overview will live here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-muted p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="mt-1 text-2xl font-semibold">{seeded.length}</p>
        </div>
      </div>
    </div>
  );
}
