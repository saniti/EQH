import { and, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  apiSettings,
  Device,
  devices,
  Horse,
  horses,
  InjuryRecord,
  injuryRecords,
  InsertApiSettings,
  InsertDevice,
  InsertHorse,
  InsertInjuryRecord,
  InsertInvitation,
  InsertOrganization,
  InsertOrganizationRequest,
  InsertSession,
  InsertSessionComment,
  InsertTrack,
  InsertTrackRequest,
  InsertUpcomingCare,
  InsertUser,
  InsertUserFavoriteHorse,
  InsertUserOrganization,
  Invitation,
  invitations,
  Organization,
  OrganizationRequest,
  organizationRequests,
  organizations,
  Session,
  SessionComment,
  sessionComments,
  sessions,
  Track,
  TrackRequest,
  trackRequests,
  tracks,
  UpcomingCare,
  upcomingCare,
  User,
  UserFavoriteHorse,
  userFavoriteHorses,
  UserOrganization,
  userOrganizations,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= USER OPERATIONS =============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = "admin";
        values.role = "admin";
        updateSet.role = "admin";
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(
  id: string,
  updates: Partial<InsertUser>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(updates).where(eq(users.id, id));
}

export async function deleteUser(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// ============= ORGANIZATION OPERATIONS =============
export async function createOrganization(
  org: InsertOrganization
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(organizations).values(org);
  return Number(result[0].insertId);
}

export async function getOrganization(
  id: number
): Promise<Organization | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);
  return result[0];
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function getUserOrganizations(
  userId: string
): Promise<Organization[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      contactInfo: organizations.contactInfo,
      ownerId: organizations.ownerId,
      notificationSettings: organizations.notificationSettings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(userOrganizations)
    .innerJoin(
      organizations,
      eq(userOrganizations.organizationId, organizations.id)
    )
    .where(eq(userOrganizations.userId, userId));

  return result;
}

export async function updateOrganization(
  id: number,
  updates: Partial<InsertOrganization>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(organizations).set(updates).where(eq(organizations.id, id));
}

export async function deleteOrganization(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(organizations).where(eq(organizations.id, id));
}

export async function addUserToOrganization(
  userId: string,
  organizationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(userOrganizations).values({ userId, organizationId });
}

export async function removeUserFromOrganization(
  userId: string,
  organizationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(userOrganizations)
    .where(
      and(
        eq(userOrganizations.userId, userId),
        eq(userOrganizations.organizationId, organizationId)
      )
    );
}

// ============= HORSE OPERATIONS =============
export async function createHorse(horse: InsertHorse): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(horses).values(horse);
  return Number(result[0].insertId);
}

export async function getHorse(id: number): Promise<Horse | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(horses).where(eq(horses.id, id)).limit(1);
  return result[0];
}

export async function getOrganizationHorses(
  organizationId: number,
  filters?: {
    status?: string;
    breed?: string;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: string;
  }
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db
    .select()
    .from(horses)
    .where(eq(horses.organizationId, organizationId))
    .$dynamic();

  if (filters?.status) {
    query = query.where(eq(horses.status, filters.status as any));
  }
  if (filters?.breed) {
    query = query.where(eq(horses.breed, filters.breed));
  }
  if (filters?.search) {
    query = query.where(like(horses.name, `%${filters.search}%`));
  }

  query = query.orderBy(desc(horses.createdAt));

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  const horsesList = await query;

  // Enrich with latest session and favorite status
  const enriched = await Promise.all(
    horsesList.map(async (horse) => {
      // Get latest session
      const latestSessionResult = await db
        .select()
        .from(sessions)
        .where(eq(sessions.horseId, horse.id))
        .orderBy(desc(sessions.sessionDate))
        .limit(1);
      
      const latestSession = latestSessionResult[0] || null;

      // Check if favorite
      let isFavorite = false;
      if (filters?.userId) {
        const favoriteResult = await db
          .select()
          .from(userFavoriteHorses)
          .where(
            and(
              eq(userFavoriteHorses.userId, filters.userId),
              eq(userFavoriteHorses.horseId, horse.id)
            )
          )
          .limit(1);
        isFavorite = favoriteResult.length > 0;
      }

      return {
        ...horse,
        latestSession,
        isFavorite,
      };
    })
  );

  return enriched;
}

export async function updateHorse(
  id: number,
  updates: Partial<InsertHorse>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(horses).set(updates).where(eq(horses.id, id));
}

export async function deleteHorse(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(horses).where(eq(horses.id, id));
}

export async function getUserFavoriteHorses(
  userId: string
): Promise<Horse[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: horses.id,
      name: horses.name,
      breed: horses.breed,
      status: horses.status,
      organizationId: horses.organizationId,
      deviceId: horses.deviceId,
      healthRecords: horses.healthRecords,
      createdAt: horses.createdAt,
      updatedAt: horses.updatedAt,
    })
    .from(userFavoriteHorses)
    .innerJoin(horses, eq(userFavoriteHorses.horseId, horses.id))
    .where(eq(userFavoriteHorses.userId, userId));

  return result;
}

export async function addFavoriteHorse(
  userId: string,
  horseId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(userFavoriteHorses).values({ userId, horseId });
}

export async function removeFavoriteHorse(
  userId: string,
  horseId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(userFavoriteHorses)
    .where(
      and(
        eq(userFavoriteHorses.userId, userId),
        eq(userFavoriteHorses.horseId, horseId)
      )
    );
}

// ============= SESSION OPERATIONS =============
export async function createSession(session: InsertSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessions).values(session);
  return Number(result[0].insertId);
}

export async function getSession(id: number): Promise<any> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  const session = result[0];
  
  // Get horse name
  const horseResult = await db
    .select()
    .from(horses)
    .where(eq(horses.id, session.horseId))
    .limit(1);
  
  // Get track name
  const trackResult = await db
    .select()
    .from(tracks)
    .where(eq(tracks.id, session.trackId))
    .limit(1);
  
  return {
    ...session,
    horseName: horseResult[0]?.name,
    trackName: trackResult[0]?.name,
  };
}

export async function getOrganizationSessions(
  organizationIds: number[],
  filters?: {
    horseId?: number;
    trackId?: number;
    injuryRisk?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  // Get horses for these organizations
  const orgHorses = await db
    .select({ id: horses.id })
    .from(horses)
    .where(inArray(horses.organizationId, organizationIds));

  const horseIds = orgHorses.map((h) => h.id);
  if (horseIds.length === 0) return [];

  // Build where conditions
  const conditions: any[] = [inArray(sessions.horseId, horseIds)];
  
  if (filters?.horseId) {
    conditions.push(eq(sessions.horseId, filters.horseId));
  }
  if (filters?.trackId) {
    conditions.push(eq(sessions.trackId, filters.trackId));
  }
  if (filters?.injuryRisk) {
    conditions.push(eq(sessions.injuryRisk, filters.injuryRisk as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(sessions.sessionDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(sessions.sessionDate, filters.endDate));
  }

  let query = db
    .select()
    .from(sessions)
    .where(and(...conditions))
    .orderBy(desc(sessions.sessionDate))
    .$dynamic();

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  const sessionsList = await query;

  // Enrich with horse and track names
  const enriched = await Promise.all(
    sessionsList.map(async (session) => {
      // Get horse name
      const horseResult = await db
        .select({ name: horses.name })
        .from(horses)
        .where(eq(horses.id, session.horseId))
        .limit(1);
      
      // Get track name and type
      const trackResult = await db
        .select({ name: tracks.name, type: tracks.type })
        .from(tracks)
        .where(eq(tracks.id, session.trackId))
        .limit(1);

      return {
        ...session,
        horseName: horseResult[0]?.name || 'Unknown Horse',
        trackName: trackResult[0]?.name || 'Unknown Track',
        trackType: trackResult[0]?.type || '',
      };
    })
  );

  return enriched;
}

export async function updateSession(
  id: number,
  updates: Partial<InsertSession>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set(updates).where(eq(sessions.id, id));
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(sessions).where(eq(sessions.id, id));
}

// ============= SESSION COMMENT OPERATIONS =============
export async function addSessionComment(
  comment: InsertSessionComment
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sessionComments).values(comment);
  return Number(result[0].insertId);
}

export async function getSessionComments(
  sessionId: number
): Promise<SessionComment[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(sessionComments)
    .where(eq(sessionComments.sessionId, sessionId))
    .orderBy(desc(sessionComments.createdAt));
}

// ============= INJURY RECORD OPERATIONS =============
export async function createInjuryRecord(
  injury: InsertInjuryRecord
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(injuryRecords).values(injury);
  return Number(result[0].insertId);
}

export async function getInjuryRecord(
  id: number
): Promise<InjuryRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(injuryRecords)
    .where(eq(injuryRecords.id, id))
    .limit(1);
  return result[0];
}

export async function getSessionInjuryRecords(
  sessionId: number
): Promise<InjuryRecord[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(injuryRecords)
    .where(eq(injuryRecords.sessionId, sessionId))
    .orderBy(desc(injuryRecords.createdAt));
}

export async function updateInjuryRecord(
  id: number,
  updates: Partial<InsertInjuryRecord>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(injuryRecords).set(updates).where(eq(injuryRecords.id, id));
}

// ============= TRACK OPERATIONS =============
export async function createTrack(track: InsertTrack): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tracks).values(track);
  return Number(result[0].insertId);
}

export async function getTrack(id: number): Promise<Track | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tracks).where(eq(tracks.id, id)).limit(1);
  return result[0];
}

export async function getAvailableTracks(
  organizationId?: number
): Promise<Track[]> {
  const db = await getDb();
  if (!db) return [];

  if (organizationId) {
    return await db
      .select()
      .from(tracks)
      .where(
        or(
          eq(tracks.scope, "global"),
          and(
            eq(tracks.scope, "local"),
            eq(tracks.organizationId, organizationId)
          )
        )
      )
      .orderBy(desc(tracks.createdAt));
  }

  return await db.select().from(tracks).orderBy(desc(tracks.createdAt));
}

export async function updateTrack(
  id: number,
  updates: Partial<InsertTrack>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(tracks).set(updates).where(eq(tracks.id, id));
}

export async function deleteTrack(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(tracks).where(eq(tracks.id, id));
}

// ============= TRACK REQUEST OPERATIONS =============
export async function createTrackRequest(
  request: InsertTrackRequest
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(trackRequests).values(request);
  return Number(result[0].insertId);
}

export async function getTrackRequests(
  userId?: string
): Promise<TrackRequest[]> {
  const db = await getDb();
  if (!db) return [];

  if (userId) {
    return await db
      .select()
      .from(trackRequests)
      .where(eq(trackRequests.userId, userId))
      .orderBy(desc(trackRequests.createdAt));
  }

  return await db
    .select()
    .from(trackRequests)
    .orderBy(desc(trackRequests.createdAt));
}

export async function updateTrackRequest(
  id: number,
  updates: Partial<InsertTrackRequest>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(trackRequests).set(updates).where(eq(trackRequests.id, id));
}

// ============= DEVICE OPERATIONS =============
export async function createDevice(device: InsertDevice): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(devices).values(device);
  return Number(result[0].insertId);
}

export async function getDevice(id: number): Promise<Device | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(devices)
    .where(eq(devices.id, id))
    .limit(1);
  return result[0];
}

export async function getOrganizationDevices(
  organizationId: number
): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(devices)
    .where(eq(devices.organizationId, organizationId))
    .orderBy(desc(devices.createdAt));
}

export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(devices).orderBy(desc(devices.createdAt));
}

export async function updateDevice(
  id: number,
  updates: Partial<InsertDevice>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(devices).set(updates).where(eq(devices.id, id));
}

export async function deleteDevice(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(devices).where(eq(devices.id, id));
}

// ============= INVITATION OPERATIONS =============
export async function createInvitation(
  invitation: InsertInvitation
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(invitations).values(invitation);
  return Number(result[0].insertId);
}

export async function getInvitation(
  id: number
): Promise<Invitation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);
  return result[0];
}

export async function getInvitationByToken(
  token: string
): Promise<Invitation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);
  return result[0];
}

export async function getAllInvitations(): Promise<Invitation[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(invitations)
    .orderBy(desc(invitations.createdAt));
}

export async function updateInvitation(
  id: number,
  updates: Partial<InsertInvitation>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(invitations).set(updates).where(eq(invitations.id, id));
}

// ============= ORGANIZATION REQUEST OPERATIONS =============
export async function createOrganizationRequest(
  request: InsertOrganizationRequest
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(organizationRequests).values(request);
  return Number(result[0].insertId);
}

export async function getOrganizationRequests(
  userId?: string
): Promise<OrganizationRequest[]> {
  const db = await getDb();
  if (!db) return [];

  if (userId) {
    return await db
      .select()
      .from(organizationRequests)
      .where(eq(organizationRequests.userId, userId))
      .orderBy(desc(organizationRequests.createdAt));
  }

  return await db
    .select()
    .from(organizationRequests)
    .orderBy(desc(organizationRequests.createdAt));
}

export async function updateOrganizationRequest(
  id: number,
  updates: Partial<InsertOrganizationRequest>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(organizationRequests)
    .set(updates)
    .where(eq(organizationRequests.id, id));
}

// ============= UPCOMING CARE OPERATIONS =============
export async function createUpcomingCare(
  care: InsertUpcomingCare
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(upcomingCare).values(care);
  return Number(result[0].insertId);
}

export async function getOrganizationUpcomingCare(
  organizationId: number
): Promise<UpcomingCare[]> {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(upcomingCare)
    .where(
      and(
        eq(upcomingCare.organizationId, organizationId),
        eq(upcomingCare.completed, false)
      )
    )
    .orderBy(upcomingCare.scheduledDate);
}

export async function updateUpcomingCare(
  id: number,
  updates: Partial<InsertUpcomingCare>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(upcomingCare).set(updates).where(eq(upcomingCare.id, id));
}

// ============= API SETTINGS OPERATIONS =============
export async function getApiSettings(): Promise<ApiSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiSettings).limit(1);
  return result[0];
}

export async function updateApiSettings(
  updates: Partial<InsertApiSettings>,
  updatedBy: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getApiSettings();
  if (existing) {
    await db
      .update(apiSettings)
      .set({ ...updates, updatedBy })
      .where(eq(apiSettings.id, existing.id));
  } else {
    await db.insert(apiSettings).values({ ...updates, updatedBy } as any);
  }
}

// ============= DASHBOARD STATISTICS =============
export async function getDashboardStats(organizationIds: number[]) {
  const db = await getDb();
  if (!db) return null;

  // Get horses for these organizations
  const orgHorses = await db
    .select()
    .from(horses)
    .where(inArray(horses.organizationId, organizationIds));

  const horseIds = orgHorses.map((h) => h.id);

  if (horseIds.length === 0) {
    return {
      activeHorses: 0,
      averageHeartRate: 0,
      averageTemperature: 0,
      activeAlerts: 0,
    };
  }

  // Get recent sessions
  const recentSessions = await db
    .select()
    .from(sessions)
    .where(inArray(sessions.horseId, horseIds))
    .orderBy(desc(sessions.sessionDate))
    .limit(100);

  // Calculate statistics
  let totalHeartRate = 0;
  let totalTemperature = 0;
  let heartRateCount = 0;
  let temperatureCount = 0;
  let activeAlerts = 0;

  for (const session of recentSessions) {
    if (session.performanceData) {
      const data = session.performanceData as any;
      if (data.heartRate && Array.isArray(data.heartRate)) {
        const avgHR =
          data.heartRate.reduce((a: number, b: number) => a + b, 0) /
          data.heartRate.length;
        totalHeartRate += avgHR;
        heartRateCount++;
      }
      if (data.temperature) {
        totalTemperature += data.temperature;
        temperatureCount++;
      }
    }
    if (
      session.injuryRisk === "high" ||
      session.injuryRisk === "critical"
    ) {
      activeAlerts++;
    }
  }

  return {
    activeHorses: orgHorses.filter((h) => h.status === "active").length,
    averageHeartRate:
      heartRateCount > 0 ? Math.round(totalHeartRate / heartRateCount) : 0,
    averageTemperature:
      temperatureCount > 0
        ? Math.round((totalTemperature / temperatureCount) * 10) / 10
        : 0,
    activeAlerts,
  };
}

export type ApiSettings = typeof apiSettings.$inferSelect;

