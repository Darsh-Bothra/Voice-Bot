// prisma.config.ts
import 'dotenv/config'; // load .env into process.env (optional)
import { defineConfig, env } from 'prisma/config';

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: 'prisma/schema.prisma',          // path to your schema
  migrations: {
    path: 'prisma/migrations',
  },
  // For migrate and CLI commands: provide the URL through env helper
  datasource: {
    url: env<Env>('DATABASE_URL'),
  },
});
