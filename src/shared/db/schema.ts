// Aggregated Drizzle schema. Tables live in their vertical slice
// (src/modules/<slice>/data/schema.ts); this barrel feeds the db client
// and drizzle-kit.
export * from "@/modules/users/data/schema";
export * from "@/modules/categories/data/schema";
export * from "@/modules/expenses/data/schema";
