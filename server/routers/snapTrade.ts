/**
 * SnapTrade Router — Brokerage connection / account / position procedures.
 *
 * Live-only: requires SNAPTRADE_CLIENT_ID and SNAPTRADE_CONSUMER_KEY.
 * The underlying service throws a clear error when credentials are missing.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const snapTradeRouter = router({
  /** Whether platform creds are configured + this user's registration/connection counts */
  status: protectedProcedure.query(async ({ ctx }) => {
    const st = await import("../services/snapTradeService");
    const configured = await st.isPlatformConfigured();
    const userStatus = await st.getSnapTradeStatus(ctx.user!.id);
    return { platformConfigured: configured, ...userStatus };
  }),

  /** Generate a Connection Portal URL for the current user */
  getPortalUrl: protectedProcedure
    .input(z.object({ redirectUrl: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const st = await import("../services/snapTradeService");
      return st.getConnectionPortalUrl(ctx.user!.id, input?.redirectUrl);
    }),

  /** Sync brokerage connections (SnapTrade -> local DB) */
  syncConnections: protectedProcedure.mutation(async ({ ctx }) => {
    const st = await import("../services/snapTradeService");
    return st.syncBrokerageConnections(ctx.user!.id);
  }),

  /** Sync brokerage accounts + positions (SnapTrade -> local DB) */
  syncData: protectedProcedure.mutation(async ({ ctx }) => {
    const st = await import("../services/snapTradeService");
    await st.syncBrokerageConnections(ctx.user!.id);
    return st.syncAccountsAndPositions(ctx.user!.id);
  }),

  /** List the user's brokerage connections (local DB) */
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    const st = await import("../services/snapTradeService");
    return st.getUserBrokerageConnections(ctx.user!.id);
  }),

  /** List the user's brokerage accounts (local DB) */
  listAccounts: protectedProcedure.query(async ({ ctx }) => {
    const st = await import("../services/snapTradeService");
    return st.getUserAccounts(ctx.user!.id);
  }),

  /** List the user's positions (local DB) */
  listPositions: protectedProcedure.query(async ({ ctx }) => {
    const st = await import("../services/snapTradeService");
    return st.getUserPositions(ctx.user!.id);
  }),

  /** Remove a brokerage connection (SnapTrade + local soft delete) */
  removeConnection: protectedProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const st = await import("../services/snapTradeService");
      const removed = await st.removeBrokerageConnection(ctx.user!.id, input.connectionId);
      return { removed };
    }),
});
