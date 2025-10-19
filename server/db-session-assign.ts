import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { sessions } from "../drizzle/schema";

export async function assignSessionToHorse(
  sessionId: number,
  horseId: number | null
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(sessions)
    .set({ horseId, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

