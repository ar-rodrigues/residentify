# Residentify

Sistema de control de acceso multi-tipo para organizaciones. Soporta diferentes tipos de organizaciones (residenciales, comerciales, oficinas, etc.) con roles y vistas personalizadas. Gestiona miembros, personal de seguridad y visitantes con códigos QR seguros y validación en tiempo real.

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
│           ├── page.js              # Controlador principal (Server Component)
│           ├── edit/                # Editar organización
│           ├── invite/              # Invitar usuarios
│           └── _components/         # Componentes privados (no son rutas)
│               ├── type-router.js   # Router de vistas por tipo de organización
│               ├── views/           # Vistas específicas por tipo y rol
│               │   └── residential/ # Vistas para organizaciones residenciales
│               │       ├── AdminView.js
│               │       ├── ResidentView.js
│               │       └── SecurityView.js
│               └── widgets/         # Componentes reutilizables
│                   ├── shared/      # Widgets compartidos entre tipos
│                   │   ├── OrganizationHeader.js
│                   │   └── OrganizationIdStorage.js
│                   └── residential/ # Widgets específicos para residenciales
│                       ├── MembersList.js
│                       ├── InvitationsList.js
│                       └── ...
└── globals.css        # Estilos globales

components/             # Componentes reutilizables globales
hooks/                  # Custom hooks
├── useOrganizations.js
├── useOrganization.js
├── useOrganizationTypes.js
├── useOrganizationMembers.js
├── useInvitations.js
├── useQRCodes.js
└── useUser.js

utils/                  # Utilidades y configuración
├── supabase/          # Cliente y configuración de Supabase
└── mailer/            # Sistema de envío de emails
```

## 🏢 Sistema de Organizaciones Multi-Tipo y Vistas por Rol

El proyecto implementa un sistema completo de gestión de organizaciones con soporte para múltiples tipos de organizaciones. Cada tipo puede tener sus propios roles y vistas personalizadas. Esta arquitectura asegura seguridad, escalabilidad y una clara separación de responsabilidades.

### Arquitectura

El sistema utiliza un patrón de **"Type Router"** donde:

- **`page.js`** actúa como controlador principal (Server Component) que:

  - Verifica la autenticación del usuario
  - Obtiene los datos de la organización (incluyendo el tipo)
  - Determina el rol del usuario en la organización
  - Pasa los datos al `TypeRouter` para renderizar la vista apropiada

- **`type-router.js`** es el componente que:

  - Recibe el tipo de organización y el rol del usuario
  - Enruta a la vista correcta según el tipo y rol
  - Maneja tipos desconocidos de forma elegante

- **`_components/`** es una carpeta privada (no es una ruta) que contiene:
  - **`views/`**: Vistas organizadas por tipo de organización (residential, commercial, office, etc.)
  - **`widgets/`**: Componentes reutilizables organizados en `shared/` (compartidos) y por tipo (específicos)

### Estructura de Carpetas

```
app/(private)/organizations/[id]/
├── page.js                    # Controlador principal (Server Component)
└── _components/               # Carpeta privada (no es ruta)
    ├── type-router.js         # Router de vistas por tipo y rol
    ├── views/                 # Vistas organizadas por tipo
    │   └── residential/       # Vistas para organizaciones residenciales
    │       ├── AdminView.js   # Vista de administrador
    │       ├── ResidentView.js # Vista de residente
    │       └── SecurityView.js # Vista de personal de seguridad
    └── widgets/               # Componentes reutilizables
        ├── shared/            # Widgets compartidos entre todos los tipos
        │   ├── OrganizationHeader.js
        │   └── OrganizationIdStorage.js
        └── residential/       # Widgets específicos para residenciales
            ├── MembersList.js
            ├── InvitationsList.js
            └── ...
```

### Tipos de Organización

El sistema soporta múltiples tipos de organizaciones. Actualmente implementado:

- **Residential** (Residencial): Para edificios y condominios
  - Roles: `admin`, `resident`, `security`
  - Vistas: `AdminView`, `ResidentView`, `SecurityView`

Futuros tipos pueden incluir:

- **Commercial** (Comercial): Para centros comerciales y negocios
- **Office** (Oficina): Para edificios de oficinas corporativas

### Roles y Permisos por Tipo

Cada tipo de organización puede tener sus propios roles. Para organizaciones **residenciales**, el sistema soporta tres roles:

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

Obtiene los datos de una organización específica, incluyendo el rol del usuario y el tipo de organización.

```javascript
const { data: organization, loading, error } = useOrganization(organizationId);
```

**Retorna**:

- `organization.userRole`: Rol del usuario (`"admin"`, `"resident"`, `"security"`, etc.)
- `organization.isAdmin`: Boolean indicando si es administrador
- `organization.name`: Nombre de la organización
- `organization.organization_type`: Nombre del tipo de organización (ej: `"residential"`)
- `organization.organization_type_id`: ID del tipo de organización
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

**`createOrganization(name, organizationTypeId)`**: Crea una nueva organización

- `name`: Nombre de la organización
- `organizationTypeId`: ID del tipo de organización (opcional, por defecto usa "residential")

#### `useOrganizationTypes()`

Obtiene los tipos de organización disponibles.

```javascript
const { types, loading, error, refetch } = useOrganizationTypes();
```

**Retorna**:

- `types`: Array de tipos de organización con `id`, `name`, `description`
- `loading`: Estado de carga
- `error`: Error si existe
- `refetch`: Función para recargar los tipos

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
- Utility function: `utils/api/organizations.js`

### Base de Datos

El sistema utiliza las siguientes tablas relacionadas con tipos de organización:

- **`organization_types`**: Almacena los tipos de organizaciones disponibles
- **`organization_roles`**: Almacena los roles, vinculados a un tipo específico mediante `organization_type_id`
- **`organizations`**: Almacena las organizaciones, vinculadas a un tipo mediante `organization_type_id`

**Migraciones SQL**:

- `sql/001_add_organization_types.sql`: Crea la tabla `organization_types` y migra datos existentes
- `sql/002_update_create_organization_function.sql`: Actualiza la función `create_organization_with_admin` para soportar tipos

### Seguridad

1. **Verificación de Autenticación**: El controlador principal verifica que el usuario esté autenticado antes de cargar datos.

2. **Verificación de Rol**: El rol del usuario se verifica en el servidor (API) y se pasa al cliente.

3. **Row Level Security (RLS)**: Supabase RLS asegura que los usuarios solo puedan acceder a organizaciones donde son miembros.

4. **Separación de Vistas**: Cada rol solo ve los componentes y funcionalidades permitidas para su rol.

### Extensión del Sistema

Para agregar nuevas funcionalidades:

1. **Nuevo Widget Compartido**: Agrega el componente en `_components/widgets/shared/`
2. **Nuevo Widget por Tipo**: Agrega el componente en `_components/widgets/[tipo]/`
3. **Nueva Vista por Tipo**: Crea la vista en `_components/views/[tipo]/[Rol]View.js`
4. **Nuevo Tipo de Organización**:
   - Agrega el tipo en la base de datos (`organization_types` table)
   - Crea los roles para ese tipo en `organization_roles` table
   - Crea la carpeta `_components/views/[nuevo-tipo]/` con las vistas
   - Crea la carpeta `_components/widgets/[nuevo-tipo]/` con los widgets
   - Actualiza `type-router.js` para manejar el nuevo tipo
5. **Nuevo Rol para un Tipo Existente**:
   - Agrega el rol en la base de datos para ese tipo
   - Crea la vista `_components/views/[tipo]/[NuevoRol]View.js`
   - Actualiza la función de routing en `type-router.js`

### Ejemplo de Uso

```javascript
// En residential/AdminView.js
import MembersListResponsive from "../../widgets/residential/MembersListResponsive";
import InvitationsListResponsive from "../../widgets/residential/InvitationsListResponsive";
import AddMemberFAB from "../../widgets/residential/AddMemberFAB";

export default function AdminView({ organizationId }) {
  return (
    <>
      <MembersListResponsive organizationId={organizationId} />
      <InvitationsListResponsive organizationId={organizationId} />
      <AddMemberFAB organizationId={organizationId} />
    </>
  );
}
```

### Crear una Nueva Organización

```javascript
// En create/page.js
import { useOrganizationTypes } from "@/hooks/useOrganizationTypes";
import { useOrganizations } from "@/hooks/useOrganizations";

const { types } = useOrganizationTypes();
const { createOrganization } = useOrganizations();

// Crear organización con tipo específico
await createOrganization("Mi Organización", types[0].id);
```

## 🔧 Configuración

1. Configura las variables de entorno para Supabase
2. Personaliza los estilos en `app/globals.css`
3. Modifica los componentes según tus necesidades
4. Añade nuevas funcionalidades al dashboard

## 📦 Configuración de Storage en Supabase

Este documento describe cómo configurar el bucket de almacenamiento en Supabase para las fotos de documentos de visitantes.

### Requisitos

- Acceso al dashboard de Supabase
- Permisos de administrador en el proyecto

### Pasos para Crear el Bucket

#### 1. Acceder a Storage en Supabase

1. Inicia sesión en tu proyecto de Supabase
2. En el menú lateral, navega a **Storage**
3. Haz clic en **Buckets** en el submenú

#### 2. Crear el Bucket "documents"

1. Haz clic en el botón **New bucket** o **Crear bucket**
2. Configura el bucket con los siguientes valores:

   - **Name**: `documents`
   - **Public bucket**: Desactivado (debe ser privado)
   - **File size limit**: Opcional (recomendado: 5MB o 10MB)
   - **Allowed MIME types**: Opcional (recomendado: `image/jpeg,image/png,image/webp`)

3. Haz clic en **Create bucket** o **Crear bucket**

#### 3. Configurar Políticas RLS (Row Level Security)

Para que los usuarios autenticados puedan subir archivos al bucket, necesitas configurar políticas RLS:

1. En la página del bucket `documents`, haz clic en **Policies** o **Políticas**
2. Haz clic en **New policy** o **Nueva política**

##### Política para INSERT (Subir archivos)

1. Selecciona **For full customization** o **Para personalización completa**
2. Configura la política:
   - **Policy name**: `Allow authenticated users to upload files`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   (bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)
   ```
3. Haz clic en **Review** y luego en **Save policy**

##### Política para SELECT (Leer archivos)

1. Crea otra política:
   - **Policy name**: `Allow authenticated users to read files`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   (bucket_id = 'documents'::text) AND (auth.role() = 'authenticated'::text)
   ```
2. Haz clic en **Review** y luego en **Save policy**

#### 4. Verificar la Estructura de Carpetas

El bucket `documents` debe contener la carpeta `visitor-documents/` donde se almacenarán las fotos. Esta carpeta se crea automáticamente cuando se sube el primer archivo, pero puedes crearla manualmente:

1. En el bucket `documents`, haz clic en **New folder** o **Nueva carpeta**
2. Nombra la carpeta: `visitor-documents`
3. Haz clic en **Create folder** o **Crear carpeta**

### Estructura Final

Después de la configuración, la estructura debería verse así:

```
documents/
  └── visitor-documents/
      └── [archivos de fotos de documentos]
```

### Verificación

Para verificar que todo está configurado correctamente:

1. Intenta subir una foto desde la aplicación
2. Verifica en el dashboard de Supabase que el archivo aparece en `documents/visitor-documents/`
3. Verifica que puedes descargar el archivo (si tienes permisos)

### Notas Importantes

- **Seguridad**: El bucket está configurado como privado, lo que significa que los archivos no son accesibles públicamente sin una URL firmada
- **URLs firmadas**: La aplicación genera URLs firmadas con validez de 1 año para acceder a los archivos privados
- **Límites**: Asegúrate de configurar límites de tamaño de archivo apropiados para evitar abusos
- **Backup**: Considera configurar políticas de backup para los archivos importantes

### Solución de Problemas

#### Error: "Bucket not found"

- Verifica que el bucket se llama exactamente `documents` (sin mayúsculas)
- Asegúrate de que el bucket existe en el proyecto correcto de Supabase

#### Error: "Permission denied"

- Verifica que las políticas RLS están configuradas correctamente
- Asegúrate de que el usuario está autenticado
- Verifica que las políticas permiten las operaciones INSERT y SELECT

#### Error: "File size limit exceeded"

- Verifica el límite de tamaño configurado en el bucket
- Considera aumentar el límite si es necesario
- Asegúrate de que las imágenes no sean demasiado grandes antes de subirlas

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
