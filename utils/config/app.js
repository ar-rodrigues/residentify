/**
 * Configuración central de la aplicación
 * Centraliza rutas públicas, menús, y configuraciones generales
 */

// ============================================================================
// RUTAS PÚBLICAS (No requieren autenticación)
// ============================================================================
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/auth",
  "/forgot-password",
  "/reset-password",
  "/public",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/help",
  "/faq",
  "/api/public",
];

// Patrones de rutas públicas (regex)
export const PUBLIC_PATTERNS = [
  /^\/public\/.*$/, // Todas las rutas que empiecen con /public/
  /^\/api\/public\/.*$/, // Todas las rutas de API públicas
  /^\/blog\/.*$/, // Todas las rutas de blog
];

// ============================================================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ============================================================================
export const PROTECTED_ROUTES = [
  "/dashboard",
  "/profile",
  "/admin",
  "/events/create",
  "/events/manage",
  "/guests",
  "/reports",
  "/settings",
  "/api/protected",
];

// ============================================================================
// MENÚ PRINCIPAL DE NAVEGACIÓN
// ============================================================================
export const MAIN_MENU = [
  {
    key: "home",
    label: "Inicio",
    path: "/",
    icon: "RiHomeLine",
    public: true,
  },
  {
    key: "features",
    label: "Características",
    path: "/features",
    icon: "RiRocketLine",
    public: true,
    children: [
      {
        key: "features-browse",
        label: "Explorar Características",
        path: "/features",
        public: true,
      },
      {
        key: "features-create",
        label: "Crear Característica",
        path: "/features/create",
        public: false,
      },
      {
        key: "features-manage",
        label: "Mis Características",
        path: "/features/manage",
        public: false,
      },
    ],
  },
  {
    key: "components",
    label: "Componentes",
    path: "/components",
    icon: "RiCodeLine",
    public: false,
  },
  {
    key: "about",
    label: "Acerca de",
    path: "/about",
    icon: "RiInformationLine",
    public: true,
  },
  {
    key: "contact",
    label: "Contacto",
    path: "/contact",
    icon: "RiMailLine",
    public: true,
  },
];

// ============================================================================
// MENÚ DE USUARIO (Header derecho)
// ============================================================================
export const USER_MENU = [
  {
    key: "profile",
    label: "Mi Perfil",
    path: "/profile",
    icon: "RiUserLine",
  },
  {
    key: "settings",
    label: "Configuración",
    path: "/settings",
    icon: "RiSettings3Line",
  },
  {
    key: "help",
    label: "Ayuda",
    path: "/help",
    icon: "RiQuestionLine",
  },
  {
    key: "logout",
    label: "Cerrar Sesión",
    icon: "RiLogoutBoxLine",
    action: "logout",
  },
];

// ============================================================================
// MENÚ PRIVADO (Sidebar navigation)
// ============================================================================
export const PRIVATE_MENU = [
  {
    key: "/organizations",
    iconName: "RiBuildingLine",
    label: "Organizaciones",
  },
  {
    key: "/profile",
    iconName: "RiUserLine",
    label: "Mi Perfil",
  },
];

// ============================================================================
// MENÚ FOOTER
// ============================================================================
export const FOOTER_MENU = [
  {
    key: "about",
    label: "Acerca de",
    path: "/about",
  },
  {
    key: "contact",
    label: "Contacto",
    path: "/contact",
  },
  {
    key: "terms",
    label: "Términos y Condiciones",
    path: "/terms",
  },
  {
    key: "privacy",
    label: "Política de Privacidad",
    path: "/privacy",
  },
  {
    key: "help",
    label: "Ayuda",
    path: "/help",
  },
];

// ============================================================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ============================================================================
export const APP_CONFIG = {
  name: "Residentify",
  description:
    "Un proyecto completo y listo para usar con Next.js 15, Tailwind CSS 4 y autenticación",
  version: "1.0.0",
  author: "Tu Empresa",
  supportEmail: "soporte@tuempresa.com",

  // Configuración de autenticación
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
    refreshTokenThreshold: 5 * 60 * 1000, // 5 minutos antes de expirar
    redirectAfterLogin: "/",
    redirectAfterLogout: "/login",
  },

  // Configuración del proyecto
  project: {
    maxFeatures: 100,
    maxComponents: 50,
    allowedFeatureTypes: [
      "autenticación",
      "base de datos",
      "api",
      "ui",
      "otro",
    ],
    defaultFeatureDuration: 120, // minutos
  },

  // Configuración de UI
  ui: {
    theme: "light", // light, dark, auto
    language: "es",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "HH:mm",
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
    },
  },
};

// ============================================================================
// FUNCIONES UTILITARIAS
// ============================================================================

/**
 * Verifica si una ruta es pública
 * @param {string} pathname - La ruta a verificar
 * @returns {boolean} - True si la ruta es pública
 */
export function isPublicRoute(pathname) {
  // Verificar rutas exactas
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // Verificar patrones regex
  if (PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  return false;
}

/**
 * Verifica si una ruta está protegida
 * @param {string} pathname - La ruta a verificar
 * @returns {boolean} - True si la ruta está protegida
 */
export function isProtectedRoute(pathname) {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Obtiene el menú principal filtrado por permisos del usuario
 * @param {boolean} isAuthenticated - Si el usuario está autenticado
 * @returns {Array} - Menú filtrado
 */
export function getFilteredMainMenu(isAuthenticated) {
  return MAIN_MENU.filter((item) => {
    if (item.public === undefined) return true; // Si no se especifica, mostrar siempre
    return item.public || isAuthenticated;
  }).map((item) => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(
          (child) =>
            child.public === undefined || child.public || isAuthenticated
        ),
      };
    }
    return item;
  });
}

/**
 * Obtiene el menú de usuario filtrado
 * @param {boolean} isAuthenticated - Si el usuario está autenticado
 * @returns {Array} - Menú de usuario filtrado
 */
export function getFilteredUserMenu(isAuthenticated) {
  if (!isAuthenticated) {
    return [];
  }
  return USER_MENU;
}

/**
 * Obtiene el menú privado (sidebar)
 * @returns {Array} - Menú privado
 */
export function getPrivateMenu() {
  return PRIVATE_MENU;
}

/**
 * Obtiene la configuración de la aplicación
 * @returns {Object} - Configuración de la app
 */
export function getAppConfig() {
  return APP_CONFIG;
}

/**
 * Obtiene la URL base de la aplicación (versión síncrona)
 * Si DEVELOPMENT es "true", retorna localhost, de lo contrario usa WEBSITE_URL
 * Si WEBSITE_URL no está definido, intenta obtener la URL del request actual
 * Funciona tanto en cliente como en servidor
 * @returns {string} - URL base de la aplicación
 */
export function getBaseUrl() {
  // Check if we're in development mode
  const isDevelopment =
    process.env.DEVELOPMENT === "true" ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === "true";

  if (isDevelopment) {
    return "http://localhost:3000";
  }

  // Check if WEBSITE_URL is defined
  const websiteUrl = process.env.WEBSITE_URL;

  if (websiteUrl) {
    return websiteUrl;
  }

  // If WEBSITE_URL is not defined, try to get it from the current request
  // Client-side: use window.location.origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side: fallback to localhost
  // Note: For server actions that need the actual request URL,
  // use getBaseUrlFromHeaders() instead
  return "http://localhost:3000";
}

/**
 * Obtiene la URL base de la aplicación desde los headers del request (versión asíncrona)
 * Úsalo en server actions cuando necesites la URL real del request
 * @returns {Promise<string>} - URL base de la aplicación
 */
export async function getBaseUrlFromHeaders() {
  // Check if we're in development mode
  const isDevelopment =
    process.env.DEVELOPMENT === "true" ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === "true";

  if (isDevelopment) {
    return "http://localhost:3000";
  }

  // Check if WEBSITE_URL is defined
  const websiteUrl = process.env.WEBSITE_URL;

  if (websiteUrl) {
    return websiteUrl;
  }

  // Try to get from request headers (server-side only)
  try {
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";

    if (host) {
      return `${protocol}://${host}`;
    }
  } catch (error) {
    // headers() might not be available in all contexts
    // fall through to default
  }

  // Fallback to localhost if nothing else works
  return "http://localhost:3000";
}
