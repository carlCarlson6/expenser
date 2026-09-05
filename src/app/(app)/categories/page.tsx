import { createCategoryAction } from "@/app/actions/categories.actions";
import { categories } from "@/composition/categories-composition";
import { CategoryIcon } from "@/components/category-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@clerk/nextjs/server";
import { CategoryActions } from "./_components/category-actions";
import { CategoryForm } from "./_components/category-form";

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const categoryList = await categories.list(userId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Manage the categories you use to organize expenses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add category</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryForm
            action={createCategoryAction}
            submitLabel="Create category"
          />
        </CardContent>
      </Card>

      {categoryList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No categories yet. Add your first one above, or open the dashboard to
            seed default categories.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryList.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {category.color}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 capitalize">
                      <CategoryIcon name={category.icon} className="h-4 w-4" />
                      {category.icon}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <CategoryActions category={category} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
