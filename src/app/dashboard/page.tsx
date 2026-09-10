import { getApp, getRuntime } from "@/lib/composition/app";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenants = await getApp().tenants.list();
  const active = tenants.filter((tenant) => tenant.status === "active").length;

  return (
    <>
      <div className="dash-banner">
        MFA y sesión admin aún no están activos. Este panel es operativo, no público.
      </div>
      <h1>Resumen</h1>
      <p className="dash-note">Runtime: {getRuntime()}</p>
      <section className="dash-stats">
        <div className="dash-stat">
          <strong>{tenants.length}</strong>
          <span>Tenants</span>
        </div>
        <div className="dash-stat">
          <strong>{active}</strong>
          <span>Activos</span>
        </div>
        <div className="dash-stat">
          <strong>0</strong>
          <span>Dominios en provisión</span>
        </div>
      </section>
    </>
  );
}
