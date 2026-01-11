# Sistema de Feature Flags

## Descripción General

El sistema de Feature Flags permite habilitar o deshabilitar funcionalidades específicas para usuarios individuales. Esto es útil para:
- Pruebas beta con usuarios seleccionados
- Lanzamientos graduales de nuevas características
- Control de acceso a funcionalidades experimentales
- Gestión de características premium

## Arquitectura

El sistema está compuesto por dos niveles:

1. **Feature Flags (Banderas de Características)**: Definiciones globales de características disponibles en la aplicación
2. **User Flags (Banderas de Usuario)**: Asignaciones individuales que vinculan usuarios con feature flags y su estado habilitado/deshabilitado

### Flujo de Datos

```
Feature Flag (definición global)
    ↓
User Flag (asignación individual)
    ↓
Frontend Context Provider
    ↓
Componentes de la aplicación
```

## Esquema de Base de Datos

### Tabla: `feature_flags`

Define las características disponibles en el sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | Identificador único (PK) |
| `name` | text | Nombre único de la bandera (requerido) |
| `description` | text | Descripción de la característica (opcional) |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Fecha de última actualización |

### Tabla: `user_flags`

Vincula usuarios con feature flags y su estado.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid | Identificador único (PK) |
| `user_id` | uuid | ID del usuario (FK a auth.users) |
| `feature_flag_id` | uuid | ID del feature flag (FK a feature_flags) |
| `enabled` | boolean | Estado de la bandera para el usuario (default: false) |
| `created_at` | timestamp | Fecha de creación |
| `updated_at` | timestamp | Fecha de última actualización |

**Restricciones:**
- Combinación única `(user_id, feature_flag_id)` - un usuario solo puede tener una entrada por feature flag

## Permisos y Seguridad

### Row Level Security (RLS)

#### Feature Flags
- **Solo administradores de aplicación** pueden crear, leer, actualizar y eliminar feature flags
- Los usuarios regulares **no pueden** acceder directamente a la tabla `feature_flags`

#### User Flags
- **Solo administradores de aplicación** pueden crear, leer, actualizar y eliminar user flags
- Los usuarios regulares **no pueden** acceder directamente a la tabla `user_flags`

### Verificación de Administrador

El sistema utiliza la función `is_app_admin(user_id)` que verifica si un usuario tiene el rol `admin` en la tabla `roles` a través de su perfil.

**Nota:** Los administradores de aplicación son diferentes de los administradores de organización. Los feature flags son gestionados a nivel de aplicación, no de organización.

## Funciones de Base de Datos

### `get_user_flags(p_user_id uuid)`

Obtiene todas las feature flags con su estado habilitado para un usuario específico.

**Parámetros:**
- `p_user_id`: ID del usuario

**Retorna:**
```sql
TABLE(
  id uuid,
  name text,
  description text,
  enabled boolean
)
```

**Comportamiento:**
- Retorna todas las feature flags del sistema
- Si el usuario tiene un `user_flag` para una feature flag, retorna el valor de `enabled` de ese registro
- Si el usuario no tiene un `user_flag` para una feature flag, retorna `enabled = false`
- Ordena los resultados por nombre

**Uso:** Esta función se utiliza para obtener el estado completo de todas las feature flags para un usuario, permitiendo que el frontend sepa qué características están habilitadas.

## API Endpoints

### Endpoints Públicos (Usuarios Autenticados)

#### `GET /api/user/flags`

Obtiene todas las feature flags con su estado habilitado para el usuario autenticado.

**Autenticación:** Requerida

**Respuesta exitosa (200):**
```json
{
  "error": false,
  "data": {
    "flags": [
      {
        "id": "uuid",
        "name": "beta_features",
        "description": "Acceso a características beta",
        "enabled": true
      },
      {
        "id": "uuid",
        "name": "premium_features",
        "description": "Características premium",
        "enabled": false
      }
    ]
  },
  "message": "Banderas obtenidas exitosamente."
}
```

**Errores:**
- `401`: Usuario no autenticado
- `500`: Error del servidor

### Endpoints de Administración

Todos los endpoints de administración requieren que el usuario sea un administrador de aplicación.

#### Feature Flags

##### `GET /api/admin/feature-flags`

Lista todas las feature flags del sistema.

**Autenticación:** Requerida (Admin)

**Respuesta exitosa (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "uuid",
      "name": "beta_features",
      "description": "Acceso a características beta",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "Banderas obtenidas exitosamente."
}
```

##### `POST /api/admin/feature-flags`

Crea una nueva feature flag.

**Autenticación:** Requerida (Admin)

**Body:**
```json
{
  "name": "new_feature",
  "description": "Descripción de la nueva característica"
}
```

**Validaciones:**
- `name`: Requerido, string no vacío
- `description`: Opcional

**Respuesta exitosa (201):**
```json
{
  "error": false,
  "data": {
    "id": "uuid",
    "name": "new_feature",
    "description": "Descripción de la nueva característica",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "message": "Bandera creada exitosamente."
}
```

**Errores:**
- `400`: Datos inválidos
- `409`: Ya existe una bandera con ese nombre
- `403`: Usuario no es administrador
- `500`: Error del servidor

##### `GET /api/admin/feature-flags/[id]`

Obtiene una feature flag específica por ID.

**Autenticación:** Requerida (Admin)

##### `PUT /api/admin/feature-flags/[id]`

Actualiza una feature flag existente.

**Autenticación:** Requerida (Admin)

**Body:**
```json
{
  "name": "updated_name",
  "description": "Descripción actualizada"
}
```

**Nota:** Ambos campos son opcionales, solo se actualizan los campos proporcionados.

##### `DELETE /api/admin/feature-flags/[id]`

Elimina una feature flag. Esto también elimina automáticamente todos los `user_flags` asociados (cascada).

**Autenticación:** Requerida (Admin)

#### User Flags

##### `GET /api/admin/user-flags`

Lista los user flags con paginación y filtros opcionales.

**Autenticación:** Requerida (Admin)

**Query Parameters:**
- `user_id` (opcional): Filtrar por usuario
- `flag_id` (opcional): Filtrar por feature flag
- `page` (opcional, default: 1): Número de página
- `page_size` (opcional, default: 50): Tamaño de página

**Respuesta exitosa (200):**
```json
{
  "error": false,
  "data": {
    "user_flags": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "feature_flag_id": "uuid",
        "enabled": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "feature_flags": {
          "id": "uuid",
          "name": "beta_features",
          "description": "Acceso a características beta"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 50,
      "total": 100,
      "total_pages": 2
    }
  },
  "message": "Banderas de usuario obtenidas exitosamente."
}
```

##### `POST /api/admin/user-flags`

Crea o actualiza un user flag (upsert).

**Autenticación:** Requerida (Admin)

**Body:**
```json
{
  "user_id": "uuid",
  "feature_flag_id": "uuid",
  "enabled": true
}
```

**Validaciones:**
- `user_id`: Requerido, string (UUID)
- `feature_flag_id`: Requerido, string (UUID)
- `enabled`: Requerido, boolean

**Comportamiento:** Si ya existe un user flag para la combinación `(user_id, feature_flag_id)`, se actualiza. Si no existe, se crea uno nuevo.

##### `GET /api/admin/user-flags/[id]`

Obtiene un user flag específico por ID.

**Autenticación:** Requerida (Admin)

##### `PUT /api/admin/user-flags/[id]`

Actualiza el estado `enabled` de un user flag.

**Autenticación:** Requerida (Admin)

**Body:**
```json
{
  "enabled": false
}
```

##### `DELETE /api/admin/user-flags/[id]`

Elimina un user flag.

**Autenticación:** Requerida (Admin)

## Uso en el Frontend

### Provider de Contexto

El sistema utiliza un React Context Provider para gestionar el estado de las feature flags en el frontend.

**Ubicación:** `components/providers/FeatureFlagsProvider.js`

**Características:**
- Carga automática de flags al montar el componente
- Recarga automática cuando cambia el usuario
- Manejo de estados de carga y error
- Función helper `hasFlag()` para verificar flags

### Hook Personalizado

**Ubicación:** `hooks/useFeatureFlags.js`

```javascript
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

function MyComponent() {
  const { flags, loading, error, hasFlag, refetch } = useFeatureFlags();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error al cargar flags</div>;
  }

  // Verificar si una feature flag está habilitada
  if (hasFlag("beta_features")) {
    return <div>Contenido beta visible</div>;
  }

  return <div>Contenido normal</div>;
}
```

### API del Hook

El hook `useFeatureFlags()` retorna:

- `flags`: Array de objetos con todas las feature flags y su estado
  ```javascript
  [
    {
      id: "uuid",
      name: "beta_features",
      description: "Acceso a características beta",
      enabled: true
    }
  ]
  ```

- `loading`: Boolean indicando si se están cargando los flags
- `error`: Error object si hubo un problema al cargar
- `hasFlag(flagName)`: Función que retorna `true` si la flag está habilitada, `false` en caso contrario
- `refetch()`: Función para recargar los flags manualmente

### Utilidades del Servidor

**Ubicación:** `utils/featureFlags.js`

Funciones disponibles para uso en Server Components o Server Actions:

```javascript
import { getUserFlags, checkUserFlag, hasFeatureFlag } from "@/utils/featureFlags";

// Obtener todas las flags de un usuario
const flags = await getUserFlags(userId);

// Verificar una flag específica
const isEnabled = await checkUserFlag(userId, "beta_features");

// Alias de checkUserFlag
const isEnabled = await hasFeatureFlag(userId, "beta_features");
```

## Ejemplos de Uso

### Ejemplo 1: Habilitar Feature para Usuario Específico

```javascript
// Como administrador, habilitar beta_features para un usuario
const response = await fetch("/api/admin/user-flags", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    user_id: "user-uuid",
    feature_flag_id: "beta-features-flag-uuid",
    enabled: true
  })
});
```

### Ejemplo 2: Verificar Flag en Componente

```javascript
"use client";

import { useFeatureFlags } from "@/hooks/useFeatureFlags";

export function BetaFeatureComponent() {
  const { hasFlag, loading } = useFeatureFlags();

  if (loading) {
    return null;
  }

  if (!hasFlag("beta_features")) {
    return null; // No mostrar si no está habilitado
  }

  return (
    <div>
      <h2>Característica Beta</h2>
      <p>Esta es una característica en beta</p>
    </div>
  );
}
```

### Ejemplo 3: Verificar Flag en Server Component

```javascript
import { hasFeatureFlag } from "@/utils/featureFlags";
import { createClient } from "@/utils/supabase/server";

export default async function ServerComponent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const hasBeta = await hasFeatureFlag(user.id, "beta_features");

  if (!hasBeta) {
    return null;
  }

  return <div>Contenido beta en servidor</div>;
}
```

### Ejemplo 4: Crear Nueva Feature Flag

```javascript
// Como administrador, crear una nueva feature flag
const response = await fetch("/api/admin/feature-flags", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "new_experimental_feature",
    description: "Nueva característica experimental"
  })
});
```

## Mejores Prácticas

1. **Nombres de Flags**: Usa nombres descriptivos y consistentes (snake_case recomendado)
   - ✅ `beta_features`, `premium_access`, `experimental_ui`
   - ❌ `flag1`, `test`, `new`

2. **Descripciones**: Siempre proporciona descripciones claras para facilitar la gestión

3. **Verificación en Frontend**: Siempre verifica el estado de carga antes de usar `hasFlag()`

4. **Fallback Seguro**: Si una flag no está habilitada, oculta o deshabilita la funcionalidad en lugar de mostrar errores

5. **Limpieza**: Elimina feature flags obsoletas y sus user flags asociados cuando ya no sean necesarias

6. **Testing**: Prueba tanto el caso habilitado como deshabilitado de cada feature flag

## Consideraciones de Rendimiento

- Los flags se cargan una vez al montar el `FeatureFlagsProvider`
- Los flags se recargan automáticamente cuando cambia el usuario
- La función `get_user_flags` en la base de datos es eficiente y retorna todos los flags en una sola consulta
- El contexto se actualiza solo cuando es necesario (cambio de usuario)

## Limitaciones Actuales

1. **Solo nivel de usuario**: El sistema actualmente solo soporta flags a nivel de usuario individual, no a nivel de organización o grupo
2. **Sin porcentajes**: No hay soporte para habilitar flags para un porcentaje de usuarios
3. **Sin expiración**: Los user flags no tienen fecha de expiración automática
4. **Sin historial**: No se mantiene un historial de cambios en los flags

## Futuras Mejoras Potenciales

- Flags a nivel de organización
- Flags con porcentaje de usuarios
- Flags con fecha de expiración
- Historial de cambios
- Flags con condiciones complejas (A/B testing)
- Dashboard de administración visual




