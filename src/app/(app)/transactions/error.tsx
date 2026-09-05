"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TransactionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <p className="mt-2 text-muted-foreground">
          Your expenses and income for the month.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "We could not load your transactions. Please try again."}
          </p>
          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
