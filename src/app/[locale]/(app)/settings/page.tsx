import { getTranslations } from "next-intl/server";

import { getActor } from "@/modules/users/actor";
import { SettingsForm } from "@/modules/users/ui/settings-form";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const actor = await getActor();

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">{t("title")}</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <SettingsForm locale={actor.locale} currency={actor.currency} />
      </div>
    </section>
  );
}
