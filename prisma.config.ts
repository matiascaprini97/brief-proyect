import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'npx tsx ./seed.ts', // <-- Sumamos esta línea exacta
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});