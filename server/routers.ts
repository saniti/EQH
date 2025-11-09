import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Veterinarian or admin procedure
const vetProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.userType !== "veterinarian") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Veterinarian or admin access required",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============= DASHBOARD =============
  dashboard: router({
    getStats: protectedProcedure.query(async ({ ctx }) => {
      const orgs = await db.getUserOrganizations(ctx.user.id);
      const orgIds = orgs.map((o) => o.id);
      return await db.getDashboardStats(orgIds);
    }),
    getFavoriteHorses: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserFavoriteHorses(ctx.user.id);
    }),
    getUpcomingCare: protectedProcedure.query(async ({ ctx }) => {
      const orgs = await db.getUserOrganizations(ctx.user.id);
      const allCare = [];
      for (const org of orgs) {
        const care = await db.getOrganizationUpcomingCare(org.id);
        allCare.push(...care);
      }
      return allCare.sort(
        (a, b) =>
          new Date(a.scheduledDate).getTime() -
          new Date(b.scheduledDate).getTime()
      );
    }),
  }),

  // ============= HORSES =============
  horses: router({
    list: protectedProcedure
      .input(
        z.object({
          organizationId: z.number().optional(),
          status: z.string().optional(),
          breed: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgIds = orgs.map((o) => o.id);

        if (input.organizationId && !orgIds.includes(input.organizationId)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const targetOrgId = input.organizationId || orgIds[0];
        if (!targetOrgId) return [];

        return await db.getOrganizationHorses(targetOrgId, {
          ...input,
          userId: ctx.user.id,
        });
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getHorse(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          alias: z.string().optional(),
          breed: z.string().optional(),
          status: z.enum(["active", "injured", "retired", "inactive"]).default("active"),
          organizationId: z.number(),
          deviceId: z.number().optional(),
          pictureUrl: z.string().optional(),
          healthRecords: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgIds = orgs.map((o) => o.id);

        if (!orgIds.includes(input.organizationId)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await db.createHorse(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          alias: z.string().optional(),
          breed: z.string().optional(),
          status: z.enum(["active", "injured", "retired", "inactive"]).optional(),
          deviceId: z.number().optional(),
          pictureUrl: z.string().optional(),
          healthRecords: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateHorse(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteHorse(input.id);
        return { success: true };
      }),
    addFavorite: protectedProcedure
      .input(z.object({ horseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addFavoriteHorse(ctx.user.id, input.horseId);
        return { success: true };
      }),
    removeFavorite: protectedProcedure
      .input(z.object({ horseId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeFavoriteHorse(ctx.user.id, input.horseId);
        return { success: true };
      }),
    getStats: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgIds = orgs.map((o) => o.id);

        if (!orgIds.includes(input.organizationId)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return await db.getHorseStats(input.organizationId);
      }),
    uploadPicture: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileData: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.fileData, "base64");
          const timestamp = Date.now();
          const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const key = `horses/${timestamp}-${sanitizedFileName}`;
          const result = await storagePut(key, buffer, input.contentType);
          return { success: true, url: result.url, key: result.key };
        } catch (error) {
          console.error('Upload error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        }
      }),
  }),

  // ============= SESSIONS =============
  sessions: router({
    list: protectedProcedure
      .input(
        z.object({
          organizationId: z.number().optional(),
          horseId: z.number().optional(),
          trackId: z.number().optional(),
          injuryRisk: z.string().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgIds = orgs.map((o) => o.id);

        console.log('[Sessions.list] Query params:', {
          organizationId: input.organizationId,
          horseId: input.horseId,
          userOrgs: orgIds,
        });

        // If organizationId is provided, validate user has access and use only that org
        if (input.organizationId) {
          if (!orgIds.includes(input.organizationId)) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          console.log('[Sessions.list] Filtering by organization:', input.organizationId);
          const sessions = await db.getOrganizationSessions([input.organizationId], input);
          console.log('[Sessions.list] Found sessions:', sessions.length);
          return sessions;
        }

        // Otherwise, use all organizations the user has access to
        console.log('[Sessions.list] Using all user organizations:', orgIds);
        const sessions = await db.getOrganizationSessions(orgIds, input);
        console.log('[Sessions.list] Found sessions:', sessions.length);
        return sessions;
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getSession(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          horseId: z.number(),
          trackId: z.number(),
          sessionDate: z.date(),
          performanceData: z.any().optional(),
          injuryRisk: z.enum(["low", "medium", "high", "critical"]).optional(),
          recoveryTarget: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createSession(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          performanceData: z.any().optional(),
          injuryRisk: z.enum(["low", "medium", "high", "critical"]).optional(),
          recoveryTarget: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateSession(id, updates);
        return { success: true };
      }),
    assignToHorse: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          horseId: z.number().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { assignSessionToHorse } = await import("./db-session-assign");
        await assignSessionToHorse(input.sessionId, input.horseId);
        return { success: true };
      }),

    updateTrack: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          trackId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.updateSession(input.sessionId, { trackId: input.trackId });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSession(input.id);
        return { success: true };
      }),
    getComments: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSessionComments(input.sessionId);
      }),
    addComment: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          comment: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.addSessionComment({
          sessionId: input.sessionId,
          userId: ctx.user.id,
          comment: input.comment,
        });
      }),
  }),

  // ============= INJURY RECORDS =============
  injuries: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgIds = orgs.map((o) => o.id);
        
        // If organizationId is provided, validate access
        if (input.organizationId) {
          if (!orgIds.includes(input.organizationId)) {
            throw new TRPCError({ code: "FORBIDDEN" });
          }
          return await db.getOrganizationInjuryRecords([input.organizationId]);
        }
        
        // Otherwise return all injuries for user's organizations
        return await db.getOrganizationInjuryRecords(orgIds);
      }),
    getBySession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSessionInjuryRecords(input.sessionId);
      }),
    create: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          affectedParts: z.array(z.string()),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createInjuryRecord({
          ...input,
          status: "flagged",
        });
      }),
    update: vetProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["flagged", "dismissed", "diagnosed"]).optional(),
          medicalDiagnosis: z.string().optional(),
          notes: z.string().optional(),
          notificationSent: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateInjuryRecord(id, {
          ...updates,
          veterinarianId: ctx.user.id,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInjuryRecord(input.id);
        return { success: true };
      }),
  }),

  // ============= TRACKS =============
  tracks: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgId = input.organizationId || orgs[0]?.id;
        return await db.getAvailableTracks(orgId);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTrack(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          type: z.string().optional(),
          scope: z.enum(["global", "local"]).default("local"),
          organizationId: z.number().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (input.scope === "global" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can create global tracks",
          });
        }
        return await db.createTrack(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          type: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        
        // Get the track to check permissions
        const track = await db.getTrack(id);
        if (!track) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
        }
        
        // Only admins can edit global tracks
        if (track.scope === "global" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can edit global tracks",
          });
        }
        
        // For local tracks, check if user is in the organization
        if (track.scope === "local" && track.organizationId) {
          const userOrgs = await db.getUserOrganizations(ctx.user.id);
          const hasAccess = userOrgs.some(org => org.id === track.organizationId);
          if (!hasAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to edit this track",
            });
          }
        }
        
        await db.updateTrack(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Get the track to check permissions
        const track = await db.getTrack(input.id);
        if (!track) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Track not found" });
        }
        
        // Only admins can delete global tracks
        if (track.scope === "global" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can delete global tracks",
          });
        }
        
        // For local tracks, check if user is in the organization
        if (track.scope === "local" && track.organizationId) {
          const userOrgs = await db.getUserOrganizations(ctx.user.id);
          const hasAccess = userOrgs.some(org => org.id === track.organizationId);
          if (!hasAccess) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You don't have permission to delete this track",
            });
          }
        }
        
        await db.deleteTrack(input.id);
        return { success: true };
      }),
    createRequest: protectedProcedure
      .input(
        z.object({
          trackId: z.number().optional(),
          requestType: z.enum(["create", "modify", "delete"]),
          details: z.any(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createTrackRequest({
          userId: ctx.user.id,
          ...input,
          status: "pending",
        });
      }),
    getRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return await db.getTrackRequests();
      }
      return await db.getTrackRequests(ctx.user.id);
    }),
    approveRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateTrackRequest(input.id, { status: "approved" });
        return { success: true };
      }),
    rejectRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateTrackRequest(input.id, { status: "rejected" });
        return { success: true };
      }),
  }),

  // ============= DEVICES =============
  devices: router({
    list: protectedProcedure
      .input(z.object({ organizationId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role === "admin") {
          return await db.getAllDevices();
        }

        const orgs = await db.getUserOrganizations(ctx.user.id);
        const orgId = input.organizationId || orgs[0]?.id;

        if (!orgId) return [];
        return await db.getOrganizationDevices(orgId);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDevice(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          serialNumber: z.string(),
          organizationId: z.number(),
          horseId: z.number().optional(),
          status: z.enum(["active", "inactive", "maintenance"]).default("active"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.userType === "veterinarian" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Veterinarians cannot manage devices",
          });
        }
        return await db.createDevice(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          serialNumber: z.string().optional(),
          horseId: z.number().optional(),
          status: z.enum(["active", "inactive", "maintenance"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.userType === "veterinarian" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Veterinarians cannot manage devices",
          });
        }
        const { id, ...updates } = input;
        await db.updateDevice(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.userType === "veterinarian" && ctx.user.role !== "admin") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Veterinarians cannot manage devices",
          });
        }
        await db.deleteDevice(input.id);
        return { success: true };
      }),
  }),

  // ============= ORGANIZATIONS =============
  organizations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return await db.getAllOrganizations();
      }
      return await db.getUserOrganizations(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrganization(input.id);
      }),
    create: adminProcedure
      .input(
        z.object({
          name: z.string(),
          contactInfo: z.any().optional(),
          ownerId: z.string(),
          notificationSettings: z.any().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createOrganization(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          contactInfo: z.any().optional(),
          ownerId: z.string().optional(),
          notificationSettings: z.any().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const org = await db.getOrganization(id);
        
        if (!org) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }
        
        // Check if user is admin or owner of the organization
        if (ctx.user.role !== "admin" && org.ownerId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to update this organization",
          });
        }
        
        // Only admins can change the owner
        if (updates.ownerId && ctx.user.role !== "admin") {
          delete updates.ownerId;
        }
        
        await db.updateOrganization(id, updates);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteOrganization(input.id);
        return { success: true };
      }),
    createRequest: protectedProcedure
      .input(
        z.object({
          requestType: z.enum(["create", "transfer"]),
          details: z.any(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return await db.createOrganizationRequest({
          userId: ctx.user.id,
          ...input,
          status: "pending",
        });
      }),
    getRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === "admin") {
        return await db.getOrganizationRequests();
      }
      return await db.getOrganizationRequests(ctx.user.id);
    }),
    approveRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateOrganizationRequest(input.id, { status: "approved" });
        return { success: true };
      }),
    rejectRequest: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateOrganizationRequest(input.id, { status: "rejected" });
        return { success: true };
      }),
    addUser: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          organizationId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.addUserToOrganization(input.userId, input.organizationId);
        return { success: true };
      }),
    removeUser: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          organizationId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.removeUserFromOrganization(input.userId, input.organizationId);
        return { success: true };
      }),
  }),

  // ============= USER MANAGEMENT (Admin) =============
  users: router({
    list: adminProcedure.query(async () => {
      return await db.getAllUsers();
    }),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await db.getUser(input.id);
      }),
    update: adminProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          email: z.string().optional(),
          role: z.enum(["user", "admin"]).optional(),
          userType: z.enum(["standard", "veterinarian"]).optional(),
          status: z.enum(["active", "suspended", "deactivated"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateUser(id, updates);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.deleteUser(input.id);
        return { success: true };
      }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          language: z.string().optional(),
          theme: z.enum(["light", "dark", "auto"]).optional(),
          timezone: z.string().optional(),
          locale: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUser(ctx.user.id, input);
        return { success: true };
      }),
    getOrganizations: adminProcedure
      .input(z.object({ userId: z.string() }))
      .query(async ({ input }) => {
        return await db.getUserOrganizations(input.userId);
      }),
    addToOrganization: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          organizationId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.addUserToOrganization(input.userId, input.organizationId);
        return { success: true };
      }),
    removeFromOrganization: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          organizationId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        await db.removeUserFromOrganization(input.userId, input.organizationId);
        return { success: true };
      }),
  }),

  // ============= INVITATIONS (Admin) =============
  invitations: router({
    list: adminProcedure.query(async () => {
      return await db.getAllInvitations();
    }),
    create: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          role: z.enum(["user", "admin"]).default("user"),
          userType: z.enum(["standard", "veterinarian"]).default("standard"),
          organizationId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const token = Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return await db.createInvitation({
          ...input,
          token,
          expiresAt,
          status: "pending",
        });
      }),
    cancel: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateInvitation(input.id, { status: "cancelled" });
        return { success: true };
      }),
  }),

  // ============= UPCOMING CARE =============
  upcomingCare: router({
    create: protectedProcedure
      .input(
        z.object({
          horseId: z.number(),
          organizationId: z.number(),
          careType: z.string(),
          scheduledDate: z.date(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createUpcomingCare(input);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          careType: z.string().optional(),
          scheduledDate: z.date().optional(),
          description: z.string().optional(),
          completed: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await db.updateUpcomingCare(id, updates);
        return { success: true };
      }),
  }),

  // ============= API SETTINGS (Admin) =============
  apiSettings: router({
    get: adminProcedure.query(async () => {
      return await db.getApiSettings();
    }),
    update: adminProcedure
      .input(
        z.object({
          batchSize: z.number().optional(),
          delayMs: z.number().optional(),
          retryAttempts: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateApiSettings(input, ctx.user.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

