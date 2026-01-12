import Link from "next/link";

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
        <Link
          href="/api/docs"
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
            Database API Docs
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "10px" }}>
            Supabase PostgREST API documentation generated from database schema
          </p>
          <span style={{ color: "#3498db", fontWeight: "500" }}>
            Ver documentación →
          </span>
        </Link>

        <Link
          href="/api/docs/api"
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
            API Routes Docs
          </h2>
          <p style={{ color: "#7f8c8d", marginBottom: "10px" }}>
            Next.js API Routes documentation generated from swagger-jsdoc annotations
          </p>
          <span style={{ color: "#49cc90", fontWeight: "500" }}>
            Ver documentación →
          </span>
        </Link>
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
            <strong>Database API Docs:</strong> Documentación automática de las
            APIs de Supabase PostgREST generada desde la base de datos. Incluye
            todas las tablas y operaciones disponibles a través de PostgREST.
          </li>
          <li>
            <strong>API Routes Docs:</strong> Documentación de las rutas API de
            Next.js generada desde anotaciones swagger-jsdoc en el código. Incluye
            endpoints personalizados, validaciones y lógica de negocio.
          </li>
        </ul>
      </div>
    </div>
  );
}
