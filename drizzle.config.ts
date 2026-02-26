import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './renderer/lib/db/schema.ts',
  out: './renderer/lib/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || './data/sonicvault.db',
  },
});
