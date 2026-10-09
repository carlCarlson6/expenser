/**
 * Deterministic expense generator for development profiles. Pure: it only
 * turns a category name → id map into draft expenses, so it can be unit
 * tested without a database.
 *
 * Everything here is seeded by the clerk user id, so seeding the same user
 * twice (with `force`) always produces the same data.
 */

import { toISODate } from "@/modules/reports/domain/dates";

export type SeedDraft = {
  categoryId: string;
  amountCents: number;
  description: string;
  spentAt: string;
};

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

/** Category the trips below are charged to; reported when it is missing. */
const TRIP_CATEGORY = "Viajes";

export type BuildSeedDraftsInput = {
  /** Category name → id, as provisioned for the target profile. */
  byName: Map<string, string>;
  clerkUserId: string;
  months: number;
  today: Date;
};

export type BuildSeedDraftsResult = {
  drafts: SeedDraft[];
  /** Rule categories the profile does not have; nothing is generated for them. */
  missingCategories: string[];
};

/**
 * Builds `months` of plausible expenses ending today. Categories missing from
 * the profile are skipped (e.g. an English profile) instead of failing.
 */
export function buildSeedDrafts({
  byName,
  clerkUserId,
  months,
  today,
}: BuildSeedDraftsInput): BuildSeedDraftsResult {
  const missingCategories = [...RULES.map((r) => r.category), TRIP_CATEGORY].filter(
    (name) => !byName.has(name),
  );

  const rand = mulberry32(hash(clerkUserId));
  const start = new Date(today);
  start.setMonth(start.getMonth() - months);

  const pick = <T,>(list: T[]): T => list[Math.floor(rand() * list.length)];
  const amount = (min: number, max: number) =>
    Math.round(min + rand() * (max - min));

  const drafts: SeedDraft[] = [];

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
    day.setDate(day.getDate() + Math.floor(rand() * months * 30));
    drafts.push({
      categoryId,
      amountCents: amount(1800, 14000),
      description: pick(["Farmacia", "Dentista", "Consulta médica", "Fisioterapia"]),
      spentAt: toISODate(day > today ? today : day),
    });
  }
  for (const trip of TRIPS) {
    const categoryId = byName.get(TRIP_CATEGORY);
    if (!categoryId) continue;
    const day = new Date(start);
    day.setDate(day.getDate() + Math.floor(rand() * (months * 30 - 10)));
    drafts.push({
      categoryId,
      amountCents: amount(trip.minCents, trip.maxCents),
      description: trip.title,
      spentAt: toISODate(day),
    });
  }

  drafts.sort((a, b) => a.spentAt.localeCompare(b.spentAt));

  return { drafts, missingCategories };
}