/**
 * Swagger/OpenAPI configuration for API documentation
 * Uses OpenAPI 3.1 specification
 */

const path = require('path');

// Get base URL from environment or default to localhost
function getBaseUrl() {
  if (process.env.WEBSITE_URL) {
    return process.env.WEBSITE_URL;
  }
  if (
    process.env.DEVELOPMENT === 'true' ||
    process.env.NEXT_PUBLIC_DEVELOPMENT === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    return 'http://localhost:3000';
  }
  return 'http://localhost:3000';
}

/**
 * Base OpenAPI 3.1 specification
 */
const swaggerDefinition = {
  openapi: '3.1.0',
  info: {
    title: 'Silver API',
    version: '1.0.0',
    description:
      'API documentation for Silver application. This API provides endpoints for managing organizations, QR codes, access logs, invitations, and more.',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: getBaseUrl(),
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'JWT token obtained from Supabase authentication. Include in Authorization header as: Bearer {token}',
      },
    },
    schemas: {
      ChatConversations: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          organization_id: { type: 'string', format: 'uuid' },
          user1_id: { type: 'string', format: 'uuid' },
          user2_id: { type: 'string', format: 'uuid', nullable: true },
          role_id: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['active', 'archived'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      ChatMessages: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          conversation_id: { type: 'string', format: 'uuid' },
          organization_id: { type: 'string', format: 'uuid' },
          sender_id: { type: 'string', format: 'uuid' },
          recipient_id: { type: 'string', format: 'uuid', nullable: true },
          content: { type: 'string' },
          is_read: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Notifications: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          organization_id: { type: 'string', format: 'uuid' },
          qr_code_id: { type: 'string', format: 'uuid', nullable: true },
          access_log_id: { type: 'string', format: 'uuid', nullable: true },
          from_user_id: { type: 'string', format: 'uuid', nullable: true },
          to_user_id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['visitor_arrived', 'visitor_left', 'qr_invalid', 'custom'] },
          message: { type: 'string' },
          is_read: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      FeatureFlags: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      UserFeatureFlags: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          user_id: { type: 'string', format: 'uuid' },
          feature_flag_id: { type: 'string', format: 'uuid' },
          is_enabled: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Organizations: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          name: { type: 'string' },
          organization_type_id: { type: 'integer', description: 'Foreign key to organization_types.id' },
          created_by: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      OrganizationMembers: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          organization_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          organization_role_id: { type: 'integer' },
          invited_by: { type: 'string', format: 'uuid', nullable: true },
          joined_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      OrganizationInvitations: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          email: { type: 'string', format: 'email' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          organization_id: { type: 'string', format: 'uuid' },
          organization_role_id: { type: 'integer' },
          invited_by: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['pending', 'accepted', 'rejected', 'expired'] },
          token: { type: 'string' },
          expires_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      OrganizationRoles: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'Primary key' },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          organization_type_id: { type: 'integer' }
        }
      },
      GeneralInviteLinks: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', description: 'Primary key' },
          organization_id: { type: 'string', format: 'uuid' },
          organization_role_id: { type: 'integer' },
          token: { type: 'string' },
          requires_approval: { type: 'boolean' },
          expires_at: { type: 'string', format: 'date-time', nullable: true },
          created_by: { type: 'string', format: 'uuid' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'boolean',
            description: 'Indicates if an error occurred',
            example: true,
          },
          message: {
            type: 'string',
            description: 'Error message',
            example: 'Error message here',
          },
        },
      },
      SuccessResponse: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'boolean',
            description: 'Indicates if an error occurred',
            example: false,
          },
          message: {
            type: 'string',
            description: 'Success message',
            example: 'Operation completed successfully',
          },
          data: {
            description: 'Response data (varies by endpoint)',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: true,
              message: 'No estás autenticado. Por favor, inicia sesión.',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: true,
              message: 'No tienes permisos para realizar esta acción.',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: true,
              message: 'Recurso no encontrado.',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: true,
              message: 'Error de validación.',
            },
          },
        },
      },
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: true,
              message: 'Error inesperado en el servidor.',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Organizations',
      description: 'Organization management endpoints',
    },
    {
      name: 'QR Codes',
      description: 'QR code generation and validation',
    },
    {
      name: 'Access Logs',
      description: 'Access log tracking and retrieval',
    },
    {
      name: 'Invitations',
      description: 'Organization invitation management',
    },
    {
      name: 'General Invite Links',
      description: 'Public invitation links for organizations',
    },
    {
      name: 'User',
      description: 'User-related endpoints',
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints',
    },
    {
      name: 'Notifications',
      description: 'Notification management',
    },
    {
      name: 'Chat',
      description: 'Organization chat functionality',
    },
    {
      name: 'Profiles',
      description: 'User profile management',
    },
  ],
};

/**
 * Swagger JSDoc options
 */
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './app/api/**/route.js',
    './types/**/*.js',
    // Exclude docs routes from scanning
    '!./app/api/docs/**',
  ],
};

export {
  swaggerDefinition,
  swaggerOptions,
  getBaseUrl,
};
