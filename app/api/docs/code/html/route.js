import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/docs/code/html
 * Renders code documentation from JSDoc comments in API routes
 * Only accessible in development mode
 */
export async function GET() {
  try {
    // Check if running in development mode
    const isDevelopment =
      process.env.DEVELOPMENT === "true" ||
      process.env.NEXT_PUBLIC_DEVELOPMENT === "true" ||
      process.env.NODE_ENV === "development";

    if (!isDevelopment) {
      return NextResponse.json(
        {
          error: true,
          message: "API documentation is only available in development mode.",
        },
        { status: 403 }
      );
    }

    // Get the project root directory (process.cwd() in Next.js)
    const projectRoot = process.cwd();
    const apiDir = path.join(projectRoot, "app", "api");
    const typesPath = path.join(projectRoot, "types", "database.types.js");

    // Parse database types
    const databaseTypes = parseDatabaseTypes(typesPath);

    // Scan API routes and extract JSDoc
    const routes = scanApiRoutes(apiDir, projectRoot);

    // Generate HTML
    const html = generateHTML(routes, databaseTypes);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Unexpected error generating code documentation:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Error inesperado al generar la documentación del código.",
      },
      { status: 500 }
    );
  }
}

/**
 * Parse database.types.js and extract typedefs
 */
function parseDatabaseTypes(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf8");
  const types = {};

  // Regex to match @typedef blocks
  const typedefRegex = /\/\*\*([\s\S]*?)@typedef\s+\{([^}]+)\}\s+(\w+)([\s\S]*?)\*\//g;
  let match;

  while ((match = typedefRegex.exec(content)) !== null) {
    const properties = [];
    const propsBlock = match[4];
    const typeName = match[3];

    // Regex to match @property tags
    const propRegex = /@property\s+\{([^}]+)\}\s+(\[?[\w.]+\]?)(?:\s+-\s+(.+))?/g;
    let propMatch;
    while ((propMatch = propRegex.exec(propsBlock)) !== null) {
      const isOptional = propMatch[2].startsWith("[") && propMatch[2].endsWith("]");
      const name = isOptional ? propMatch[2].slice(1, -1) : propMatch[2];

      properties.push({
        type: propMatch[1].trim(),
        name: name.trim(),
        description: propMatch[3] ? propMatch[3].trim() : "",
        optional: isOptional,
      });
    }

    types[typeName] = {
      name: typeName,
      properties,
    };
  }

  return types;
}

/**
 * Scan API routes directory and extract JSDoc comments
 */
function scanApiRoutes(dir, projectRoot, basePath = "/api") {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Handle dynamic routes [id], [token], etc.
      const segment =
        entry.name.startsWith("[") && entry.name.endsWith("]")
          ? `{${entry.name.slice(1, -1)}}`
          : entry.name;

      const childRoutes = scanApiRoutes(
        fullPath,
        projectRoot,
        `${basePath}/${segment}`
      );
      routes.push(...childRoutes);
    } else if (entry.name === "route.js") {
      // Extract JSDoc from route file
      const content = fs.readFileSync(fullPath, "utf8");
      const relativePath = path.relative(projectRoot, fullPath);
      const routeInfo = extractRouteInfo(content, basePath, relativePath);
      if (routeInfo) {
        routes.push(routeInfo);
      }
    }
  }

  return routes;
}

/**
 * Extract route information from file content
 */
function extractRouteInfo(content, routePath, filePath) {
  const routes = [];

  // Extract HTTP methods and their JSDoc comments
  const methodPatterns = [
    { method: "GET", regex: /export\s+async\s+function\s+GET\s*\(/ },
    { method: "POST", regex: /export\s+async\s+function\s+POST\s*\(/ },
    { method: "PUT", regex: /export\s+async\s+function\s+PUT\s*\(/ },
    { method: "DELETE", regex: /export\s+async\s+function\s+DELETE\s*\(/ },
    { method: "PATCH", regex: /export\s+async\s+function\s+PATCH\s*\(/ },
  ];

  for (const { method, regex } of methodPatterns) {
    const match = content.match(regex);
    if (match) {
      // Find JSDoc comment before this function
      const beforeFunction = content.substring(0, match.index);
      const jsdocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\//g);

      if (!jsdocMatch || jsdocMatch.length === 0) continue;

      // Get the last JSDoc comment (closest to the function)
      const lastJSDoc = jsdocMatch[jsdocMatch.length - 1];

      // Clean JSDoc
      const lines = lastJSDoc
        .replace(/\/\*\*|\*\/|^\s*\* ?/gm, "")
        .split("\n")
        .map((line) => line.trim());

      let description = "";
      const params = [];
      const responses = [];
      const examples = [];
      const auth = [];
      let body = null;
      let returns = null;

      let currentTag = null;
      let currentContent = [];

      const flushTag = () => {
        const text = currentContent.join(" ").trim();
        if (!currentTag) {
          description = text;
        } else if (currentTag === "@param") {
          const m = text.match(/\{([^}]+)\}\s+(\w+)\s*-\s*(.+)/);
          if (m) {
            params.push({ type: m[1], name: m[2], description: m[3] });
          } else {
            const m2 = text.match(/\{([^}]+)\}\s+(\w+)\s*(.+)?/);
            if (m2)
              params.push({
                type: m2[1],
                name: m2[2],
                description: m2[3] || "",
              });
          }
        } else if (currentTag === "@returns") {
          const m = text.match(/\{([^}]+)\}\s*(.+)?/);
          if (m) returns = { type: m[1], description: m[2] || "" };
        } else if (currentTag === "@body") {
          const m = text.match(/\{([^}]+)\}\s*(.+)?/);
          if (m) body = { type: m[1], description: m[2] || "" };
        } else if (currentTag === "@response") {
          const m = text.match(/(\d+)\s+\{([^}]+)\}\s*(.+)?/);
          if (m) {
            responses.push({
              code: m[1],
              type: m[2],
              description: m[3] || "",
            });
          }
        } else if (currentTag === "@auth") {
          const m = text.match(/\{([^}]+)\}\s*(.+)?/);
          if (m) auth.push({ type: m[1], description: m[2] || "" });
        } else if (currentTag === "@example") {
          examples.push(currentContent.join("\n").trim());
        }
      };

      for (const line of lines) {
        if (line.startsWith("@")) {
          flushTag();
          const tagMatch = line.match(/^(@\w+)/);
          currentTag = tagMatch ? tagMatch[1] : null;
          currentContent = [line.replace(currentTag, "").trim()];
        } else {
          currentContent.push(line);
        }
      }
      flushTag();

      routes.push({
        method,
        path: routePath,
        description,
        params,
        body,
        responses,
        returns,
        examples,
        auth,
        filePath,
      });
    }
  }

  return routes.length > 0 ? { path: routePath, routes, filePath } : null;
}

/**
 * Generate HTML documentation
 */
function generateHTML(routesData, databaseTypes) {
  // Build hierarchy tree
  const tree = buildTree(routesData);

  // Group all routes flat for the main content
  const allRoutes = [];
  for (const routeData of routesData) {
    allRoutes.push(...routeData.routes);
  }

  // Sort routes by path
  const sortedRouteData = [...routesData].sort((a, b) =>
    a.path.localeCompare(b.path)
  );

  const routesHtml = sortedRouteData
    .map((routeData) => {
      const groupID = 'group-' + routeData.path.split("/").join("-").replace(/[{}]/g, "");
      const groupRoutesHtml = routeData.routes
        .map((route) => {
          const routeID = route.method + '-' + route.path.split("/").join("-").replace(/[{}]/g, "");

          const renderType = (type) => {
            if (!type) return "";
            const cleanType = type.replace(/^Array<|>$|^Promise<|>/g, "");
            if (databaseTypes[cleanType]) {
              return '<a href="#model-' + cleanType + '" class="type-link">' + type + '</a>';
            }
            return '<span class="type">' + type + '</span>';
          };

          const paramsHtml =
            route.params.length > 0
              ? `
          <div class="section">
            <h4>Parámetros:</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                ${route.params
                  .map(
                    (param) => '<tr><td><code>' + param.name + '</code></td><td>' + renderType(param.type) + '</td><td>' + param.description + '</td></tr>'
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
              : "";

          const authHtml =
            route.auth && route.auth.length > 0
              ? `
          <div class="section auth-section">
            <h4>Autenticación:</h4>
            <div class="auth-badges">
              ${route.auth
                .map(
                  (a) => '<div class="auth-item"><span class="auth-type badge">' + a.type + '</span><span class="auth-desc">' + a.description + '</span></div>'
                )
                .join("")}
            </div>
          </div>
        `
              : "";

          const bodyHtml = route.body
            ? `
          <div class="section body-section">
            <h4>Cuerpo (JSON):</h4>
            <div class="type-box">
              <div class="type-header">${renderType(route.body.type)}</div>
              <p>${route.body.description}</p>
            </div>
          </div>
        `
            : "";

          const responsesHtml =
            route.responses && route.responses.length > 0
              ? `
          <div class="section responses-section">
            <h4>Respuestas:</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                ${route.responses
                  .map(
                    (res) => '<tr><td><span class="res-code badge status-' + (res.code.startsWith("2") ? "success" : "error") + '">' + res.code + '</span></td><td>' + renderType(res.type) + '</td><td>' + res.description + '</td></tr>'
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        `
              : "";

          const examplesHtml =
            route.examples && route.examples.length > 0
              ? `
          <div class="section examples-section">
            <h4>Ejemplos:</h4>
            ${route.examples
              .map(
                (ex) => '<pre class="example-box"><code>' + ex + '</code></pre>'
              )
              .join("")}
          </div>
        `
              : "";

          const returnsHtml = route.returns
            ? `
          <div class="section returns-section">
            <h4>Retorna:</h4>
            <div class="type-box">
              <div class="type-header">${renderType(route.returns.type)}</div>
              <p>${route.returns.description}</p>
            </div>
          </div>
        `
            : "";

          return `
          <div class="route-method" id="${routeID}">
            <div class="method-header" onclick="toggleDetails('${routeID}')">
              <div class="method-badge method-${route.method.toLowerCase()}">${route.method}</div>
              <h3>${route.path}</h3>
              <span class="toggle-icon">▼</span>
            </div>
            <div class="route-content details-hidden" id="details-${routeID}">
              <div class="route-meta">Archivo: <code>${route.filePath}</code></div>
              ${route.description ? `<p class="description">${route.description}</p>` : ""}
              ${authHtml}
              ${paramsHtml}
              ${bodyHtml}
              ${responsesHtml}
              ${returnsHtml}
              ${examplesHtml}
            </div>
          </div>
        `;
        })
        .join("");

      return `
        <div class="route-group" id="${groupID}">
          <div class="group-header">
            <h2>${routeData.path}</h2>
            <span class="file-path">${routeData.filePath}</span>
          </div>
          ${groupRoutesHtml}
        </div>
      `;
    })
    .join("");

  // Generate Models Section
  const modelsHtml = Object.values(databaseTypes)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((type) => {
      const propsHtml = type.properties
        .map(
          (p) => '<tr><td><code>' + p.name + (p.optional ? "?" : "") + '</code></td><td><span class="type">' + p.type + '</span></td><td>' + p.description + '</td></tr>'
        )
        .join("");

      return `
      <div class="model-card" id="model-${type.name}">
        <h3>${type.name}</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Tipo</th>
              <th>Descripción</th>
            </tr>
          </thead>
          <tbody>
            ${propsHtml}
          </tbody>
        </table>
      </div>
    `;
    })
    .join("");

  // Generate sidebar HTML from tree
  const sidebarHtml = generateSidebarTree(tree);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Silver API - Documentación Técnica</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563eb;
      --primary-light: #eff6ff;
      --secondary: #1e293b;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --bg: #f8fafc;
      --sidebar-bg: #ffffff;
      --card-bg: #ffffff;
      --text: #334155;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --code-bg: #1e293b;
      --code-text: #f8fafc;
      --get: #3b82f6;
      --post: #10b981;
      --put: #f59e0b;
      --delete: #ef4444;
      --patch: #8b5cf6;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.5;
      color: var(--text);
      background: var(--bg);
      display: flex;
      min-height: 100vh;
    }

    aside {
      width: 320px;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--border);
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 0;
      z-index: 100;
    }

    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }

    .sidebar-header h4 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .sidebar-tree {
      padding: 12px 16px;
      list-style: none;
    }

    .tree-node {
      margin-bottom: 4px;
    }

    .tree-folder {
      display: flex;
      align-items: center;
      padding: 6px 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--secondary);
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .tree-folder:hover {
      background: var(--primary-light);
    }

    .tree-folder::before {
      content: "📁";
      margin-right: 8px;
      font-size: 0.9rem;
    }

    .tree-children {
      margin-left: 20px;
      border-left: 1px solid var(--border);
      padding-left: 8px;
    }

    .tree-leaf {
      display: block;
      padding: 6px 8px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      text-decoration: none;
      border-radius: 4px;
      transition: all 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tree-leaf:hover {
      background: var(--primary-light);
      color: var(--primary);
    }

    .tree-leaf.active {
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 600;
    }

    main {
      flex: 1;
      padding: 40px;
      max-width: 1100px;
      margin: 0 auto;
    }
    
    .container {
      max-width: 100%;
    }
    
    header {
      margin-bottom: 48px;
    }

    h1 { color: var(--secondary); font-size: 2.5rem; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 8px; }
    .subtitle { color: var(--text-muted); font-size: 1.125rem; }
    
    .nav-links {
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }
    
    .nav-links a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.875rem;
      padding: 8px 16px;
      background: white;
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: all 0.2s;
    }
    
    .nav-links a:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .search-container {
      margin-bottom: 40px;
      position: sticky;
      top: 20px;
      z-index: 50;
    }

    #apiSearch {
      width: 100%;
      padding: 14px 20px;
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 1rem;
      outline: none;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      transition: all 0.2s;
    }

    #apiSearch:focus {
      border-color: var(--primary);
      ring: 2px solid var(--primary-light);
    }
    
    .route-group {
      margin-bottom: 64px;
      scroll-margin-top: 100px;
    }

    .group-header {
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    
    .group-header h2 {
      color: var(--secondary);
      font-size: 1.5rem;
      font-weight: 700;
      font-family: 'Fira Code', monospace;
    }

    .file-path {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: 'Fira Code', monospace;
    }
    
    .route-method {
      margin-bottom: 16px;
      background: white;
      border-radius: 12px;
      border: 1px solid var(--border);
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    .method-header {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }

    .method-header:hover {
      background: #fafafa;
    }
    
    .method-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 0.75rem;
      text-transform: uppercase;
      min-width: 72px;
      text-align: center;
      color: white;
    }
    
    .method-get { background: var(--get); }
    .method-post { background: var(--post); }
    .method-put { background: var(--put); }
    .method-delete { background: var(--delete); }
    .method-patch { background: var(--patch); }
    
    .method-header h3 {
      font-family: 'Fira Code', monospace;
      font-size: 1rem;
      color: var(--secondary);
      flex: 1;
      word-break: break-all;
    }

    .toggle-icon {
      color: var(--text-muted);
      transition: transform 0.3s;
      font-size: 0.8rem;
    }

    .details-visible .toggle-icon {
      transform: rotate(180deg);
    }

    .route-content {
      padding: 24px 32px;
      border-top: 1px solid var(--border);
      background: #fff;
    }

    .details-hidden {
      display: none;
    }

    .route-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    
    .description {
      color: var(--text);
      margin-bottom: 32px;
      font-size: 1.05rem;
      padding-left: 16px;
      border-left: 4px solid var(--primary);
    }
    
    .section {
      margin-bottom: 32px;
    }

    .section h4 {
      color: var(--secondary);
      margin-bottom: 16px;
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th {
      text-align: left;
      padding: 12px;
      background: var(--bg);
      border-bottom: 2px solid var(--border);
      color: var(--secondary);
      font-weight: 600;
    }

    .data-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    
    code {
      font-family: 'Fira Code', monospace;
      background: var(--primary-light);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.875rem;
      color: var(--primary);
    }
    
    .type {
      color: var(--text-muted);
      font-size: 0.8125rem;
      background: var(--bg);
      padding: 2px 8px;
      border-radius: 6px;
      border: 1px solid var(--border);
    }

    .type-link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px dashed var(--primary);
    }

    .type-link:hover {
      background: var(--primary-light);
    }
    
    .type-box {
      padding: 16px;
      background: var(--bg);
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .type-header {
      margin-bottom: 8px;
      display: block;
    }

    .badge {
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-success { background: #dcfce7; color: #166534; }
    .status-error { background: #fee2e2; color: #991b1b; }
    
    .auth-badges {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .auth-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .auth-type {
      background: #e0f2fe;
      color: #075985;
      min-width: 80px;
      text-align: center;
    }

    .example-box {
      background: var(--code-bg);
      color: var(--code-text);
      padding: 20px;
      border-radius: 8px;
      overflow-x: auto;
      margin-top: 12px;
      font-family: 'Fira Code', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .example-box code {
      background: transparent;
      color: inherit;
      padding: 0;
    }

    /* Models Section */
    .models-section {
      margin-top: 80px;
      padding-top: 60px;
      border-top: 2px solid var(--border);
    }

    .model-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      scroll-margin-top: 100px;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    .model-card h3 {
      font-size: 1.25rem;
      color: var(--secondary);
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .model-card h3::before {
      content: "📦";
      font-size: 1.1rem;
    }

    @media (max-width: 1024px) {
      aside { width: 260px; }
    }

    @media (max-width: 768px) {
      body { flex-direction: column; }
      aside { width: 100%; height: auto; position: static; }
      main { padding: 24px; }
      .method-header { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <aside>
    <div class="sidebar-header">
      <h4>Endpoints</h4>
    </div>
    <ul class="sidebar-tree">
      ${sidebarHtml}
      <li class="tree-node" style="margin-top: 24px;">
        <div class="tree-folder" onclick="location.href='#models-title'">📦 Modelos</div>
        <ul class="tree-children">
          ${Object.keys(databaseTypes)
            .sort()
            .map(
              (name) => '<li><a href="#model-' + name + '" class="tree-leaf">' + name + '</a></li>'
            )
            .join("")}
        </ul>
      </li>
    </ul>
  </aside>

  <main>
    <div class="container">
      <header>
        <h1>Silver API</h1>
        <p class="subtitle">Documentación técnica generada automáticamente desde JSDoc</p>
        
        <div class="nav-links">
          <a href="/api/docs">← Documentación Scalar</a>
          <a href="/api/docs/code">🔄 Actualizar</a>
        </div>
      </header>
      
      <div class="search-container">
        <input type="text" id="apiSearch" placeholder="Buscar por ruta, método o descripción...">
      </div>
      
      <div id="routesContainer">
        ${routesHtml || "<p>No se encontraron rutas de API documentadas.</p>"}
      </div>

      <div class="models-section">
        <h2 id="models-title" style="margin-bottom: 32px; font-size: 2rem;">Modelos de Datos</h2>
        <div id="modelsContainer">
          ${modelsHtml || "<p>No se encontraron modelos de datos.</p>"}
        </div>
      </div>
    </div>
  </main>

  <script>
    function toggleDetails(id) {
      const content = document.getElementById('details-' + id);
      const header = content.previousElementSibling;
      if (content.classList.contains('details-hidden')) {
        content.classList.remove('details-hidden');
        header.classList.add('details-visible');
      } else {
        content.classList.add('details-hidden');
        header.classList.remove('details-visible');
      }
    }

    function toggleFolder(el) {
      const children = el.nextElementSibling;
      if (children.style.display === 'none') {
        children.style.display = 'block';
      } else {
        children.style.display = 'none';
      }
    }

    document.getElementById('apiSearch').addEventListener('input', function(e) {
      const term = e.target.value.toLowerCase();
      const routes = document.querySelectorAll('.route-method');
      const groups = document.querySelectorAll('.route-group');

      routes.forEach(route => {
        const text = route.innerText.toLowerCase();
        if (text.includes(term)) {
          route.style.display = 'block';
          if (term !== '') {
            const content = route.querySelector('.route-content');
            content.classList.remove('details-hidden');
            route.querySelector('.method-header').classList.add('details-visible');
          }
        } else {
          route.style.display = 'none';
        }
      });

      groups.forEach(group => {
        const visibleRoutes = Array.from(group.querySelectorAll('.route-method')).filter(r => r.style.display !== 'none').length;
        group.style.display = (term === '' || visibleRoutes > 0) ? 'block' : 'none';
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Build a tree structure from route paths
 */
function buildTree(routesData) {
  const tree = {};

  for (const routeData of routesData) {
    const parts = routeData.path.split("/").filter((p) => p && p !== "api");
    let current = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {
          _isRoute: i === parts.length - 1,
          _data: null,
          children: {},
        };
      }
      if (i === parts.length - 1) {
        current[part]._data = routeData;
      }
      current = current[part].children;
    }
  }

  return tree;
}

/**
 * Generate sidebar tree HTML
 */
function generateSidebarTree(tree) {
  let html = '';
  const keys = Object.keys(tree).sort();

  for (const key of keys) {
    const node = tree[key];
    const hasChildren = Object.keys(node.children).length > 0;
    const groupID = node._data
      ? 'group-' + node._data.path.split('/').join('-').replace(/[{}]/g, '')
      : null;

    html += '<li class="tree-node">';

    if (hasChildren) {
      html += '<div class="tree-folder" onclick="toggleFolder(this)">' + key + '</div>';
      html += '<ul class="tree-children">';
      if (node._isRoute) {
        html += '<li><a href="#' + groupID + '" class="tree-leaf">Index</a></li>';
      }
      html += generateSidebarTree(node.children);
      html += '</ul>';
    } else if (node._isRoute) {
      html += '<a href="#' + groupID + '" class="tree-leaf">' + key + '</a>';
    }

    html += '</li>';
  }

  return html;
}
