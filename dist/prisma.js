import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
// Ensure environment variables are loaded before initializing
dotenv.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in the environment variables.');
}
// 1. Create a standard Postgres connection pool
const pool = new Pool({ connectionString });
// 2. Wrap it in the Prisma Adapter
const adapter = new PrismaPg(pool);
// 3. Pass the adapter to the Prisma Client
const prisma = new PrismaClient({ adapter });
export default prisma;
