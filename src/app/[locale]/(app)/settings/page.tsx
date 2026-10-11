import { getTranslations } from "next-intl/server";

import { getActor } from "@/modules/users/actor";
import { SettingsForm } from "@/modules/users/ui/settings-form";
import { GitHubIcon } from "@/shared/ui/github-icon";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");
  const actorResult = await getActor();
  if (!actorResult.ok) {
    throw new Error("Unauthorized");
  }
  const actor = actorResult.value;

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <SettingsForm locale={actor.locale} currency={actor.currency} />
      </div>
      <footer className="mt-8 text-center">
        <a
          href="https://github.com/carlCarlson6/expenser"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <GitHubIcon />
          {tCommon("sourceCode")}
        </a>
      </footer>
    </section>
  );
}
