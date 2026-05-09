/**
 * System Health Router
 * 
 * Exposes circuit breaker states, provider health, and system metrics
 * for the Sovereign dashboard's infrastructure monitoring panel.
 */
import { router } from "../_core/trpc";
import { globalAdminProcedure } from "../_core/rbac";
import { getAllCircuitStates } from "../services/failover";

export const systemHealthRouter = router({
  /** L1: circuit breaker states (global_admin only) */
  circuitBreakers: globalAdminProcedure.query(async () => {
    return getAllCircuitStates();
  }),

  /** L1: overall system health summary (global_admin only) */
  summary: globalAdminProcedure.query(async () => {
    const circuits = getAllCircuitStates();
    const openCircuits = Object.values(circuits).filter(c => c.isOpen);
    const totalFailures = Object.values(circuits).reduce((sum, c) => sum + c.failures, 0);
    
    return {
      status: openCircuits.length === 0 ? "healthy" : openCircuits.length < 3 ? "degraded" : "critical",
      openCircuits: openCircuits.length,
      totalServices: Object.keys(circuits).length,
      totalFailures,
      uptime: process.uptime(),
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      timestamp: Date.now(),
    };
  }),
});
