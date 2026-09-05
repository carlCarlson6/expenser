import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No activity yet</CardTitle>
        <CardDescription>
          Add your first income or expense to unlock charts and insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/transactions"
          className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add transaction
        </Link>
      </CardContent>
    </Card>
  );
}
