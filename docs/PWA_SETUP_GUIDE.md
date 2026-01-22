# Guía de Configuración PWA (Progressive Web App)

Esta guía explica cómo replicar la configuración PWA de este proyecto en otra aplicación Next.js, permitiendo a los usuarios instalar la aplicación en sus dispositivos.

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Instalación de Dependencias](#instalación-de-dependencias)
3. [Configuración de Next.js](#configuración-de-nextjs)
4. [Creación del Manifest](#creación-del-manifest)
5. [Configuración de Iconos](#configuración-de-iconos)
6. [Configuración de Metadata](#configuración-de-metadata)
7. [Componente de Instalación](#componente-de-instalación)
8. [Verificación](#verificación)
9. [Consideraciones Adicionales](#consideraciones-adicionales)

---

## Requisitos Previos

- Proyecto Next.js 15 o superior
- Node.js instalado
- Acceso a la terminal/consola

---

## Instalación de Dependencias

### 1. Instalar el paquete PWA

```bash
npm install @ducanh2912/next-pwa
```

Este paquete maneja automáticamente:
- La generación del service worker
- El registro del service worker
- La configuración de Workbox para el caching
- La optimización de recursos offline

---

## Configuración de Next.js

### 2. Modificar `next.config.mjs`

Actualiza tu archivo `next.config.mjs` para incluir la configuración PWA:

```javascript
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",           // Directorio donde se generarán los archivos del service worker
  register: true,           // Registra automáticamente el service worker
  skipWaiting: true,        // Activa el nuevo service worker inmediatamente
});

export default withPWA({
  // Tu configuración existente de Next.js aquí
  // ... otras configuraciones
});
```

**Nota importante:** El paquete generará automáticamente los archivos `sw.js` y `workbox-*.js` en el directorio `public` durante el build.

---

## Creación del Manifest

### 3. Crear `public/manifest.json`

Crea un archivo `manifest.json` en la carpeta `public` con la siguiente estructura:

```json
{
  "theme_color": "#020381",
  "background_color": "#FFFFFF",
  "icons": [
    {
      "purpose": "maskable",
      "sizes": "512x512",
      "src": "web-app-manifest-512x512.png",
      "type": "image/png"
    },
    {
      "purpose": "any",
      "sizes": "512x512",
      "src": "web-app-manifest-512x512.png",
      "type": "image/png"
    },
    {
      "purpose": "any",
      "sizes": "192x192",
      "src": "web-app-manifest-192x192.png",
      "type": "image/png"
    }
  ],
  "orientation": "portrait",
  "display": "standalone",
  "lang": "es-MX",
  "name": "Nombre de tu App",
  "short_name": "Nombre Corto",
  "start_url": "/",
  "scope": "/",
  "description": "Descripción de tu aplicación"
}
```

**Personaliza los siguientes campos:**
- `theme_color`: Color del tema de la aplicación (aparece en la barra de estado)
- `background_color`: Color de fondo mientras carga la app
- `name`: Nombre completo de la aplicación
- `short_name`: Nombre corto (máximo 12 caracteres recomendado)
- `start_url`: URL donde inicia la aplicación cuando se abre desde el icono
- `scope`: Alcance de la PWA (generalmente "/")
- `description`: Descripción de la aplicación
- `lang`: Código de idioma (ej: "es-MX", "en-US")

---

## Configuración de Iconos

### 4. Preparar Iconos PWA

Necesitas crear los siguientes iconos y colocarlos en la carpeta `public`:

#### Iconos Requeridos:
- `web-app-manifest-192x192.png` - Icono de 192x192 píxeles
- `web-app-manifest-512x512.png` - Icono de 512x512 píxeles

#### Recomendaciones para Iconos:
- **Formato:** PNG con transparencia
- **Tamaño:** Exactamente 192x192 y 512x512 píxeles
- **Diseño:** 
  - El icono de 192x192 debe ser legible y reconocible
  - El icono de 512x512 debe tener un área segura (padding) para evitar que se recorte en dispositivos Android
  - Para iconos "maskable", deja un margen del 20% alrededor del contenido principal

#### Herramientas para Generar Iconos:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Maskable.app](https://maskable.app/) - Para crear iconos maskable

---

## Configuración de Metadata

### 5. Actualizar `app/layout.js` (o `app/layout.tsx`)

Agrega la configuración de metadata para PWA en tu layout principal:

```javascript
export const metadata = {
  // ... otras metadata existentes
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon-32x32.png",
    apple: "/favicon-32x32.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Nombre de tu App",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#020381",
    "theme-color": "#020381",
  },
};

export const viewport = {
  themeColor: "#020381",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
```

### 6. Agregar Links en el Layout

En el componente `RootLayout`, agrega los links necesarios en el `<head>`:

```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" href="/favicon-32x32.png" />
        <link rel="shortcut icon" href="/favicon-32x32.png" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
```

---

## Componente de Instalación

### 7. Crear Componente de Instalación

Crea un componente que permita a los usuarios instalar la PWA. Tienes dos opciones:

#### Opción A: Componente Simple (`components/InstallPWA.js`)

```javascript
"use client";

import { useEffect, useState } from "react";
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verificar si la app ya está instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar el evento beforeinstallprompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Escuchar cuando la app se instala
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
      window.removeEventListener("appinstalled", () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  if (isInstalled || !deferredPrompt) return null;

  return (
    <Button
      type="primary"
      icon={<DownloadOutlined />}
      onClick={handleInstallClick}
      style={{ marginBottom: "16px" }}
    >
      Instalar aplicación
    </Button>
  );
}
```

#### Opción B: Componente Avanzado con Soporte iOS (`components/Login/InstallButton.js`)

Este componente incluye instrucciones para iOS y mejor detección de plataforma:

```javascript
import { Button, Modal } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Mostrar botón solo para Android
      if (navigator.userAgent.includes("Android")) {
        setShowButton(true);
      }
    };

    const handleAppInstalled = () => {
      setShowButton(false);
    };

    const checkInstallation = () => {
      if (
        navigator.userAgent.includes("iPhone") ||
        navigator.userAgent.includes("iPad")
      ) {
        return window.navigator.standalone;
      }

      if (
        navigator.userAgent.includes("Android") &&
        "serviceWorker" in navigator
      ) {
        return navigator.serviceWorker.controller !== null;
      }

      return false;
    };

    // Inicializar visibilidad del botón
    setShowButton(!checkInstallation());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (navigator.userAgent.includes("Android")) {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("Usuario aceptó la instalación");
          } else {
            console.log("Usuario rechazó la instalación");
          }
          setDeferredPrompt(null);
        });
      }
    } else if (
      navigator.userAgent.includes("iPhone") ||
      navigator.userAgent.includes("iPad")
    ) {
      Modal.info({
        title: "Instalar aplicación",
        content: (
          <div>
            <p>Para instalar esta aplicación en tu iPhone/iPad:</p>
            <ol style={{ fontSize: "16px", lineHeight: "1.8" }}>
              <li>
                <strong>1.</strong> Abre esta página en Safari
              </li>
              <li>
                <strong>2.</strong> Toca el botón de Compartir
              </li>
              <li>
                <strong>3.</strong> Selecciona "Agregar a Pantalla de inicio"
              </li>
            </ol>
            <p
              style={{
                marginTop: "12px",
                fontSize: "14px",
                color: "var(--ant-color-text-secondary)",
              }}
            >
              Una vez instalada, podrás acceder a la aplicación directamente
              desde tu pantalla de inicio.
            </p>
          </div>
        ),
        okText: "Entendido",
        centered: true,
        width: 400,
      });
    }
  };

  if (!showButton) return null;

  return (
    <Button
      type="text"
      icon={<DownloadOutlined />}
      onClick={handleInstallClick}
      style={{
        position: "fixed",
        bottom: "80px",
        right: "20px",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--ant-color-bg-container)",
        color: "var(--ant-color-text)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
        border: "1px solid var(--ant-color-border)",
        zIndex: 1000,
      }}
      className="install-button"
    />
  );
}
```

### 8. Usar el Componente en tu App

Importa y usa el componente donde desees mostrar el botón de instalación:

```javascript
import InstallPWA from "@/components/InstallPWA";

export default function MyPage() {
  return (
    <div>
      <InstallPWA />
      {/* Resto de tu contenido */}
    </div>
  );
}
```

---

## Verificación

### 9. Build y Pruebas

1. **Construir la aplicación:**
   ```bash
   npm run build
   ```

2. **Iniciar en modo producción:**
   ```bash
   npm start
   ```

3. **Verificar en el navegador:**
   - Abre las DevTools (F12)
   - Ve a la pestaña "Application" (Chrome) o "Application" (Edge)
   - Verifica que:
     - El `manifest.json` esté cargado correctamente
     - El Service Worker esté registrado
     - Los iconos estén disponibles

4. **Probar la instalación:**
   - **Chrome/Edge (Desktop):** Deberías ver un icono de instalación en la barra de direcciones
   - **Chrome (Android):** Deberías ver un banner de instalación o el botón personalizado
   - **Safari (iOS):** El usuario debe usar "Agregar a pantalla de inicio" manualmente

### 10. Checklist de Verificación

- [ ] El paquete `@ducanh2912/next-pwa` está instalado
- [ ] `next.config.mjs` está configurado con `withPWA`
- [ ] `manifest.json` existe en `public/`
- [ ] Los iconos (192x192 y 512x512) existen en `public/`
- [ ] La metadata está configurada en `app/layout.js`
- [ ] Los links de iconos están en el `<head>`
- [ ] El componente de instalación está implementado
- [ ] El build se completa sin errores
- [ ] El service worker se registra correctamente
- [ ] La aplicación es instalable en dispositivos de prueba

---

## Consideraciones Adicionales

### Requisitos para PWA Instalable

Para que una PWA sea instalable, debe cumplir con los siguientes criterios:

1. **HTTPS:** La aplicación debe servirse sobre HTTPS (o localhost para desarrollo)
2. **Manifest válido:** Debe incluir `name`, `short_name`, `start_url`, `display`, e `icons`
3. **Service Worker:** Debe tener un service worker registrado
4. **Iconos:** Al menos un icono de 192x192 y otro de 512x512
5. **Visitas:** El usuario debe visitar el sitio al menos una vez (requisito del navegador)

### Diferencias entre Plataformas

#### Android (Chrome/Edge)
- Soporta el evento `beforeinstallprompt`
- Muestra automáticamente un banner de instalación después de ciertas interacciones
- Permite instalación programática mediante el componente

#### iOS (Safari)
- **No soporta** el evento `beforeinstallprompt`
- Requiere instalación manual: "Compartir" → "Agregar a pantalla de inicio"
- El componente debe mostrar instrucciones para iOS

#### Desktop (Chrome/Edge)
- Muestra un icono de instalación en la barra de direcciones
- Permite instalación desde el menú del navegador

### Optimizaciones Adicionales

1. **Offline Support:** El service worker generado automáticamente cachea recursos, pero puedes personalizar el comportamiento en `next.config.mjs`

2. **Actualizaciones:** El flag `skipWaiting: true` activa inmediatamente las actualizaciones del service worker. Considera usar `skipWaiting: false` si necesitas más control

3. **Caching Strategy:** El paquete usa Workbox con estrategias de cache por defecto. Puedes personalizar esto si es necesario

### Troubleshooting

**Problema:** El botón de instalación no aparece
- **Solución:** Verifica que estés en HTTPS o localhost
- Verifica que el manifest.json sea válido
- Asegúrate de que el service worker esté registrado

**Problema:** Los iconos no se muestran correctamente
- **Solución:** Verifica que los archivos existan en `public/`
- Asegúrate de que las rutas en `manifest.json` sean correctas (sin `/public/` en la ruta)
- Verifica que los iconos tengan el tamaño correcto

**Problema:** El service worker no se registra
- **Solución:** Verifica la configuración en `next.config.mjs`
- Asegúrate de hacer un build de producción (`npm run build`)
- Revisa la consola del navegador para errores

---

## Recursos Adicionales

- [Documentación de @ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

---

## Resumen de Archivos Modificados/Creados

```
tu-proyecto/
├── next.config.mjs                    # Modificado: Agregar withPWA
├── package.json                        # Modificado: Agregar dependencia
├── app/
│   └── layout.js                      # Modificado: Agregar metadata PWA
├── public/
│   ├── manifest.json                  # Nuevo: Manifest de la PWA
│   ├── web-app-manifest-192x192.png   # Nuevo: Icono 192x192
│   └── web-app-manifest-512x512.png   # Nuevo: Icono 512x512
└── components/
    └── InstallPWA.js                  # Nuevo: Componente de instalación
```

---

¡Listo! Con estos pasos, tu aplicación Next.js debería estar configurada como una PWA instalable. Los usuarios podrán instalar la aplicación en sus dispositivos y usarla como una app nativa.
