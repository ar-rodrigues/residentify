# Páginas del Sistema - Documentación Completa

Este documento describe todas las páginas accesibles por los usuarios en el sistema, organizadas por tipo de acceso y rol.

## Índice

1. [Páginas Públicas](#páginas-públicas)
2. [Páginas Privadas](#páginas-privadas)
3. [Páginas de Organización](#páginas-de-organización)
   - [Rol: Administrador](#rol-administrador)
   - [Rol: Residente](#rol-residente)
   - [Rol: Seguridad](#rol-seguridad)
4. [Páginas Adicionales](#páginas-adicionales)

---

## Páginas Públicas

Estas páginas son accesibles sin autenticación.

### 1. Página de Inicio / Landing
**Ruta:** `/[locale]/`  
**Archivo:** `app/[locale]/(public)/page.js`  
**Descripción:** Página principal del sitio que muestra información sobre el sistema, características y opciones para iniciar sesión o registrarse.  
**Características:**
- Muestra información sobre el sistema de control de acceso
- Botones para login y registro
- Información sobre características principales
- Accesible para usuarios autenticados y no autenticados

### 2. Página de Login
**Ruta:** `/[locale]/login`  
**Archivo:** `app/[locale]/(public)/login/page.js`  
**Descripción:** Permite a los usuarios iniciar sesión en el sistema.  
**Características:**
- Formulario de autenticación
- Manejo de errores de autenticación
- Redirección automática si el usuario ya está autenticado
- Soporte para parámetros de búsqueda (query params)

### 3. Página de Registro
**Ruta:** `/[locale]/signup`  
**Archivo:** `app/[locale]/(public)/signup/page.js`  
**Descripción:** Permite a nuevos usuarios crear una cuenta en el sistema.  
**Características:**
- Formulario de registro con validación
- Campos: email, contraseña, nombre, fecha de nacimiento
- Validación de email único
- Redirección a página de éxito después del registro

### 4. Página de Éxito de Registro
**Ruta:** `/[locale]/signup/success`  
**Archivo:** `app/[locale]/(public)/signup/success/page.js`  
**Descripción:** Confirma que el registro fue exitoso y proporciona instrucciones.  
**Características:**
- Mensaje de confirmación
- Instrucciones para verificar email
- Enlace para iniciar sesión

### 5. Página de Recuperación de Contraseña
**Ruta:** `/[locale]/forgot-password`  
**Archivo:** `app/[locale]/(public)/forgot-password/page.js`  
**Descripción:** Permite a los usuarios solicitar un enlace para restablecer su contraseña.  
**Características:**
- Formulario para ingresar email
- Envío de email con enlace de recuperación
- Mensaje de confirmación

### 6. Página de Restablecimiento de Contraseña
**Ruta:** `/[locale]/reset-password`  
**Archivo:** `app/[locale]/(public)/reset-password/page.js`  
**Descripción:** Permite a los usuarios establecer una nueva contraseña usando un token de recuperación.  
**Características:**
- Formulario para nueva contraseña
- Validación de token
- Confirmación de contraseña

### 7. Página de Aceptación de Invitación
**Ruta:** `/[locale]/invitations/[token]`  
**Archivo:** `app/[locale]/(public)/invitations/[token]/page.js`  
**Descripción:** Permite a los usuarios aceptar una invitación a una organización.  
**Características:**
- Verificación de token de invitación
- Opciones para usuarios nuevos (registro) o existentes (login)
- Manejo de diferentes estados: usuario ya es miembro, usuario no existe, etc.
- Proceso de aceptación de invitación

### 8. Página de Aceptación de Enlace General
**Ruta:** `/[locale]/invitations/general/[token]`  
**Archivo:** `app/[locale]/(public)/invitations/general/[token]/page.js`  
**Descripción:** Permite a los usuarios aceptar un enlace de invitación general (no específico de email).  
**Características:**
- Verificación de token de enlace general
- Opciones para registro o login
- Proceso de aceptación similar a invitaciones específicas

### 9. Página de Error
**Ruta:** `/[locale]/error`  
**Archivo:** `app/[locale]/(public)/error/page.js`  
**Descripción:** Muestra mensajes de error genéricos del sistema.  
**Características:**
- Manejo de errores globales
- Mensajes de error amigables
- Opciones para volver o contactar soporte

---

## Páginas Privadas

Estas páginas requieren autenticación.

### 1. Lista de Organizaciones
**Ruta:** `/[locale]/organizations`  
**Archivo:** `app/[locale]/(private)/organizations/page.js`  
**Descripción:** Muestra todas las organizaciones a las que el usuario pertenece.  
**Características:**
- Lista de organizaciones del usuario
- Tarjetas con información de cada organización
- Indicador de organizaciones pendientes de aprobación
- Botón para crear nueva organización
- Redirección automática si el usuario tiene una organización principal
- Redirección automática si el usuario tiene solo una organización

### 2. Crear Organización
**Ruta:** `/[locale]/organizations/create`  
**Archivo:** `app/[locale]/(private)/organizations/create/page.js`  
**Descripción:** Permite a los usuarios crear una nueva organización.  
**Características:**
- Formulario para crear organización
- Selección de tipo de organización (residencial, comercial, oficina, etc.)
- Validación de nombre único
- Redirección a la organización creada

### 3. Detalle de Organización (Redirección)
**Ruta:** `/[locale]/organizations/[id]`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/page.js`  
**Descripción:** Página de entrada que redirige al usuario a la vista apropiada según su rol en la organización.  
**Características:**
- Verificación de autenticación
- Obtención de datos de la organización
- Determinación del rol del usuario
- Redirección a la ruta por defecto según el rol
- Manejo de errores (organización no encontrada, sin permisos, etc.)

### 4. Perfil de Usuario
**Ruta:** `/[locale]/profile`  
**Archivo:** `app/[locale]/(private)/profile/page.js`  
**Descripción:** Permite a los usuarios ver y editar su información de perfil.  
**Características:**
- Información del usuario (email, ID, fecha de creación, último acceso)
- Cambio de contraseña
- Cambio de email
- Tabs para organizar diferentes secciones
- Validación de formularios

---

## Páginas de Organización

Estas páginas son específicas de una organización y requieren que el usuario tenga acceso a la organización. El acceso varía según el rol del usuario.

### Rol: Administrador

Los administradores tienen acceso completo a la gestión de la organización.

#### 1. Gestión de Miembros
**Ruta:** `/[locale]/organizations/[id]/members`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/members/page.js`  
**Descripción:** Permite a los administradores gestionar los miembros de la organización.  
**Características:**
- Lista de todos los miembros
- Cambio de roles de miembros
- Eliminación de miembros
- Información detallada de cada miembro
- Búsqueda y filtrado de miembros

#### 2. Gestión de Invitaciones
**Ruta:** `/[locale]/organizations/[id]/invitations`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/invitations/page.js`  
**Descripción:** Permite a los administradores gestionar las invitaciones enviadas.  
**Características:**
- Lista de invitaciones pendientes, aceptadas y rechazadas
- Crear nuevas invitaciones
- Cancelar invitaciones pendientes
- Ver estado de cada invitación
- Reenviar invitaciones

#### 3. Configuración de Permisos de Chat
**Ruta:** `/[locale]/organizations/[id]/chat-permissions`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/chat-permissions/page.js`  
**Descripción:** Permite a los administradores configurar quién puede usar el chat en la organización.  
**Características:**
- Configuración de permisos por rol
- Habilitar/deshabilitar chat para diferentes roles
- Guardar configuración

#### 4. Chat de Organización
**Ruta:** `/[locale]/organizations/[id]/chat`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/chat/page.js`  
**Descripción:** Widget de chat para comunicación entre miembros de la organización.  
**Características:**
- Chat en tiempo real
- Lista de conversaciones
- Envío de mensajes
- Historial de mensajes
- Disponible para admin, residente y seguridad

---

### Rol: Residente

Los residentes pueden generar códigos QR para visitantes y usar el chat.

#### 1. Generación de Códigos QR / Invitaciones
**Ruta:** `/[locale]/organizations/[id]/invites`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/invites/page.js`  
**Descripción:** Permite a los residentes generar códigos QR para visitantes.  
**Características:**
- Generar nuevos códigos QR
- Ver códigos activos
- Ver historial de códigos usados/expirados
- Editar identificadores de códigos
- Eliminar códigos
- Notificaciones cuando un visitante es validado
- Actualización en tiempo real del estado de códigos

#### 2. Chat de Organización
**Ruta:** `/[locale]/organizations/[id]/chat`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/chat/page.js`  
**Descripción:** Widget de chat para comunicación entre miembros.  
**Características:**
- Mismas características que el chat para administradores
- Disponible según permisos configurados por el administrador

---

### Rol: Seguridad

El personal de seguridad puede validar códigos QR y ver historiales.

#### 1. Validación de Códigos QR
**Ruta:** `/[locale]/organizations/[id]/validate`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/validate/page.js`  
**Descripción:** Página principal para que el personal de seguridad valide códigos QR de visitantes.  
**Características:**
- Escáner de códigos QR (cámara o entrada manual)
- Búsqueda de códigos por token
- Formulario de validación con información del visitante
- Registro de entrada/salida
- Validación de códigos
- Mensajes de éxito/error
- Animaciones y transiciones

#### 2. Validación de Código Específico
**Ruta:** `/[locale]/organizations/[id]/validate/[token]`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/validate/[token]/page.js`  
**Descripción:** Permite validar un código QR específico directamente desde un enlace.  
**Características:**
- Carga automática del código QR desde el token en la URL
- Mismo proceso de validación que la página principal
- Útil para enlaces compartidos

#### 3. Historial de Accesos
**Ruta:** `/[locale]/organizations/[id]/history`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/history/page.js`  
**Descripción:** Muestra el historial completo de validaciones y accesos.  
**Características:**
- Lista de todas las validaciones realizadas
- Información de visitantes
- Fechas y horas de validación
- Filtros y búsqueda
- Información detallada de cada acceso

#### 4. Códigos QR Pendientes
**Ruta:** `/[locale]/organizations/[id]/pending`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/pending/page.js`  
**Descripción:** Muestra todos los códigos QR activos que aún no han sido validados.  
**Características:**
- Lista de códigos QR pendientes de validación
- Información del visitante esperado
- Fecha de creación y expiración
- Acceso rápido para validar desde esta lista

#### 5. Chat de Organización
**Ruta:** `/[locale]/organizations/[id]/chat`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/chat/page.js`  
**Descripción:** Widget de chat para comunicación.  
**Características:**
- Mismas características que el chat para otros roles
- Disponible según permisos configurados

---

## Páginas Adicionales

Estas páginas son accesibles desde diferentes contextos.

### 1. Editar Organización
**Ruta:** `/[locale]/organizations/[id]/edit`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/edit/page.js`  
**Descripción:** Permite editar la información de una organización.  
**Características:**
- Formulario de edición
- Cambio de nombre
- Cambio de tipo (si está permitido)
- Validación de permisos (solo administradores)
- Guardado de cambios

### 2. Invitar Usuario
**Ruta:** `/[locale]/organizations/[id]/invite`  
**Archivo:** `app/[locale]/(private)/organizations/[id]/invite/page.js`  
**Descripción:** Permite invitar un nuevo usuario a la organización.  
**Características:**
- Formulario para crear invitación
- Ingreso de email del invitado
- Selección de rol
- Mensaje personalizado opcional
- Envío de invitación por email

---

## Notas Importantes

### Control de Acceso

- Todas las páginas de organización verifican el acceso del usuario mediante `requireRouteAccess`
- Las páginas redirigen automáticamente si el usuario no tiene los permisos necesarios
- El sistema utiliza un patrón de "Type Router" que determina la vista según el tipo de organización y el rol del usuario

### Vistas por Tipo de Organización

El sistema actualmente soporta organizaciones de tipo **Residential** (Residencial), con vistas específicas:
- `AdminView.js` - Vista para administradores
- `ResidentView.js` - Vista para residentes
- `SecurityView.js` - Vista para personal de seguridad

### Rutas por Defecto

Cuando un usuario accede a `/[locale]/organizations/[id]`, el sistema redirige automáticamente a la ruta por defecto según su rol:
- **Admin:** `/members`
- **Resident:** `/invites`
- **Security:** `/validate`

### Internacionalización

Todas las páginas soportan múltiples idiomas (español y portugués) mediante `next-intl`. Las rutas incluyen el prefijo de locale: `/[locale]/...`

---

**Última actualización:** Diciembre 2024  
**Versión del documento:** 1.0










