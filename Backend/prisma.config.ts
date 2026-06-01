import { defineConfig } from "@prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"] ?? "postgresql://loyalty_user:loyalty_pass@localhost:5432/loyalty_db?schema=public";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: connectionString,
  },
});
