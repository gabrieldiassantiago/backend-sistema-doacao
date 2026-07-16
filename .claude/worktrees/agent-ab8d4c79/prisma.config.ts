import { defineConfig } from 'prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
        seed: 'prisma/seed-user.ts',
    },
    datasource: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/doacao'
    },
    
});
