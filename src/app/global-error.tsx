"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0a",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", margin: "0 0 8px" }}>
            Algo salió mal
          </h1>
          <p style={{ fontSize: "14px", color: "#a3a3a3", margin: "0 0 20px" }}>
            No pudimos cargar esta página en este momento.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "#f5f5f5",
              color: "#0a0a0a",
              border: 0,
              borderRadius: "6px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
