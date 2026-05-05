/**
 * CapabilityTiersPanel — Unified view of all capability domains with their
 * active tier, usage meters, and upgrade CTAs.
 * 
 * Shows quality-first degradation across:
 * Search, Image Generation, Voice TTS, Voice STT, Browser,
 * Deep Research, LLM, Code Execution, Document Generation
 */
import { useState } from "react";
import {
  Search,
  Image,
  Mic,
  Headphones,
  Globe,
  Brain,
  Cpu,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";

const DOMAIN_ICONS: Record<string, any> = {
  search: Search,
  image_generation: Image,
  voice_tts: Mic,
  voice_stt: Headphones,
  browser: Globe,
  research: Brain,
  llm: Sparkles,
  code_execution: Cpu,
  document_generation: FileText,
};

const QUALITY_COLORS: Record<string, string> = {
  premium: "text-green-400 bg-green-500/10 border-green-500/20",
  high: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  standard: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  degraded: "text-red-400 bg-red-500/10 border-red-500/20",
  enterprise: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const QUALITY_LABELS: Record<string, string> = {
  premium: "Premium",
  high: "High",
  standard: "Standard",
  degraded: "Degraded",
  enterprise: "Enterprise",
};

export default function CapabilityTiersPanel() {
  const tiersQuery = trpc.preferences.getCapabilityTiers.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  if (tiersQuery.isLoading) {
    return (
      <div className="mt-8 pt-6 border-t border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-72 bg-muted rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (tiersQuery.error) {
    return (
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-sm text-red-400">Failed to load capability tiers.</p>
      </div>
    );
  }

  const { definitions, summary } = tiersQuery.data || { definitions: [], summary: [] };

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>
        Capability Tiers
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Each capability uses the highest-quality free tier available, degrading gracefully when quotas are exhausted.
        Configure API keys to unlock premium tiers.
      </p>

      {/* Summary Grid */}
      <div className="space-y-2">
        {summary.map((cap: any) => {
          const Icon = DOMAIN_ICONS[cap.domain] || Sparkles;
          const isExpanded = expandedDomain === cap.domain;
          const definition = definitions.find((d: any) => d.domain === cap.domain);
          const qualityColor = QUALITY_COLORS[cap.activeTier.quality] || QUALITY_COLORS.standard;

          return (
            <div key={cap.domain} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Summary Row */}
              <button
                onClick={() => setExpandedDomain(isExpanded ? null : cap.domain)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left"
              >
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", qualityColor.split(" ").slice(1).join(" "))}>
                  <Icon className={cn("w-4 h-4", qualityColor.split(" ")[0])} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{cap.displayName}</p>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", qualityColor)}>
                      {QUALITY_LABELS[cap.activeTier.quality]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{cap.activeTier.name}</p>
                </div>
                {/* Usage meter */}
                {cap.usagePercent > 0 && (
                  <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", cap.usagePercent > 80 ? "bg-red-400" : "bg-primary")}
                      style={{ width: `${Math.min(cap.usagePercent, 100)}%` }}
                    />
                  </div>
                )}
                {cap.degraded && (
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                )}
                {!cap.degraded && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && definition && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                      {/* All Tiers */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Available Tiers (quality-first cascade)</p>
                        <div className="space-y-1.5">
                          {definition.tiers.map((tier: any) => (
                            <div
                              key={tier.level}
                              className={cn(
                                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs",
                                tier.level === cap.activeTier.level
                                  ? "bg-primary/10 border border-primary/20"
                                  : "bg-muted/30"
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold",
                                tier.available ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                              )}>
                                {tier.level}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-foreground">{tier.name}</span>
                                {tier.monthlyQuota > 0 && (
                                  <span className="ml-1 text-muted-foreground">({tier.monthlyQuota.toLocaleString()}/mo)</span>
                                )}
                                {tier.monthlyQuota === -1 && (
                                  <span className="ml-1 text-muted-foreground">(unlimited)</span>
                                )}
                              </div>
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", QUALITY_COLORS[tier.quality])}>
                                {QUALITY_LABELS[tier.quality]}
                              </span>
                              {tier.level === cap.activeTier.level && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Active</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upgrades */}
                      {definition.upgrades && definition.upgrades.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Available Upgrades
                          </p>
                          <div className="space-y-1.5">
                            {definition.upgrades.map((upgrade: any) => (
                              <div key={upgrade.provider} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/20 border border-border">
                                <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-foreground">{upgrade.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{upgrade.description}</p>
                                  <p className="text-[10px] text-primary mt-0.5">{upgrade.priceEstimate}</p>
                                </div>
                                {upgrade.setupUrl && (
                                  <a
                                    href={upgrade.setupUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-0.5 shrink-0"
                                  >
                                    Setup <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-[10px] text-muted-foreground">Quality levels:</span>
        {Object.entries(QUALITY_LABELS).map(([key, label]) => (
          <span key={key} className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", QUALITY_COLORS[key])}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
