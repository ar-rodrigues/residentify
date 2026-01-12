/**
 * OpenAPI specification generator using swagger-jsdoc
 * Dynamically generates OpenAPI 3.1 spec from JSDoc comments in route files
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from './config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load database type schemas if available
 */
function loadDatabaseSchemas() {
  try {
    const schemasPath = path.join(process.cwd(), 'types', 'database.schemas.js');
    if (fs.existsSync(schemasPath)) {
      // Database schemas will be loaded and merged
      // For now, return empty object - schemas will be added later
      // In the future, we can dynamically import the schemas
      return {};
    }
  } catch (error) {
    console.warn('Warning: Could not load database schemas:', error.message);
  }
  return {};
}

/**
 * Generate OpenAPI specification
 * @returns {Object} OpenAPI 3.1 specification object
 */
function generateOpenAPISpec() {
  try {
    // Generate spec from JSDoc comments
    const spec = swaggerJsdoc(swaggerOptions);

    // Load and merge database schemas
    const databaseSchemas = loadDatabaseSchemas();
    if (Object.keys(databaseSchemas).length > 0) {
      spec.components = spec.components || {};
      spec.components.schemas = {
        ...spec.components.schemas,
        ...databaseSchemas,
      };
    }

    // Ensure security is applied globally if needed
    if (!spec.security) {
      // Don't apply security globally - let each endpoint define its own
    }

    return spec;
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    throw new Error(`Failed to generate OpenAPI specification: ${error.message}`);
  }
}

/**
 * Validate OpenAPI specification
 * @param {Object} spec - OpenAPI specification object
 * @returns {boolean} True if valid
 */
function validateSpec(spec) {
  if (!spec.openapi) {
    throw new Error('Missing openapi version');
  }

  if (!spec.info) {
    throw new Error('Missing info section');
  }

  if (!spec.paths || Object.keys(spec.paths).length === 0) {
    console.warn('Warning: No paths found in OpenAPI spec');
  }

  return true;
}

/**
 * Get cached or generate fresh OpenAPI spec
 * In development, always generate fresh. In production, could cache.
 */
let cachedSpec = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute cache in development

function getOpenAPISpec(forceRefresh = false) {
  const isDevelopment =
    process.env.DEVELOPMENT === 'true' ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === 'true' ||
    process.env.NODE_ENV === 'development';

  // Always refresh in development or if forced
  if (isDevelopment || forceRefresh || !cachedSpec) {
    cachedSpec = generateOpenAPISpec();
    validateSpec(cachedSpec);
    cacheTimestamp = Date.now();
    return cachedSpec;
  }

  // Check cache expiry
  if (Date.now() - cacheTimestamp > CACHE_TTL) {
    cachedSpec = generateOpenAPISpec();
    validateSpec(cachedSpec);
    cacheTimestamp = Date.now();
  }

  return cachedSpec;
}

export {
  generateOpenAPISpec,
  getOpenAPISpec,
  validateSpec,
  loadDatabaseSchemas,
};
