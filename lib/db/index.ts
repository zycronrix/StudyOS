import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

const client = postgres(process.env.DATABASE_URL ?? 'postgresql://build-placeholder/db', {
  prepare: false, // required for Supabase pgbouncer
})
export const db = drizzle(client, { schema })

export * from "./schema"
