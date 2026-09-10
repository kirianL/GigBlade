import type { ReactNode } from "react";
import Link from "next/link";
import { Syne } from "next/font/google";

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

type DashboardLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={`dash ${display.variable}`}>
      <aside className="dash-side">
        <div className="dash-brand">GigBlade</div>
        <nav className="dash-nav">
          <Link href="/dashboard">Resumen</Link>
          <Link href="/dashboard/tenants">Tenants</Link>
          <Link href="/">Ver landing</Link>
        </nav>
      </aside>
      <div className="dash-main">{children}</div>
    </div>
  );
}
