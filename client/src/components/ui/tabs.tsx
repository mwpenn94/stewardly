import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // R14.15: switch from `w-fit` (which clips/overlaps on mobile) to a
        // horizontally-scrollable strip so applet tab bars stay legible on
        // small screens. `inline-flex w-max` lets the bar grow naturally and
        // the parent `overflow-x-auto` does the scrolling.
        "bg-muted text-muted-foreground inline-flex h-9 w-max max-w-full items-center justify-start rounded-lg p-[3px] overflow-x-auto no-scrollbar",
        className,
        // R14.26 + R14.27: many call-sites pass `grid grid-cols-N` overrides
        // which on narrow viewports squeeze each tab into a column too small
        // for its label, producing the "WealFiranEarFkdaTtg…" overlap on
        // mobile (IMG_7798). Force-flex on small screens regardless of the
        // override so tabs always scroll horizontally; the consumer's grid
        // still applies at sm+ where it has room. R14.27 adds child-selector
        // overrides (`[&>*]:!w-auto`, `[&>*]:!min-w-fit`, `[&>*]:!shrink-0`)
        // because TabsTrigger children that previously relied on the grid
        // cell for their width would otherwise collapse to 0 and stack on
        // top of each other (IMG_7807) once the parent's grid was killed.
        "max-sm:!flex max-sm:!w-max max-sm:!overflow-x-auto max-sm:!flex-nowrap max-sm:[&>*]:!w-auto max-sm:[&>*]:!min-w-fit max-sm:[&>*]:!shrink-0"
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // R14.15: drop `flex-1` so each tab keeps its natural width and the
        // parent TabsList can scroll horizontally on mobile instead of
        // collapsing every tab into the same column.
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
