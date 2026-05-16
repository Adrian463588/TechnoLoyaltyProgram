/**
 * Backend/src/utils/swagger.ts
 * Lazy swagger spec — AST is parsed ONCE on first /api-docs hit, not at startup.
 */

import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Berijalan Employee Loyalty Program API",
      version: "1.0.0",
      description: "API Documentation for the Berijalan Employee Loyalty Program Portal",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/api/*.ts", "./src/controllers/*.ts"],
};

let _spec: ReturnType<typeof swaggerJsdoc> | null = null;

/** Returns the swagger spec, computing it once and caching in memory. */
export function getSwaggerSpec() {
  if (!_spec) _spec = swaggerJsdoc(options);
  return _spec;
}

// Legacy named export for backwards compat
export const swaggerSpec = getSwaggerSpec();

