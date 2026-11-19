"use client";

import { SignOutIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstallDesktopCard } from "@/panel/InstallDesktop";
import { authClient, useSession } from "@/panel/auth-client";
import { useLanguage } from "@/panel/LanguageProvider";
import { useTheme } from "@/panel/ThemeProvider";
import {
  PageContainer,
  PageHeader,
  PanelButton,
  SegmentedControl,
} from "@/panel/ui";

const ROLE_LABEL: Record<string, string> = {
  platform: "Plataforma",
  dj: "DJ",
};

export default function GigbladeSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const user = session?.user as
    | { name?: string; email?: string; role?: string; slug?: string }
    | undefined;

  const signOut = async () => {
    try {
      await authClient.signOut();
    } finally {
      router.replace("/sign-in");
    }
  };

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        eyebrow="Cuenta"
        title={t("nav.settings", "Ajustes")}
        subtitle="Cuenta, apariencia, idioma y sesión activa de este panel"
      />

      <section className="card-shell">
        <div className="card-panel p-5 space-y-4">
          <div>
            <h2 className="text-[14px] font-semibold text-grayscale-12">
              Cuenta
            </h2>
            <p className="mt-0.5 text-[12.5px] text-grayscale-10">
              Los datos de la sesión activa en este navegador.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="surface-soft p-3.5">
              <span className="section-label block">Nombre</span>
              <p className="mt-1 text-[13px] font-medium text-grayscale-12">
                {user?.name || "GigBlades"}
              </p>
            </div>
            <div className="surface-soft p-3.5">
              <span className="section-label block">Correo</span>
              <p className="mt-1 break-all font-mono text-[12.5px] text-grayscale-12">
                {user?.email || "—"}
              </p>
            </div>
            <div className="surface-soft p-3.5">
              <span className="section-label block">Rol</span>
              <p className="mt-1 text-[13px] font-medium text-grayscale-12">
                {ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "—"}
              </p>
            </div>
            {user?.slug ? (
              <div className="surface-soft p-3.5">
                <span className="section-label block">Página</span>
                <p className="mt-1 font-mono text-[12.5px] text-grayscale-12">
                  {user.slug}
                </p>
              </div>
            ) : null}
          </div>
        </div>
        <div className="px-5 py-2.5 text-[11px] text-grayscale-9">
          Sesión autenticada con cookie segura HttpOnly
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-grayscale-12">
            Apariencia
          </h2>
          <p className="mt-0.5 text-[12.5px] text-grayscale-10">
            Cambiá entre modo claro papel o modo oscuro.
          </p>
        </div>
        <SegmentedControl
          value={theme}
          onChange={setTheme}
          ariaLabel="Tema"
          options={[
            { value: "light", label: "Claro" },
            { value: "dark", label: "Oscuro" },
            { value: "system", label: "Sistema" },
          ]}
        />
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-grayscale-12">
            {t("language.title", "Idioma")}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-grayscale-10">
            Se guarda en este navegador y se aplica a todo el panel.
          </p>
        </div>
        <SegmentedControl
          value={language}
          onChange={setLanguage}
          ariaLabel="Idioma"
          options={[
            { value: "es", label: "Español" },
            { value: "en", label: "English" },
          ]}
        />
      </section>

      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-grayscale-12">Plan</h2>
          <p className="mt-0.5 text-[12.5px] text-grayscale-10">
            El plan de GigBlades y los DJs activos están disponibles en Plan.
          </p>
        </div>
        <Link
          href="/plan"
          className="inline-flex h-8 items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 px-3 text-[12px] font-medium text-grayscale-11 transition-colors hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 dark:bg-grayscale-2"
        >
          Ver plan →
        </Link>
      </section>

      <InstallDesktopCard />

      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-grayscale-12">
            Sesión
          </h2>
          <p className="mt-0.5 text-[12.5px] text-grayscale-10">
            Cerrar sesión en este navegador. Las páginas publicadas quedan
            intactas.
          </p>
        </div>
        <PanelButton
          variant="secondary"
          size="sm"
          onClick={() => void signOut()}
          className="text-red-11 hover:bg-red-3/50"
        >
          <SignOutIcon size={14} />
          <span>{t("auth.signOut", "Cerrar sesión")}</span>
        </PanelButton>
      </section>
    </PageContainer>
  );
}
