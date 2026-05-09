/**
 * GlassCard — iOS-26-inspired liquid-glass surface primitive.
 *
 * Visual recipe (kept as inline classes so it works without theme tokens):
 *   • multi-stop translucent gradient background
 *   • backdrop-blur for the frosted base
 *   • inset highlight ring (white/20 top, white/0 bottom) for the
 *     specular "lit edge" look
 *   • soft drop shadow that intensifies on hover for depth
 *   • subtle inner glow (radial via box-shadow) so the surface reads as
 *     volumetric, not flat
 *
 * The component is intentionally a thin wrapper over a div so it can be
 * dropped into any layout (sortable grid, hero card, sidebar tile).
 */
import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual intensity tier — affects blur strength and highlight opacity. */
  intensity?: "subtle" | "regular" | "vivid";
  /** Whether the card should respond visibly to hover (lift + brighter highlight). */
  interactive?: boolean;
}

const INTENSITY_CLASSES: Record<NonNullable<GlassCardProps["intensity"]>, string> = {
  subtle:
    "backdrop-blur-md bg-gradient-to-b from-white/[0.06] to-white/[0.02] dark:from-white/[0.04] dark:to-white/[0.01]",
  regular:
    "backdrop-blur-xl bg-gradient-to-b from-white/[0.10] to-white/[0.04] dark:from-white/[0.06] dark:to-white/[0.02]",
  vivid:
    "backdrop-blur-2xl bg-gradient-to-br from-white/[0.16] via-white/[0.08] to-white/[0.04] dark:from-white/[0.10] dark:via-white/[0.05] dark:to-white/[0.02]",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { className, intensity = "regular", interactive = false, children, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        data-glass-intensity={intensity}
        className={cn(
          // Base shape
          "relative rounded-2xl border border-white/10 dark:border-white/5",
          INTENSITY_CLASSES[intensity],
          // Specular top edge (gradient ring) + soft outer shadow
          "shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_24px_-12px_rgba(0,0,0,0.35)]",
          // Inner radial sheen (top-left highlight) via background-image overlay
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl",
          "before:bg-[radial-gradient(120%_60%_at_15%_0%,rgba(255,255,255,0.18),transparent_55%)]",
          "before:opacity-80",
          // Optional bottom shimmer
          "after:pointer-events-none after:absolute after:inset-x-4 after:bottom-0 after:h-px",
          "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
          interactive &&
            "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_1px_0_0_rgba(255,255,255,0.25)_inset,0_18px_36px_-14px_rgba(0,0,0,0.45)]",
          className,
        )}
        {...rest}
      >
        {/* Content layer must sit above the ::before sheen */}
        <div className="relative z-[1] h-full">{children}</div>
      </div>
    );
  },
);

export default GlassCard;
