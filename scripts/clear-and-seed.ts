import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import "dotenv/config";

// Create MySQL connection
const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

async function clearDatabase() {
  console.log("Clearing existing data...");
  
  try {
    // Disable foreign key checks
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);
    
    // Truncate all tables in reverse dependency order (ignore errors for missing tables)
    const tables = [
      'session_comments', 'injury_records', 'sessions', 'upcoming_care',
      'favorite_horses', 'horses', 'devices', 'tracks', 'track_requests',
      'organization_requests', 'invitations', 'organizations', 'api_settings',
      'user_preferences'
    ];
    
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE ${table}`));
        console.log(`  Cleared ${table}`);
      } catch (error: any) {
        if (error.cause?.code === 'ER_NO_SUCH_TABLE' || error.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  Skipped ${table} (doesn't exist)`);
        } else {
          throw error;
        }
      }
    }
    
    // Re-enable foreign key checks
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    
    console.log("✅ Database cleared successfully");
  } catch (error) {
    console.error("Error clearing database:", error);
    throw error;
  }
}

async function main() {
  await clearDatabase();
  
  console.log("\nNow run: npx tsx scripts/seed-data.ts");
  await connection.end();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("Failed:", error);
  await connection.end();
  process.exit(1);
});

