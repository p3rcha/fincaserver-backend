import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI 3.0 Specification Configuration
 * 
 * This configuration generates the OpenAPI spec from JSDoc comments
 * in route files using swagger-jsdoc.
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FINCA SERVER API',
      version: '1.0.0',
      description: `
API for FINCA SERVER - Minecraft Costa Rica

This API provides endpoints for:
- **Server Info**: Get Minecraft server status and information
- **Store**: Browse available store items
- **Tebex Integration**: Full webstore functionality including packages, categories, baskets, coupons, and gift cards

## Authentication
Most endpoints are public. Basket operations use the basket identifier (ident) for session management.

## Base URL
Development: \`http://localhost:4000/api\`
      `,
      contact: {
        name: 'FINCA SERVER',
        url: 'https://fincaserver.net',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server',
      },
      {
        url: 'https://api.fincaserver.net',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Server health check endpoints',
      },
      {
        name: 'Server Info',
        description: 'Minecraft server information',
      },
      {
        name: 'Store',
        description: 'Local store items (mock data)',
      },
      {
        name: 'Tebex - Webstore',
        description: 'Webstore information and pages',
      },
      {
        name: 'Tebex - Categories',
        description: 'Product categories management',
      },
      {
        name: 'Tebex - Packages',
        description: 'Store packages/products',
      },
      {
        name: 'Tebex - Baskets',
        description: 'Shopping basket operations',
      },
      {
        name: 'Tebex - Basket Packages',
        description: 'Add, remove, and update packages in baskets',
      },
      {
        name: 'Tebex - Promotions',
        description: 'Coupons, gift cards, and creator codes',
      },
      {
        name: 'Tebex - Sidebar',
        description: 'Sidebar modules (top customers, recent purchases)',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        ServerInfo: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'FINCA SERVER' },
            ip: { type: 'string', example: 'mc.fincaserver.net' },
            version: { type: 'string', example: '1.21' },
            maxPlayers: { type: 'integer', example: 100 },
            onlinePlayers: { type: 'integer', example: 42 },
          },
        },
        StoreItem: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            price: { type: 'number' },
            description: { type: 'string' },
          },
        },
        TebexPackage: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1234567 },
            name: { type: 'string', example: 'VIP Rank' },
            description: { type: 'string' },
            type: { type: 'string', example: 'single' },
            base_price: { type: 'number', example: 9.99 },
            sales_price: { type: 'number', nullable: true },
            total_price: { type: 'number', example: 9.99 },
            currency: { type: 'string', example: 'USD' },
            discount: { type: 'number', example: 0 },
            image: { type: 'string', nullable: true },
            disable_quantity: { type: 'boolean' },
            disable_gifting: { type: 'boolean' },
            expiration_date: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            category: { $ref: '#/components/schemas/TebexCategory' },
          },
        },
        TebexCategory: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 123456 },
            name: { type: 'string', example: 'Ranks' },
            description: { type: 'string' },
            order: { type: 'integer' },
            packages: {
              type: 'array',
              items: { $ref: '#/components/schemas/TebexPackage' },
            },
          },
        },
        TebexBasket: {
          type: 'object',
          properties: {
            ident: { type: 'string', example: 'abc123-xyz789' },
            complete: { type: 'boolean' },
            id: { type: 'integer' },
            country: { type: 'string', example: 'CR' },
            ip: { type: 'string' },
            username_id: { type: 'integer', nullable: true },
            username: { type: 'string', nullable: true },
            cancel_url: { type: 'string' },
            complete_url: { type: 'string' },
            base_price: { type: 'number' },
            sales_tax: { type: 'number' },
            total_price: { type: 'number' },
            currency: { type: 'string' },
            packages: { type: 'array', items: { type: 'object' } },
            coupons: { type: 'array', items: { type: 'object' } },
            giftcards: { type: 'array', items: { type: 'object' } },
            creator_code: { type: 'string', nullable: true },
            links: {
              type: 'object',
              properties: {
                checkout: { type: 'string' },
              },
            },
          },
        },
        TebexWebstore: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            webstore_url: { type: 'string' },
            currency: { type: 'string' },
            lang: { type: 'string' },
            logo: { type: 'string', nullable: true },
            platform_type: { type: 'string' },
          },
        },
      },
    },
  },
  // Path to the API docs - scan route files for JSDoc comments
  apis: [
    './src/routes/*.ts',
    './src/server.ts',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

