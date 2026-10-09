/**
 * Seeds a development profile with ~6 months of realistic expenses.
 *
 *   npm run db:seed -- <clerk_user_id> [--force]
 *   SEED_CLERK_USER_ID=user_xxx npm run db:seed
 *
 * Reuses the real domain layer (getProfile / createExpense), so the seeded
 * data passes exactly the same rules as the app. Refuses to run twice unless
 * --force is passed.
 */
import { loadEnv } from "./load-env";

loadEnv();

import { count, eq } from "drizzle-orm";

import { expenses } from "../src/modules/expenses/data/schema";
import { createExpense } from "../src/modules/expenses/domain/commands/create-expense";
import { listCategories } from "../src/modules/categories/domain/queries/list-categories";
import { getProfile } from "../src/modules/users/domain/queries/get-profile";
import type { Actor } from "../src/modules/users/domain/types";
import { getDb, type Db } from "../src/shared/db/client";
import { createRepos } from "../src/shared/db/repos";
import { formatCents } from "../src/shared/money/money";
import { toISODate } from "../src/modules/reports/domain/dates";

const args = process.argv.slice(2);
const force = args.includes("--force");
const clerkUserId = args.find((a) => !a.startsWith("--")) ?? process.env.SEED_CLERK_USER_ID;

if (!clerkUserId) {
  console.error(
    "Usage: npm run db:seed -- <clerk_user_id> [--force]\n" +
      "   or: SEED_CLERK_USER_ID=user_xxx npm run db:seed",
  );
  process.exit(1);
}

const MONTHS = 6;

/** Deterministic PRNG so re-seeding the same user gives the same data. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (const ch of s) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Rule = {
  category: string;
  /** Expected occurrences per week (random daily chance = perWeek / 7). */
  perWeek?: number;
  /** Fixed monthly charge on this day of the month. */
  onDayOfMonth?: number;
  minCents: number;
  maxCents: number;
  descriptions: string[];
};

const RULES: Rule[] = [
  {
    category: "Supermercado",
    perWeek: 1,
    minCents: 3200,
    maxCents: 9500,
    descriptions: [
      "Compra semanal",
      "Supermercado",
      "Frutería",
      "Mercadona",
      "Supermercado del barrio",
    ],
  },
  {
    category: "Restaurantes",
    perWeek: 1.4,
    minCents: 1100,
    maxCents: 6800,
    descriptions: [
      "Menú del día",
      "Cena fuera",
      "Cafés con Marta",
      "Comida a domicilio",
      "Desayuno",
      "Cena con el equipo",
    ],
  },
  {
    category: "Transporte",
    perWeek: 3,
    minCents: 120,
    maxCents: 2500,
    descriptions: [
      "Abono transporte",
      "Bono Taxi",
      "Gasolina",
      "Peaje",
      "Bicicleta pública",
    ],
  },
  {
    category: "Vivienda",
    onDayOfMonth: 1,
    minCents: 78000,
    maxCents: 78000,
    descriptions: ["Alquiler"],
  },
  {
    category: "Suministros",
    onDayOfMonth: 10,
    minCents: 3500,
    maxCents: 12500,
    descriptions: [
      "Electricidad",
      "Internet + móvil",
      "Agua",
      "Comunidad",
    ],
  },
  {
    category: "Ocio",
    perWeek: 0.9,
    minCents: 900,
    maxCents: 7500,
    descriptions: [
      "Cine",
      "Concierto",
      "Suscripción streaming",
      "Libros",
      "Entradas de teatro",
      "Excursión",
    ],
  },
  {
    category: "Salud",
    minCents: 1800,
    maxCents: 14000,
    descriptions: [
      "Farmacia",
      "Dentista",
      "Consulta médica",
      "Gimnasio",
    ],
  },
  {
    category: "Compras",
    perWeek: 0.8,
    minCents: 1200,
    maxCents: 14000,
    descriptions: [
      "Zara",
      "Amazon",
      "Ropa",
      "Regalos",
      "Electrónica",
      "Farmacia hogar",
    ],
  },
  {
    category: "Otros",
    perWeek: 0.4,
    minCents: 400,
    maxCents: 6000,
    descriptions: [
      "Imprevistos",
      "Envíos",
      "Pequeños gastos",
      "Caja",
    ],
  },
];

const TRIPS = [
  { title: "Viaje a Lisboa", minCents: 32000, maxCents: 68000 },
  { title: "Escapada a Barcelona", minCents: 18000, maxCents: 42000 },
  { title: "Vacaciones en Menorca", minCents: 55000, maxCents: 95000 },
];

async function main() {
  const db: Db = getDb();
  const repos = createRepos(db);

  const profile = await getProfile(repos, clerkUserId);
  const actor: Actor = {
    profileId: profile.id,
    clerkUserId,
    locale: profile.locale,
    currency: profile.currency,
  };
  console.log(`Profile ${profile.id} (locale=${profile.locale}, currency=${profile.currency})`);

  const [{ total }] = await db
    .select({ total: count() })
    .from(expenses)
    .where(eq(expenses.profileId, profile.id));
  if (total > 0 && !force) {
    console.error(
      `This profile already has ${total} expenses. Re-run with --force to add ${MONTHS} months anyway.`,
    );
    process.exit(1);
  }

  const categories = await listCategories(repos, actor);
  const byName = new Map(categories.map((c) => [c.name, c.id]));
  const missing = RULES.map((r) => r.category).filter((n) => !byName.has(n));
  if (missing.length) {
    console.warn(`Categories not found (skipped): ${missing.join(", ")}`);
  }

  const rand = mulberry32(hash(clerkUserId));
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - MONTHS);

  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)];
  const amount = (min: number, max: number) =>
    Math.round(min + rand() * (max - min));

  type Draft = {
    categoryId: string;
    amountCents: number;
    description: string;
    spentAt: string;
  };
  const drafts: Draft[] = [];

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    for (const rule of RULES) {
      const categoryId = byName.get(rule.category);
      if (!categoryId) continue;

      const hit =
        rule.onDayOfMonth !== undefined
          ? d.getDate() === rule.onDayOfMonth
          : rand() < ((rule.perWeek ?? 0) / 7) * (isWeekend ? 1.5 : 1);

      if (!hit) continue;
      drafts.push({
        categoryId,
        amountCents: amount(rule.minCents, rule.maxCents),
        description: pick(rule.descriptions),
        spentAt: iso,
      });
    }
  }

  // Occasional health appointments and trips.
  for (let i = 0; i < 4; i++) {
    const categoryId = byName.get("Salud");
    if (!categoryId) break;
    const day = new Date(start);
    day.setDate(day.getDate() + Math.floor(rand() * MONTHS * 30));
    drafts.push({
      categoryId,
      amountCents: amount(1800, 14000),
      description: pick(["Farmacia", "Dentista", "Consulta médica", "Fisioterapia"]),
      spentAt: toISODate(day > today ? today : day),
    });
  }
  for (const trip of TRIPS) {
    const categoryId = byName.get("Viajes");
    if (!categoryId) continue;
    const day = new Date(start);
    day.setDate(day.getDate() + Math.floor(rand() * (MONTHS * 30 - 10)));
    drafts.push({
      categoryId,
      amountCents: amount(trip.minCents, trip.maxCents),
      description: trip.title,
      spentAt: toISODate(day),
    });
  }

  drafts.sort((a, b) => a.spentAt.localeCompare(b.spentAt));

  // Insert through the real command, in one transaction.
  await db.transaction(async (tx) => {
    const txRepos = createRepos(tx as unknown as Db);
    for (const draft of drafts) {
      await createExpense(txRepos, actor, {
        amount: draft.amountCents,
        categoryId: draft.categoryId,
        description: draft.description,
        spentAt: draft.spentAt,
      });
    }
  });

  console.log(`Inserted ${drafts.length} expenses over ${MONTHS} months.`);

  const fmt = (cents: number) => formatCents(cents, profile.currency, "es-ES");
  const byCategory = new Map<string, number>();
  for (const draft of drafts) {
    byCategory.set(
      draft.categoryId,
      (byCategory.get(draft.categoryId) ?? 0) + draft.amountCents,
    );
  }
  const sorted = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const nameOf = new Map(categories.map((c) => [c.id, c.name]));
  const grand = sorted.reduce((acc, [, v]) => acc + v, 0);
  console.log("\nBy category:");
  for (const [categoryId, total] of sorted) {
    const n = drafts.filter((d) => d.categoryId === categoryId).length;
    console.log(
      `  ${nameOf.get(categoryId)?.padEnd(16)} ${String(n).padStart(4)}  ${fmt(total)}`,
    );
  }
  console.log(
    `  ${"TOTAL".padEnd(16)} ${String(drafts.length).padStart(4)}  ${fmt(grand)}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
