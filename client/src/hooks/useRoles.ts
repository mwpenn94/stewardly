/**
 * useRoles — frontend RBAC hook for Stewardly's 5-layer architecture.
 *
 * Drives progressive-disclosure sidebar visibility:
 *   - L5 user only         → sees Connections, Portfolio, Economic Data
 *   - L4 professional+     → also sees Households (clients)
 *   - L3 manager+          → also sees Team
 *   - L2 org_admin+        → also sees Organization Settings
 *   - L1 global_admin      → also sees Platform Settings + Admin Console
 *
 * Higher tiers strictly subsume lower tiers within their scope.
 */
import { trpc } from "@/lib/trpc";

export type GlobalRole = "global_admin" | "user";
export type OrganizationRole = "org_admin" | "manager" | "professional" | "user";

export type OrgMembership = {
  organizationId: number;
  organizationName: string;
  organizationSlug: string;
  organizationRole: OrganizationRole;
  managerId: number | null;
  professionalId: number | null;
  status: "active" | "inactive" | "invited" | "pending_approval" | null;
};

export type UserRoles = {
  userId: number;
  globalRole: GlobalRole;
  orgs: OrgMembership[];
};

const ORG_ROLE_RANK: Record<OrganizationRole, number> = {
  user: 1,
  professional: 2,
  manager: 3,
  org_admin: 4,
};

export interface UseRolesResult {
  roles: UserRoles | null;
  isLoading: boolean;
  isError: boolean;
  /** True iff the user is a platform admin (L1). */
  isGlobalAdmin: boolean;
  /** Highest organizationRole across all the user's active org memberships. */
  highestOrgRole: OrganizationRole | null;
  /** True iff the user has at least one membership at or above `role` in any org. */
  hasOrgRoleAnywhere: (role: OrganizationRole) => boolean;
  /** True iff the user has at least `role` in the given org (or is global_admin). */
  hasOrgRoleIn: (orgId: number, role: OrganizationRole) => boolean;
  /** Convenience flags for sidebar progressive disclosure. */
  canSeeProfessional: boolean;
  canSeeManager: boolean;
  canSeeOrgAdmin: boolean;
  canSeePlatform: boolean;
  canSeeAdminConsole: boolean;
}

export function useRoles(): UseRolesResult {
  const query = trpc.roles.me.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  const roles = query.data ?? null;
  const isGlobalAdmin = roles?.globalRole === "global_admin";

  const highestOrgRole: OrganizationRole | null = (() => {
    if (!roles?.orgs.length) return null;
    let best: OrganizationRole = "user";
    let bestRank = ORG_ROLE_RANK.user;
    for (const m of roles.orgs) {
      const rank = ORG_ROLE_RANK[m.organizationRole] ?? 0;
      if (rank > bestRank) {
        best = m.organizationRole;
        bestRank = rank;
      }
    }
    return best;
  })();

  function hasOrgRoleAnywhere(role: OrganizationRole): boolean {
    if (isGlobalAdmin) return true;
    if (!roles?.orgs.length) return false;
    const required = ORG_ROLE_RANK[role];
    return roles.orgs.some(m => ORG_ROLE_RANK[m.organizationRole] >= required);
  }

  function hasOrgRoleIn(orgId: number, role: OrganizationRole): boolean {
    if (isGlobalAdmin) return true;
    const m = roles?.orgs.find(o => o.organizationId === orgId);
    if (!m) return false;
    return ORG_ROLE_RANK[m.organizationRole] >= ORG_ROLE_RANK[role];
  }

  return {
    roles,
    isLoading: query.isLoading,
    isError: query.isError,
    isGlobalAdmin: !!isGlobalAdmin,
    highestOrgRole,
    hasOrgRoleAnywhere,
    hasOrgRoleIn,
    canSeeProfessional: hasOrgRoleAnywhere("professional"),
    canSeeManager: hasOrgRoleAnywhere("manager"),
    canSeeOrgAdmin: hasOrgRoleAnywhere("org_admin"),
    canSeePlatform: !!isGlobalAdmin,
    canSeeAdminConsole: !!isGlobalAdmin,
  };
}
