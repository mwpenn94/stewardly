/**
 * roles router — exposes the current user's 5-layer RBAC state to the frontend.
 *
 * The frontend's useRoles() hook calls roles.me to compute progressive-disclosure
 * sidebar visibility (which sections to show for L1 platform admin, L2 org admin,
 * L3 manager, L4 professional, L5 user).
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getCurrentRoles } from "../_core/rbac";

export const rolesRouter = router({
  /** Return the current user's globalRole + active org memberships. */
  me: protectedProcedure.query(async ({ ctx }) => {
    return getCurrentRoles(ctx.user.id);
  }),

  /** Return roles for an arbitrary user — global_admin only (used by admin console). */
  forUser: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const me = await getCurrentRoles(ctx.user.id);
      if (me.globalRole !== "global_admin" && ctx.user.id !== input.userId) {
        // Non-admins can only inspect themselves.
        throw new Error("Forbidden");
      }
      return getCurrentRoles(input.userId);
    }),
});
