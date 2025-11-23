# Residentify

Un proyecto completo y listo para usar con Next.js 15, Tailwind CSS 4 y autenticación con Supabase. Incluye un sistema completo de autenticación, gestión de perfiles de usuario y recuperación de contraseñas.

## 🚀 Características

- **Next.js 15** - Framework de React con App Router
- **Tailwind CSS 4** - Framework de CSS utility-first
- **Autenticación Completa** - Sistema de registro, login, recuperación de contraseña y cambio de email
- **Gestión de Perfiles** - Sistema de perfiles de usuario con roles y datos personales
- **Row Level Security (RLS)** - Políticas de seguridad a nivel de base de datos
- **Responsive Design** - Interfaz adaptativa para todos los dispositivos
- **Estructura Organizada** - Código limpio y bien estructurado con hooks personalizados
- **Iconos React Icons** - Biblioteca de iconos moderna y ligera
- **Nodemailer** - Sistema de envío de emails configurado
- **Utilidades de Fecha** - Manejo de fechas con conversión de zonas horarias

## 🛠️ Tecnologías

- Next.js 15.4.6
- React 19.1.0
- Tailwind CSS 4.1.11
- Supabase (autenticación y base de datos PostgreSQL)
- React Icons
- Nodemailer (envío de emails)
- Ant Design (componentes UI)
- Day.js (manejo de fechas)

## 🚀 Comenzar

### Prerrequisitos

1. Node.js 18+ instalado
2. Una cuenta de Supabase
3. Configuración de SMTP para envío de emails (opcional)

### Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
# o
yarn install
# o
pnpm install
```

3. Configura las variables de entorno (ver sección [Configuración](#-configuración))
4. Configura la base de datos (ver sección [Configuración de Base de Datos](#-configuración-de-base-de-datos))
5. Ejecuta el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## 📁 Estructura del Proyecto

```
app/
├── (public)/              # Rutas públicas (no requieren autenticación)
│   ├── page.js            # Página principal
│   ├── login/             # Página de inicio de sesión
│   ├── signup/            # Página de registro
│   │   └── success/       # Página de éxito después del registro
│   ├── forgot-password/   # Solicitud de recuperación de contraseña
│   ├── reset-password/    # Formulario de restablecimiento de contraseña
│   ├── auth/              # Rutas de autenticación
│   │   ├── confirm/       # Confirmación de email
│   │   └── reset-password/# Handler de reset de contraseña
│   └── error/             # Página de error
├── (private)/             # Rutas privadas (requieren autenticación)
│   ├── private/           # Dashboard principal
│   └── profile/           # Gestión de perfil de usuario
└── globals.css            # Estilos globales

components/                 # Componentes reutilizables
├── ui/                    # Componentes UI personalizados

hooks/                     # Custom hooks
├── useUser.js            # Hook para obtener usuario autenticado
└── usePasswordReset.js   # Hook para reset de contraseña

utils/                     # Utilidades y configuración
├── supabase/             # Cliente y configuración de Supabase
├── mailer/               # Sistema de envío de emails
├── config/               # Configuración de la aplicación
│   └── app.js            # Configuración general y helpers
└── date.js               # Utilidades para manejo de fechas

sql/                      # Scripts SQL
└── database.sql          # Schema completo de la base de datos
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` basado en `.example.env` con las siguientes variables:

```env
# DATABASE CONFIGS
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# WEBSITE URL
WEBSITE_URL=https://tu-dominio.com  # URL de producción (opcional)
DEVELOPMENT=true                     # true para desarrollo, false para producción

# MAILER CONFIGS
EMAIL_SERVICE=gmail                  # Opcional: nombre del servicio
EMAIL_HOST=smtp.gmail.com           # Servidor SMTP
EMAIL_PORT=587                      # Puerto SMTP (587 para TLS, 465 para SSL)
EMAIL_USER=tu-email@gmail.com       # Email del remitente
EMAIL_PASSWORD=tu-contraseña-de-aplicación  # Contraseña de aplicación
```

**Notas importantes:**

- `WEBSITE_URL`: Solo necesario en producción. Si no se define, se intentará obtener del request.
- `DEVELOPMENT`: Cuando es `true`, usa `http://localhost:3000` para todas las URLs. En producción, debe ser `false`.
- Para Gmail, necesitas generar una [Contraseña de aplicación](https://support.google.com/accounts/answer/185833) en lugar de tu contraseña normal.

## 🗄️ Configuración de Base de Datos

### 1. Crear Proyecto en Supabase

1. Ve a [Supabase](https://supabase.com) y crea un nuevo proyecto
2. Anota tu `URL` y `anon key` para las variables de entorno

### 2. Ejecutar Script SQL

Ejecuta el script `sql/database.sql` en el SQL Editor de Supabase. Este script crea:

#### Tablas

- **`roles`**: Tabla de roles de usuario (por defecto crea el rol "user")
- **`profiles`**: Tabla de perfiles de usuario con:
  - `id` (UUID, referencia a `auth.users`)
  - `first_name` (TEXT)
  - `last_name` (TEXT)
  - `date_of_birth` (DATE)
  - `role_id` (UUID, referencia a `roles`)
  - `created_at` y `updated_at` (timestamps automáticos)

#### Funciones y Triggers

- **`handle_new_user()`**: Trigger que se ejecuta cuando se crea un nuevo usuario en `auth.users`
- **`set_default_role_id()`**: Trigger que asigna automáticamente el rol "user" por defecto
- **`update_updated_at_column()`**: Trigger que actualiza automáticamente el campo `updated_at`

#### Row Level Security (RLS)

El script configura políticas RLS para seguridad:

- **Profiles**: Los usuarios solo pueden leer y actualizar su propio perfil
- **Roles**: Todos los usuarios autenticados pueden leer los roles (útil para dropdowns)

#### Permisos

- Se otorgan permisos necesarios a los roles `anon` y `authenticated` de Supabase

### 3. Verificar Configuración

Después de ejecutar el script, verifica que:

1. Las tablas `roles` y `profiles` existen
2. El rol "user" está creado en la tabla `roles`
3. Las políticas RLS están habilitadas
4. Los triggers están activos

### 4. Configuración de Email en Supabase

Para que funcionen los flujos de recuperación de contraseña y cambio de email:

1. Ve a **Authentication > URL Configuration** en tu proyecto de Supabase
2. Configura las URLs de redirección:
   - **Site URL**: `http://localhost:3000` (desarrollo) o tu URL de producción
   - **Redirect URLs**: Añade:
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3000/auth/reset-password`
     - `https://tu-dominio.com/auth/confirm` (producción)
     - `https://tu-dominio.com/auth/reset-password` (producción)

## 🔄 Flujo de Usuario

### 1. Registro (Signup)

1. El usuario accede a `/signup`
2. Completa el formulario con:
   - Email
   - Contraseña (mínimo 6 caracteres)
   - Confirmación de contraseña
   - Nombre
   - Apellido
   - Fecha de nacimiento
3. Al enviar:
   - Se crea el usuario en Supabase Auth
   - Se crea el perfil en la tabla `profiles` con los datos proporcionados
   - Se asigna automáticamente el rol "user"
   - Se redirige a `/signup/success`

### 2. Inicio de Sesión (Login)

1. El usuario accede a `/login`
2. Ingresa email y contraseña
3. Si las credenciales son correctas:
   - Se crea la sesión en Supabase
   - Se redirige a `/private` (dashboard)

### 3. Recuperación de Contraseña

1. El usuario accede a `/forgot-password`
2. Ingresa su email
3. Supabase envía un email con un enlace de recuperación
4. El usuario hace clic en el enlace
5. Se redirige a `/auth/reset-password` que valida el token
6. Si el token es válido, se redirige a `/reset-password`
7. El usuario ingresa su nueva contraseña
8. Se actualiza la contraseña y se redirige a `/login`

### 4. Cambio de Contraseña (Usuario Autenticado)

1. El usuario accede a `/profile` (pestaña "Cambiar Contraseña")
2. Ingresa:
   - Contraseña actual
   - Nueva contraseña
   - Confirmación de nueva contraseña
3. Se valida la contraseña actual
4. Se actualiza la contraseña

### 5. Cambio de Email

1. El usuario accede a `/profile` (pestaña "Cambiar Email")
2. Ingresa:
   - Contraseña actual
   - Nuevo email
3. Se valida la contraseña actual
4. Supabase envía un email de confirmación al nuevo email
5. El usuario hace clic en el enlace de confirmación
6. Se redirige a `/auth/confirm` que valida el token
7. Se actualiza el email y se redirige a `/profile`

### 6. Gestión de Perfil

1. El usuario accede a `/profile` (pestaña "Perfil")
2. Puede ver:
   - Información de la cuenta (email, ID de usuario)
   - Fecha de registro
   - Último inicio de sesión
   - Información del perfil (nombre, apellido, fecha de nacimiento, rol)

### 7. Dashboard Privado

1. El usuario autenticado accede a `/private`
2. Ve un dashboard con su información de perfil
3. Puede navegar a `/profile` para gestionar su cuenta

## 📧 Nodemailer

El proyecto incluye **Nodemailer** configurado para el envío de emails. Está ubicado en `utils/mailer/` y incluye:

### Configuración Básica

```javascript
// utils/mailer/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_PORT === "465", // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### Variables de Entorno Requeridas

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
```

### Uso Básico

```javascript
import { sendEmail } from "@/utils/mailer/mailer";

// Enviar email simple
await sendEmail({
  to: "destinatario@email.com",
  subject: "Asunto del email",
  html: "<h1>Contenido HTML</h1>",
});

// Usar plantillas predefinidas
import { sendWelcomeEmail } from "@/utils/mailer/templates/welcomeEmail";
await sendWelcomeEmail("usuario@email.com", "Nombre Usuario");
```

### Plantillas Disponibles

- **welcomeEmail.js** - Email de bienvenida para nuevos usuarios
- Fácil de personalizar y extender según tus necesidades

**Nota:** Los emails de recuperación de contraseña y cambio de email son manejados directamente por Supabase, no requieren configuración de Nodemailer.

## 🛠️ Utilidades y Helpers

### Hooks Personalizados

#### `useUser`

Hook para obtener el usuario autenticado con opciones de redirección:

```javascript
import { useUser } from "@/hooks/useUser";

const {
  data: user,
  loading,
  error,
  refetch,
} = useUser({
  redirectToLogin: true, // Redirige a /login si no hay usuario
  redirectIfAuthenticated: false, // Redirige a /private si hay usuario
  redirectPath: "/custom-path", // Ruta personalizada para redirección
});
```

#### `usePasswordReset`

Hook para operaciones de reset de contraseña:

```javascript
import { usePasswordReset } from "@/hooks/usePasswordReset";

const { loading, error, success, sendResetEmail, resetPassword } =
  usePasswordReset();
```

### Utilidades de Fecha

El proyecto incluye utilidades en `utils/date.js` para manejo de fechas:

```javascript
import {
  formatDateDDMMYYYY,
  localDateToUTC,
  utcDateToLocal,
} from "@/utils/date";

// Formatear fecha para mostrar (dd/mm/yyyy)
const formatted = formatDateDDMMYYYY("2024-01-15"); // "15/01/2024"

// Convertir fecha local a UTC para almacenar
const utcDate = localDateToUTC(dayjsObject); // "2024-01-15"

// Convertir UTC a fecha local para mostrar
const localDate = utcDateToLocal("2024-01-15");
```

### Configuración de URL Base

El proyecto incluye helpers para obtener la URL base de la aplicación:

```javascript
import { getBaseUrl, getBaseUrlFromHeaders } from "@/utils/config/app";

// Versión síncrona (cliente o servidor básico)
const baseUrl = getBaseUrl(); // "http://localhost:3000" o WEBSITE_URL

// Versión asíncrona (server actions con acceso a headers)
const baseUrl = await getBaseUrlFromHeaders();
```

## 🔒 Seguridad

### Row Level Security (RLS)

El proyecto utiliza RLS de Supabase para garantizar que:

- Los usuarios solo pueden leer y actualizar su propio perfil
- Los perfiles están protegidos a nivel de base de datos
- Las políticas se aplican automáticamente en todas las consultas

### Validación de Contraseñas

- Mínimo 6 caracteres
- Se valida la contraseña actual antes de permitir cambios
- Se verifica que la nueva contraseña sea diferente a la actual

### Manejo de Tokens

- Los tokens de recuperación de contraseña y confirmación de email tienen expiración
- Se validan en el servidor antes de permitir cambios
- Los tokens se invalidan después de su uso

## 🚀 Desplegar

### Preparación para Producción

1. **Variables de Entorno:**

   - Configura `DEVELOPMENT=false`
   - Configura `WEBSITE_URL` con tu dominio de producción
   - Asegúrate de tener todas las variables de entorno configuradas

2. **Supabase:**

   - Actualiza las URLs de redirección en Supabase Dashboard
   - Verifica que las políticas RLS estén activas

3. **Build:**
   ```bash
   npm run build
   ```

### Plataformas Recomendadas

- **[Vercel](https://vercel.com)** - Recomendado para Next.js
- **[Netlify](https://netlify.com)** - Alternativa popular
- Cualquier plataforma que soporte Next.js 15

## 📚 Recursos

### Documentación

- [Documentación de Next.js](https://nextjs.org/docs)
- [Tutorial de Next.js](https://nextjs.org/learn)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

### Repositorios

- [Repositorio de Next.js](https://github.com/vercel/next.js)
- [Repositorio de Supabase](https://github.com/supabase/supabase)

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.
