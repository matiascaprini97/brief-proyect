import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada.');
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // 1. Crear o actualizar usuario Admin (buscando por 'username' único)
    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            email: 'admin@empresa.com',
            password: hashedPassword,
            role: Role.ADMIN,
        },
        create: {
            username: 'admin',
            email: 'admin@empresa.com',
            password: hashedPassword,
            role: Role.ADMIN,
            firstName: 'Admin',
            lastName: 'Sistema',
        },
    });

    // 2. Limpiar productos existentes para evitar duplicados al reejecutar
    await prisma.product.deleteMany({});

    // 3. Cargar productos desde el Excel
    const workbook = xlsx.readFile('../SKUs DCGS.xlsx');
    const sheet = workbook.Sheets['Copia de Calculadora de SKU'];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);

    for (const row of rows) {
        if (!row['SKU']) continue;

        const subTipo = String(row['Sub tipo'] || '');
        const isSpare = subTipo.startsWith('RE');

        await prisma.product.create({
            data: {
                brand: 'PHIIT',
                name: row['Descripción'] || row['SKU'],
                details: `SKU: ${row['SKU']} | Clasificación: ${row['Clasificación'] || 'N/A'} | Color: ${row['Color'] || 'N/A'}`,
                photos: [],
                isSpare: isSpare,
                warrantyDays: isSpare ? 180 : 365,
                defaultLifespanDays: isSpare ? 180 : 365,
            },
        });
    }

    console.log('Seed completado exitosamente.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });