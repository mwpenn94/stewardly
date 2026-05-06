# Glass Components Export

Extracted glass/substrate UI components from the Stewardly manus-next UX absorption work. These can be incorporated into any React + Tailwind 4 project.

## Files

| File | Purpose |
|------|---------|
| `design-tokens.css` | OKLCH color tokens (dark/light), thinking-shimmer animation, message-in animation, scroll-mask utilities, font scale system |
| `ChatGreeting.tsx` | Manus-next style greeting with serif heading, subtitle, horizontal engine suggestion cards, quick action pills |
| `AppsGridMenu.tsx` | 4-engine grid drawer (popover) for sidebar bottom bar — Wealth, People, Learning, Intelligence |
| `VoiceOrb.tsx` | Animated voice state orb with glass surface, glow rings, pulse animations |
| `PersonaSidebar5.tsx` | Sidebar navigation with persona layers (WEALTH/PROFESSIONAL/LEADERSHIP/PLATFORM sections) |
| `substrate/ActionIndicator.tsx` | Agent state indicator (thinking/generating/tool_active) with shimmer animation |
| `substrate/TierBadge.tsx` | Cost tier badge (Economy/Standard/Premium) with color-coded dot |
| `substrate/QualityScoreDisplay.tsx` | Response quality score with animated ring |
| `substrate/SovereignModeIndicator.tsx` | BYO/Sovereign mode status indicator |
| `substrate/ConnectionQualityIndicator.tsx` | WebSocket connection quality with signal bars |
| `substrate/WorkspaceArtifactsPanel.tsx` | Collapsible right panel for artifacts/workspace |
| `substrate/SearchCascadePanel.tsx` | Multi-source search cascade with latency display |
| `substrate/MemoryInsightPanel.tsx` | Memory context insight display |
| `substrate/ATLASGoalPanel.tsx` | Goal tracking panel with progress indicators |

## Key Design Patterns

- **Glass surfaces**: `bg-card/40 backdrop-blur-sm border border-border/40` for frosted glass effect
- **Depth layers**: Use `shadow-sm` for cards, `shadow-md shadow-black/20` for elevated elements
- **Thinking shimmer**: Apply `.thinking-shimmer` class for the animated gradient loading state
- **Message animation**: `animate-message-in` for fade+slide entry on new messages
- **Scroll mask**: `[mask-image:linear-gradient(to_bottom,transparent_0px,black_8px,black_calc(100%-8px),transparent_100%)]` for faded edges on scrollable lists
- **OKLCH tokens**: All colors use OKLCH format for Tailwind 4 compatibility

## Dependencies

- React 19
- Tailwind CSS 4
- Framer Motion
- Lucide React icons
- shadcn/ui (Popover, Tooltip, Button)
