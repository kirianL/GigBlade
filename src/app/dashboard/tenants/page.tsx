import { getApp } from "@/lib/composition/app";
import { readLandingTheme } from "@/lib/tenant/theme";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const tenants = await getApp().tenants.list();

  return (
    <>
      <h1>Tenants</h1>
      <p className="dash-note">Listado de DJs en la plataforma. Sin bookings.</p>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Slug</th>
            <th>Plan</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => {
            const theme = readLandingTheme(tenant.slug, tenant.themeConfig);
            return (
              <tr key={tenant.id}>
                <td>{theme.displayName}</td>
                <td>{tenant.slug}</td>
                <td>{tenant.plan}</td>
                <td className={tenant.status === "active" ? "status-active" : "status-other"}>
                  {tenant.status}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
