import { defineConfig } from '@prisma/config'
import 'dotenv/config'

// Detectamos si el comando actual es una migración
const isMigration = process.argv.some(arg => arg.includes('migrate') || arg.includes('db'));

export default defineConfig({
  datasource: {
    // Si es migración usa la DIRECT_URL (puerto 5432), si no, usa el Pooler (puerto 6543)
    url: isMigration ? process.env.DIRECT_URL : process.env.DATABASE_URL,
  },
})