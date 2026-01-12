const fs = require('fs');
const path = require('path');

/**
 * Scan API routes directory and extract route information
 */
function scanApiRoutes(dir, projectRoot, basePath = '/api') {
  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip docs directory to avoid scanning documentation routes
    if (entry.isDirectory() && entry.name === 'docs') {
      continue;
    }

    if (entry.isDirectory()) {
      // Handle dynamic routes [id], [token], etc.
      const segment =
        entry.name.startsWith('[') && entry.name.endsWith(']')
          ? `{${entry.name.slice(1, -1)}}`
          : entry.name;

      const childRoutes = scanApiRoutes(
        fullPath,
        projectRoot,
        `${basePath}/${segment}`
      );
      routes.push(...childRoutes);
    } else if (entry.name === 'route.js') {
      // Extract route information from file
      const content = fs.readFileSync(fullPath, 'utf8');
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
  const methods = [];
  const hasJSDoc = content.includes('/**');
  const hasSwagger = content.includes('@swagger');

  // Extract HTTP methods
  const methodPatterns = [
    { method: 'GET', regex: /export\s+async\s+function\s+GET\s*\(/ },
    { method: 'POST', regex: /export\s+async\s+function\s+POST\s*\(/ },
    { method: 'PUT', regex: /export\s+async\s+function\s+PUT\s*\(/ },
    { method: 'DELETE', regex: /export\s+async\s+function\s+DELETE\s*\(/ },
    { method: 'PATCH', regex: /export\s+async\s+function\s+PATCH\s*\(/ },
  ];

  for (const { method, regex } of methodPatterns) {
    if (regex.test(content)) {
      methods.push(method);
    }
  }

  if (methods.length === 0) {
    return null;
  }

  // Check if methods have JSDoc documentation
  const documentedMethods = [];
  const pendingMethods = [];

  for (const method of methods) {
    const methodRegex = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\(`
    );
    const match = content.match(methodRegex);
    if (match) {
      const beforeFunction = content.substring(0, match.index);
      const jsdocMatch = beforeFunction.match(/\/\*\*([\s\S]*?)\*\//);
      const hasMethodDoc = jsdocMatch !== null;
      const hasMethodSwagger = hasMethodDoc && jsdocMatch[0].includes('@swagger');

      if (hasMethodSwagger) {
        documentedMethods.push(method);
      } else if (hasMethodDoc) {
        pendingMethods.push(method);
      } else {
        pendingMethods.push(method);
      }
    }
  }

  return {
    path: routePath,
    methods,
    documentedMethods,
    pendingMethods,
    filePath,
    hasJSDoc,
    hasSwagger,
  };
}

/**
 * Group routes by resource category
 */
function groupRoutesByCategory(routes) {
  const categories = {};

  for (const route of routes) {
    const parts = route.path.split('/').filter((p) => p && p !== 'api');
    const category = parts[0] || 'root';

    if (!categories[category]) {
      categories[category] = [];
    }

    categories[category].push(route);
  }

  // Sort routes within each category by path
  for (const category in categories) {
    categories[category].sort((a, b) => a.path.localeCompare(b.path));
  }

  return categories;
}

/**
 * Generate API_ROUTES.md markdown document
 */
function generateRoutesDocument(routes) {
  const categories = groupRoutesByCategory(routes);

  // Calculate statistics
  const totalRoutes = routes.length;
  const totalMethods = routes.reduce((sum, r) => sum + r.methods.length, 0);
  const documentedMethods = routes.reduce(
    (sum, r) => sum + r.documentedMethods.length,
    0
  );
  const pendingMethods = routes.reduce(
    (sum, r) => sum + r.pendingMethods.length,
    0
  );
  const fullyDocumented = routes.filter(
    (r) => r.documentedMethods.length === r.methods.length
  ).length;
  const partiallyDocumented = routes.filter(
    (r) =>
      r.documentedMethods.length > 0 && r.documentedMethods.length < r.methods.length
  ).length;
  const notDocumented = routes.filter((r) => r.documentedMethods.length === 0)
    .length;

  let md = `# API Routes Inventory

> **Generated on:** ${new Date().toISOString()}
> 
> **To regenerate:** \`npm run scan-routes\` (add script to package.json)

## Summary Statistics

- **Total Routes:** ${totalRoutes}
- **Total HTTP Methods:** ${totalMethods}
- **Fully Documented Routes:** ${fullyDocumented} (${Math.round((fullyDocumented / totalRoutes) * 100)}%)
- **Partially Documented Routes:** ${partiallyDocumented}
- **Not Documented Routes:** ${notDocumented}
- **Documented Methods:** ${documentedMethods} (${Math.round((documentedMethods / totalMethods) * 100)}%)
- **Pending Documentation:** ${pendingMethods} methods

## Legend

- ✅ **Fully Documented** - All methods have swagger-jsdoc annotations
- ⚠️ **Partially Documented** - Some methods have swagger-jsdoc annotations
- ❌ **Not Documented** - No swagger-jsdoc annotations found

---

`;

  // Generate sections for each category
  const sortedCategories = Object.keys(categories).sort();

  for (const category of sortedCategories) {
    const categoryRoutes = categories[category];
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

    md += `## ${categoryName}\n\n`;

    for (const route of categoryRoutes) {
      const status =
        route.documentedMethods.length === route.methods.length
          ? '✅'
          : route.documentedMethods.length > 0
            ? '⚠️'
            : '❌';

      md += `### ${status} \`${route.path}\`\n\n`;
      md += `**File:** \`${route.filePath}\`\n\n`;
      md += `**Methods:** ${route.methods.join(', ')}\n\n`;

      if (route.documentedMethods.length > 0) {
        md += `- ✅ Documented: ${route.documentedMethods.join(', ')}\n`;
      }

      if (route.pendingMethods.length > 0) {
        md += `- ⚠️ Pending: ${route.pendingMethods.join(', ')}\n`;
      }

      md += '\n';
    }
  }

  md += `---

## Notes

- Routes are scanned from \`app/api\` directory
- Documentation status is based on presence of \`@swagger\` annotations
- Routes with JSDoc but no \`@swagger\` annotations are marked as pending
- Dynamic route segments are shown as \`{param}\` in paths

## Migration Status

This document tracks the migration from custom JSDoc to swagger-jsdoc format.
Routes should be converted incrementally, updating this document as progress is made.

`;

  return md;
}

/**
 * Main function to generate API routes inventory
 */
function generateRoutesInventory() {
  try {
    const projectRoot = process.cwd();
    const apiDir = path.join(projectRoot, 'app', 'api');
    const outputPath = path.join(projectRoot, 'docs', 'API_ROUTES.md');

    if (!fs.existsSync(apiDir)) {
      console.error('❌ Error: app/api directory not found at', apiDir);
      process.exit(1);
    }

    console.log('📖 Scanning API routes...');
    const routes = scanApiRoutes(apiDir, projectRoot);
    console.log(`   Found ${routes.length} routes\n`);

    // Generate markdown document
    const markdown = generateRoutesDocument(routes);

    // Ensure docs directory exists
    const docsDir = path.dirname(outputPath);
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(outputPath, markdown, 'utf8');

    console.log('✅ API routes inventory generated successfully!');
    console.log(`   Output: ${outputPath}`);
    console.log(`   Routes: ${routes.length}`);
    console.log(
      `   Methods: ${routes.reduce((sum, r) => sum + r.methods.length, 0)}`
    );

    // Print summary
    const documented = routes.filter(
      (r) => r.documentedMethods.length === r.methods.length
    ).length;
    const pending = routes.filter((r) => r.pendingMethods.length > 0).length;
    const notDoc = routes.filter((r) => r.documentedMethods.length === 0)
      .length;

    console.log(`\n   Status:`);
    console.log(`   - Fully documented: ${documented}`);
    console.log(`   - Partially documented: ${pending}`);
    console.log(`   - Not documented: ${notDoc}`);
  } catch (error) {
    console.error('\n❌ Error generating routes inventory:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateRoutesInventory();
}

module.exports = { generateRoutesInventory, scanApiRoutes, extractRouteInfo };
