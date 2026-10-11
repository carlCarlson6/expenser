import { auth } from "@clerk/nextjs/server";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link, redirect } from "@/i18n/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    redirect({ href: "/", locale: routing.defaultLocale });
  }
  setRequestLocale(locale);

  const { userId } = await auth();
  if (userId) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("landing");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="rounded-lg text-base font-bold tracking-tight transition-opacity hover:opacity-70"
          >
            {t("appName")}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {t("nav.signIn")}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {t("nav.signUp")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            {t("hero.subtitle")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {t("hero.cta.primary")}
            </Link>
            <Link
              href="/sign-in"
              className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {t("hero.cta.secondary")}
            </Link>
          </div>
        </section>

        <section className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-900">
              {t("features.title")}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<ListIcon />}
                title={t("features.expenses.title")}
                description={t("features.expenses.description")}
              />
              <FeatureCard
                icon={<TagIcon />}
                title={t("features.categories.title")}
                description={t("features.categories.description")}
              />
              <FeatureCard
                icon={<ChartIcon />}
                title={t("features.charts.title")}
                description={t("features.charts.description")}
              />
              <FeatureCard
                icon={<ImportIcon />}
                title={t("features.import.title")}
                description={t("features.import.description")}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("cta.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600">
            {t("cta.subtitle")}
          </p>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              {t("cta.button")}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} {t("appName")}
          </p>
          <div className="flex items-center gap-4">
            <LocaleLink locale="es" label={t("locales.spanish")} />
            <LocaleLink locale="en" label={t("locales.english")} />
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-zinc-900 shadow-sm">
        {icon}
      </div>
      <h3 className="mt-4 font-medium text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        {description}
      </p>
    </div>
  );
}

function LocaleLink({ locale, label }: { locale: string; label: string }) {
  return (
    <Link
      href="/"
      locale={locale}
      className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
    >
      {label}
    </Link>
  );
}

function ListIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7" cy="7" r="2" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function ImportIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
