# Configuración de Documentación API (Scalar + JSDoc)

Esta guía describe cómo implementar una documentación de API automatizada y moderna en un proyecto Next.js 15, utilizando **Scalar** como interfaz y **swagger-jsdoc** para la generación automática.

## 🏗️ Arquitectura
La solución se divide en dos partes:
1.  **Generador (`/api/docs/api/openapi`)**: Escanea el código en busca de comentarios JSDoc y devuelve un JSON compatible con OpenAPI 3.0.
2.  **Interfaz (`/api/docs/api`)**: Renderiza el JSON anterior utilizando Scalar.

## 📦 Dependencias
Instala los paquetes necesarios:

```bash
npm install @scalar/nextjs-api-reference swagger-jsdoc
```

## 🛠️ Archivos de Configuración

### 1. El Generador OpenAPI
Crea el archivo `app/api/docs/api/openapi/route.js`. Este es el "motor" que lee tus rutas.

```javascript
import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

export async function GET() {
  // Seguridad: Solo permitir en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Documentación de API',
        version: '1.0.0',
        description: 'Documentación generada automáticamente desde JSDoc.',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Servidor Local',
        },
      ],
    },
    // Rutas de archivos a escanear
    apis: [
      './app/api/**/*.js',    // Escanea todas las rutas
      './types/**/*.js',      // Escanea definiciones de modelos/schemas
    ],
  };

  try {
    const spec = swaggerJsdoc(options);
    return NextResponse.json(spec);
  } catch (error) {
    return NextResponse.json({ error: 'Error al generar OpenAPI', details: error.message }, { status: 500 });
  }
}
```

### 2. La Interfaz Scalar
Crea el archivo `app/api/docs/api/route.js`. Este archivo consume al generador y muestra la UI.

```javascript
import { ApiReference } from '@scalar/nextjs-api-reference';
import { NextResponse } from 'next/server';

// Apunta al endpoint del generador creado arriba
const openApiUrl = '/api/docs/api/openapi';

const apiReferenceHandler = ApiReference({
  spec: {
    url: openApiUrl,
  },
  theme: 'default',
  layout: 'modern',
});

export async function GET(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return apiReferenceHandler(request);
}
```

## ✍️ Cómo documentar tus rutas
Para que una ruta aparezca en Scalar, añade un bloque `@swagger` encima de tu función `GET`, `POST`, etc.

### Ejemplo de una Ruta:
```javascript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener lista de usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Éxito
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
export async function GET() { ... }
```

### Ejemplo de un Schema (Modelo):
Centraliza tus modelos en una carpeta como `/types` para que Scalar los reconozca globalmente.

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 */
```

## 🚀 Uso
1. Inicia tu servidor: `npm run dev`.
2. Visita: `http://localhost:3000/api/docs/api`.
3. ¡Tu documentación se actualizará automáticamente cada vez que guardes cambios en tus comentarios JSDoc!
