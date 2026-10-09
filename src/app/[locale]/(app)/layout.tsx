import { UserButton } from "@clerk/nextjs";

import { redirect } from "@/i18n/navigation";
import { getActor } from "@/modules/users/actor";

import { Nav } from "./nav";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const actor = await getActor();

  // The profile's language is the durable preference; if the URL locale
  // disagrees (e.g. fresh device without the locale cookie), realign once.
  if (actor.locale !== locale) {
    redirect({ href: "/", locale: actor.locale });
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Nav />
          <UserButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
