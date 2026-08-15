import "dotenv/config";
import { defineConfig } from "@prisma/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env["DATABASE_URL"] ?? "postgresql://postgres:postgres@localhost:5432/berijalan_loyalty?schema=public";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: connectionString,
  },
});
