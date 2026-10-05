export async function sendDjAccessEmail(input: {
  to: string;
  name: string;
  password: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.PANEL_MAIL_FROM?.trim();
  if (!key || !from) return false;

  const dashboard =
    process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "") ||
    "http://localhost:3001";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: "Tu acceso a GigBlade",
      text: [
        `Hola ${input.name},`,
        "",
        "Tu página ya está en GigBlade.",
        "",
        `Entrá al panel: ${dashboard}/sign-in`,
        `Correo: ${input.to}`,
        `Contraseña: ${input.password}`,
        "",
        "El link para pegar en Instagram está en Mi página.",
      ].join("\n"),
    }),
  });

  return response.ok;
}
