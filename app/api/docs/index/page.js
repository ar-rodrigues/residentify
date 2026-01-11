/**
 * Documentation index page
 * Shows links to different documentation options
 */
export default function DocsIndexPage() {
  // Check if running in development mode
  const isDevelopment =
    process.env.DEVELOPMENT === "true" ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === "true" ||
    process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>Documentación no disponible</h1>
        <p>La documentación solo está disponible en modo desarrollo.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "30px", color: "#2c3e50" }}>
        API Documentation
      </h1>

      <div
        style={{
          display: "grid",
          gap: "20px",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        <a
          href="/api/docs/html"
          style={{
            display: "block",
            padding: "30px",
            border: "2px solid #3498db",
            borderRadius: "8px",
            textDecoration: "none",
            color: "#2c3e50",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f8ff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h2 style={{ marginBottom: "10px", color: "#3498db" }}>
            Scalar API Docs
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "10px" }}>
            Supabase PostgREST API documentation
          </p>
          <span style={{ color: "#3498db", fontWeight: "500" }}>
            Ver documentación →
          </span>
        </a>

        <a
          href="/api/docs/code"
          style={{
            display: "block",
            padding: "30px",
            border: "2px solid #49cc90",
            borderRadius: "8px",
            textDecoration: "none",
            color: "#2c3e50",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0fff4";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <h2 style={{ marginBottom: "10px", color: "#49cc90" }}>
            Code API Docs
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "10px" }}>
            Next.js API Routes documentation (JSDoc)
          </p>
          <span style={{ color: "#49cc90", fontWeight: "500" }}>
            Ver documentación →
          </span>
        </a>
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginBottom: "10px", color: "#2c3e50" }}>
          Sobre la documentación
        </h3>
        <ul style={{ color: "#555", lineHeight: "1.8" }}>
          <li>
            <strong>Scalar API Docs:</strong> Documentación automática de las
            APIs de Supabase PostgREST generada desde la base de datos.
          </li>
          <li>
            <strong>Code API Docs:</strong> Documentación de las rutas API de
            Next.js generada desde comentarios JSDoc en el código.
          </li>
        </ul>
      </div>
    </div>
  );
}
