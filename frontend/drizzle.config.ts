import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
config({ path: path.resolve(__dirname, '.env') });

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
  },
} satisfies Config;
