import {
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

// ============= USERS =============
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["standard", "veterinarian"])
    .default("standard")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
  status: mysqlEnum("status", ["active", "suspended", "deactivated"])
    .default("active")
    .notNull(),
  // User preferences
  language: varchar("language", { length: 10 }).default("en"),
  theme: mysqlEnum("theme", ["light", "dark", "auto"]).default("auto"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  locale: varchar("locale", { length: 10 }).default("en-US"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============= ORGANIZATIONS =============
export const organizations = mysqlTable("organizations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  contactInfo: json("contactInfo").$type<{
    phone?: string;
    email?: string;
    address?: string;
  }>(),
  ownerId: varchar("ownerId", { length: 64 }).notNull(),
  notificationSettings: json("notificationSettings").$type<{
    injuryRiskThreshold?: number;
    emailNotifications?: boolean;
  }>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ============= USER-ORGANIZATION MAPPING =============
export const userOrganizations = mysqlTable(
  "userOrganizations",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: varchar("userId", { length: 64 }).notNull(),
    organizationId: int("organizationId").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userOrgIdx: uniqueIndex("user_org_idx").on(
      table.userId,
      table.organizationId
    ),
  })
);

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type InsertUserOrganization = typeof userOrganizations.$inferInsert;

// ============= DEVICES =============
export const devices = mysqlTable("devices", {
  id: int("id").primaryKey().autoincrement(),
  serialNumber: varchar("serialNumber", { length: 100 }).notNull().unique(),
  organizationId: int("organizationId").notNull(),
  horseId: int("horseId"),
  status: mysqlEnum("status", ["active", "inactive", "maintenance"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Device = typeof devices.$inferSelect;
export type InsertDevice = typeof devices.$inferInsert;

// ============= HORSES =============
export const horses = mysqlTable("horses", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  alias: varchar("alias", { length: 255 }),
  breed: varchar("breed", { length: 100 }),
  status: mysqlEnum("status", ["active", "injured", "retired", "inactive"])
    .default("active")
    .notNull(),
  organizationId: int("organizationId").notNull(),
  deviceId: int("deviceId"),
  healthRecords: json("healthRecords").$type<{
    vaccinations?: Array<{ date: string; type: string; notes?: string }>;
    medications?: Array<{ date: string; name: string; dosage?: string }>;
    conditions?: string[];
  }>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Horse = typeof horses.$inferSelect;
export type InsertHorse = typeof horses.$inferInsert;

// ============= USER FAVORITE HORSES =============
export const userFavoriteHorses = mysqlTable(
  "userFavoriteHorses",
  {
    id: int("id").primaryKey().autoincrement(),
    userId: varchar("userId", { length: 64 }).notNull(),
    horseId: int("horseId").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
  },
  (table) => ({
    userHorseIdx: uniqueIndex("user_horse_idx").on(table.userId, table.horseId),
  })
);

export type UserFavoriteHorse = typeof userFavoriteHorses.$inferSelect;
export type InsertUserFavoriteHorse = typeof userFavoriteHorses.$inferInsert;

// ============= TRACKS =============
export const tracks = mysqlTable("tracks", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  scope: mysqlEnum("scope", ["global", "local"]).default("local").notNull(),
  organizationId: int("organizationId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

// ============= TRACK REQUESTS =============
export const trackRequests = mysqlTable("trackRequests", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 }).notNull(),
  trackId: int("trackId"),
  requestType: mysqlEnum("requestType", ["create", "modify", "delete"])
    .notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  details: json("details").$type<{
    name?: string;
    type?: string;
    description?: string;
    reason?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type TrackRequest = typeof trackRequests.$inferSelect;
export type InsertTrackRequest = typeof trackRequests.$inferInsert;

// ============= SESSIONS =============
export const sessions = mysqlTable("sessions", {
  id: int("id").primaryKey().autoincrement(),
  horseId: int("horseId"),
  trackId: int("trackId").notNull(),
  sessionDate: datetime("sessionDate").notNull(),
  performanceData: json("performanceData").$type<{
    heartRate?: number[];
    speed?: number[];
    distance?: number;
    duration?: number;
    temperature?: number;
    gaitAnalysis?: any;
  }>(),
  injuryRisk: mysqlEnum("injuryRisk", ["low", "medium", "high", "critical"]),
  recoveryTarget: datetime("recoveryTarget"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ============= SESSION COMMENTS =============
export const sessionComments = mysqlTable("sessionComments", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("sessionId").notNull(),
  userId: varchar("userId", { length: 64 }).notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export type SessionComment = typeof sessionComments.$inferSelect;
export type InsertSessionComment = typeof sessionComments.$inferInsert;

// ============= INJURY RECORDS =============
export const injuryRecords = mysqlTable("injuryRecords", {
  id: int("id").primaryKey().autoincrement(),
  sessionId: int("sessionId").notNull(),
  affectedParts: json("affectedParts")
    .$type<string[]>()
    .notNull(),
  status: mysqlEnum("status", ["flagged", "dismissed", "diagnosed"])
    .default("flagged")
    .notNull(),
  notes: text("notes"),
  medicalDiagnosis: text("medicalDiagnosis"),
  veterinarianId: varchar("veterinarianId", { length: 64 }),
  notificationSent: boolean("notificationSent").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type InjuryRecord = typeof injuryRecords.$inferSelect;
export type InsertInjuryRecord = typeof injuryRecords.$inferInsert;

// ============= ORGANIZATION REQUESTS =============
export const organizationRequests = mysqlTable("organizationRequests", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 64 }).notNull(),
  requestType: mysqlEnum("requestType", ["create", "transfer"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  details: json("details").$type<{
    organizationName?: string;
    organizationId?: number;
    newOwnerId?: string;
    reason?: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type OrganizationRequest = typeof organizationRequests.$inferSelect;
export type InsertOrganizationRequest =
  typeof organizationRequests.$inferInsert;

// ============= INVITATIONS =============
export const invitations = mysqlTable("invitations", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["standard", "veterinarian"])
    .default("standard")
    .notNull(),
  organizationId: int("organizationId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "cancelled"])
    .default("pending")
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: datetime("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  acceptedAt: datetime("acceptedAt"),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// ============= UPCOMING CARE =============
export const upcomingCare = mysqlTable("upcomingCare", {
  id: int("id").primaryKey().autoincrement(),
  horseId: int("horseId").notNull(),
  organizationId: int("organizationId").notNull(),
  careType: varchar("careType", { length: 100 }).notNull(),
  scheduledDate: datetime("scheduledDate").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

export type UpcomingCare = typeof upcomingCare.$inferSelect;
export type InsertUpcomingCare = typeof upcomingCare.$inferInsert;

// ============= API SETTINGS (Admin only) =============
export const apiSettings = mysqlTable("apiSettings", {
  id: int("id").primaryKey().autoincrement(),
  batchSize: int("batchSize").default(100),
  delayMs: int("delayMs").default(1000),
  retryAttempts: int("retryAttempts").default(3),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  updatedBy: varchar("updatedBy", { length: 64 }),
});

export type ApiSettings = typeof apiSettings.$inferSelect;
export type InsertApiSettings = typeof apiSettings.$inferInsert;

