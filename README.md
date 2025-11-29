# Mi Proyecto

Un proyecto base completo y listo para usar con Next.js 15, Tailwind CSS 4 y autenticación con Supabase.

## 🚀 Características

- **Next.js 15** - Framework de React con App Router
- **Tailwind CSS 4** - Framework de CSS utility-first
- **Autenticación** - Sistema de login/logout con Supabase
- **Responsive Design** - Interfaz adaptativa para todos los dispositivos
- **Estructura Organizada** - Código limpio y bien estructurado
- **Iconos React** - Biblioteca de iconos moderna y ligera
- **Nodemailer** - Sistema de envío de emails configurado

## 🛠️ Tecnologías

- Next.js 15.4.6
- React 19.1.0
- Tailwind CSS 4.1.11
- Supabase (autenticación y base de datos)
- React Icons
- Nodemailer (envío de emails)

## 🚀 Comenzar

Primero, ejecuta el servidor de desarrollo:

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
├── (public)/          # Rutas públicas
│   ├── page.js        # Página principal
│   ├── login/         # Sistema de autenticación
│   └── error/         # Página de error
├── (private)/         # Rutas privadas
│   ├── private/       # Dashboard protegido
│   └── organizations/ # Gestión de organizaciones
│       ├── page.js    # Lista de organizaciones
│       ├── create/    # Crear organización
│       └── [id]/      # Detalle de organización
│           ├── page.js              # Controlador principal (Client Component)
│           ├── edit/                # Editar organización
│           ├── invite/              # Invitar usuarios
│           └── _components/         # Componentes privados (no son rutas)
│               ├── views/           # Vistas específicas por rol
│               │   ├── AdminView.js
│               │   ├── ResidentView.js
│               │   └── SecurityView.js
│               └── widgets/         # Componentes reutilizables
│                   ├── OrganizationHeader.js
│                   ├── OrganizationIdStorage.js
│                   ├── MembersList.js
│                   ├── InvitationsList.js
│                   └── ...
└── globals.css        # Estilos globales

components/             # Componentes reutilizables globales
hooks/                  # Custom hooks
├── useOrganizations.js
├── useOrganization.js
├── useOrganizationMembers.js
├── useInvitations.js
├── useQRCodes.js
└── useUser.js

utils/                  # Utilidades y configuración
├── supabase/          # Cliente y configuración de Supabase
└── mailer/            # Sistema de envío de emails
```

## 🏢 Sistema de Organizaciones y Vistas por Rol

El proyecto implementa un sistema completo de gestión de organizaciones con vistas específicas según el rol del usuario. Esta arquitectura asegura seguridad, escalabilidad y una clara separación de responsabilidades.

### Arquitectura

El sistema utiliza un patrón de **"Traffic Controller"** donde:

- **`page.js`** actúa como controlador principal (Client Component) que:

  - Verifica la autenticación del usuario
  - Obtiene los datos de la organización
  - Determina el rol del usuario en la organización
  - Renderiza la vista apropiada según el rol

- **`_components/`** es una carpeta privada (no es una ruta) que contiene:
  - **`views/`**: Vistas específicas por rol (Admin, Resident, Security)
  - **`widgets/`**: Componentes reutilizables usados dentro de las vistas

### Estructura de Carpetas

```
app/(private)/organizations/[id]/
├── page.js                    # Controlador principal
└── _components/               # Carpeta privada (no es ruta)
    ├── views/                 # Vistas por rol
    │   ├── AdminView.js       # Vista de administrador
    │   ├── ResidentView.js    # Vista de residente
    │   └── SecurityView.js    # Vista de personal de seguridad
    └── widgets/               # Componentes reutilizables
        ├── OrganizationHeader.js      # Encabezado de organización
        ├── OrganizationIdStorage.js   # Almacenamiento de ID en localStorage
        ├── MembersList.js             # Lista de miembros (admin)
        ├── InvitationsList.js         # Lista de invitaciones (admin)
        └── ...                        # Otros widgets
```

### Roles y Permisos

El sistema soporta tres roles a nivel de organización:

#### 1. **Admin** (Administrador)

- **Vista**: `AdminView.js`
- **Permisos**:
  - Gestionar miembros de la organización
  - Invitar nuevos usuarios
  - Cambiar roles de miembros
  - Eliminar miembros
  - Editar información de la organización
- **Componentes**: `MembersList`, `InvitationsList`

#### 2. **Resident** (Residente)

- **Vista**: `ResidentView.js`
- **Permisos**:
  - Generar códigos QR para visitantes
  - Ver historial de códigos generados
  - Gestionar enlaces de validación activos
- **Funcionalidades**:
  - Crear nuevos enlaces de validación
  - Ver enlaces activos y su estado
  - Consultar historial de códigos usados/expirados

#### 3. **Security** (Personal de Seguridad)

- **Vista**: `SecurityView.js`
- **Permisos**:
  - Validar códigos QR de visitantes
  - Registrar entradas y salidas
  - Ver información de visitantes
- **Funcionalidades**:
  - Buscar/escaneear códigos QR por token
  - Validar acceso de visitantes
  - Registrar información de validación

### Hooks Personalizados

El sistema utiliza varios hooks personalizados para gestionar el estado:

#### `useOrganization(id)`

Obtiene los datos de una organización específica, incluyendo el rol del usuario.

```javascript
const { data: organization, loading, error } = useOrganization(organizationId);
```

**Retorna**:

- `organization.userRole`: Rol del usuario (`"admin"`, `"resident"`, `"security"`)
- `organization.isAdmin`: Boolean indicando si es administrador
- `organization.name`: Nombre de la organización
- `organization.created_by_name`: Nombre del creador

#### `useOrganizations()`

Gestiona la lista de organizaciones del usuario.

```javascript
const {
  organizations,
  loading,
  createOrganization,
  getOrganization,
  updateOrganization,
} = useOrganizations();
```

#### `useOrganizationMembers()`

Gestiona los miembros de una organización (solo admin).

```javascript
const {
  data: members,
  loading,
  getMembers,
  updateMemberRole,
  removeMember,
} = useOrganizationMembers();
```

#### `useQRCodes()`

Gestiona códigos QR y enlaces de validación.

```javascript
const {
  createQRCode,
  getQRCodes,
  getQRCodeByToken,
  validateQRCode,
  data: qrCodesData,
  loading,
} = useQRCodes();
```

### Normalización de Roles

El sistema normaliza los nombres de roles entre la base de datos y el frontend:

- **Base de datos**: `security_personnel`
- **Frontend**: `security`

Esta normalización se realiza automáticamente en:

- API route: `/api/organizations/[id]/route.js`
- Hook: `useOrganization.js`

### Seguridad

1. **Verificación de Autenticación**: El controlador principal verifica que el usuario esté autenticado antes de cargar datos.

2. **Verificación de Rol**: El rol del usuario se verifica en el servidor (API) y se pasa al cliente.

3. **Row Level Security (RLS)**: Supabase RLS asegura que los usuarios solo puedan acceder a organizaciones donde son miembros.

4. **Separación de Vistas**: Cada rol solo ve los componentes y funcionalidades permitidas para su rol.

### Extensión del Sistema

Para agregar nuevas funcionalidades:

1. **Nuevo Widget**: Agrega el componente en `_components/widgets/`
2. **Nueva Vista**: Modifica la vista correspondiente en `_components/views/`
3. **Nuevo Rol**:
   - Agrega el caso en `page.js` → `renderRoleView()`
   - Crea `_components/views/NewRoleView.js`
   - Actualiza la normalización de roles si es necesario

### Ejemplo de Uso

```javascript
// En AdminView.js
import MembersList from "../widgets/MembersList";
import InvitationsList from "../widgets/InvitationsList";

export default function AdminView({ organizationId }) {
  return (
    <>
      <MembersList organizationId={organizationId} />
      <InvitationsList organizationId={organizationId} />
    </>
  );
}
```

## 🔧 Configuración

1. Configura las variables de entorno para Supabase
2. Personaliza los estilos en `app/globals.css`
3. Modifica los componentes según tus necesidades
4. Añade nuevas funcionalidades al dashboard

## 📧 Nodemailer

El proyecto incluye **Nodemailer** configurado para el envío de emails. Está ubicado en `utils/mailer/` y incluye:

### Configuración Básica

```javascript
// utils/mailer/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

### Variables de Entorno Requeridas

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
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

## 📚 Aprender Más

Para aprender más sobre Next.js, consulta estos recursos:

- [Documentación de Next.js](https://nextjs.org/docs)
- [Tutorial de Next.js](https://nextjs.org/learn)
- [Repositorio de Next.js](https://github.com/vercel/next.js)

## 🚀 Desplegar

La forma más fácil de desplegar tu aplicación Next.js es usar [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.
