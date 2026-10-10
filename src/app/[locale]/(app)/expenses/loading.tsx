import { Skeleton } from "@/shared/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-10" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
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
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end gap-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-14" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-18" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-44" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-36" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-40" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-36" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
