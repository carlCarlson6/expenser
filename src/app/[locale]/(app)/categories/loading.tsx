import { Skeleton } from "@/shared/ui/skeleton";

export default function CategoriesLoading() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>

      <div className="mb-4 flex justify-end">
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200">
              <th className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-14" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-28" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-14" />
              </th>
              <th className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-16" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-8" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-10" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-8" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-36" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-10" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-10" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-8" />
              </td>
              <td className="px-4 py-3 text-right">
                <Skeleton className="ml-auto h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Skeleton className="mt-3 h-3 w-72" />
    </section>
  );
}
