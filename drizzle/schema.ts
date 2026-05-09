import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, boolean as mysqlBoolean, index, uniqueIndex, decimal, primaryKey, unique, date, float } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Stripe customer ID — set on first checkout */
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  /** Stripe subscription ID — set on subscription creation */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  /** Stripe subscription status (active, trialing, past_due, canceled, etc.) */
  stripeSubscriptionStatus: varchar("stripeSubscriptionStatus", { length: 64 }),
  /** Stripe plan / price id */
  stripePlanId: varchar("stripePlanId", { length: 128 }),
  /** Stripe current period end (epoch ms) */
  stripeCurrentPeriodEnd: bigint("stripeCurrentPeriodEnd", { mode: "number" }),
  /** Auth tier — anonymous (guest), free, premium, etc. Source-app compatible. */
  authTier: varchar("authTier", { length: 32 }).default("free"),
  /** Auth provider (google, linkedin, github, microsoft365, password, manus) */
  authProvider: varchar("authProvider", { length: 32 }),
  /** Hashed password (bcrypt) for password-based auth */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** Avatar URL */
  avatarUrl: text("avatarUrl"),
  /** TOS acceptance timestamp */
  tosAcceptedAt: timestamp("tosAcceptedAt"),
  /** JSON blob for arbitrary user settings (theme, prefs cache, etc.) */
  settings: json("settings"),
  /** Suitability questionnaire completion + data (financial profile) */
  suitabilityCompleted: boolean("suitabilityCompleted").default(false),
  suitabilityData: json("suitabilityData"),
  /** Style profile blob (used by personalization engine) */
  styleProfile: json("styleProfile"),
  /** Anonymous conversation count (for guest gating) */
  anonymousConversationCount: int("anonymousConversationCount").default(0),
  /** Affiliate organization id (which firm this user joined under) */
  affiliateOrgId: int("affiliateOrgId"),
  /** Job title and employer (from LinkedIn / manual) */
  jobTitle: varchar("jobTitle", { length: 255 }),
  employerName: varchar("employerName", { length: 255 }),
  /** Profile enrichment metadata */
  profileEnrichedAt: timestamp("profileEnrichedAt"),
  profileEnrichmentSource: varchar("profileEnrichmentSource", { length: 64 }),
  /** Sign-in data blob (raw OAuth payload for debugging) */
  signInDataJson: json("signInDataJson"),
  /** Provider-specific identifiers + enriched profile data */
  googleId: varchar("googleId", { length: 128 }),
  googlePhone: varchar("googlePhone", { length: 64 }),
  googleBirthday: varchar("googleBirthday", { length: 32 }),
  googleGender: varchar("googleGender", { length: 32 }),
  googleAddressJson: json("googleAddressJson"),
  googleOrganizationsJson: json("googleOrganizationsJson"),
  linkedinId: varchar("linkedinId", { length: 128 }),
  linkedinHeadline: varchar("linkedinHeadline", { length: 512 }),
  linkedinIndustry: varchar("linkedinIndustry", { length: 128 }),
  linkedinLocation: varchar("linkedinLocation", { length: 255 }),
  linkedinProfileUrl: varchar("linkedinProfileUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Tasks ──
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["idle", "running", "completed", "error", "paused", "stopped", "input_required"]).default("idle").notNull(),
  workspaceUrl: text("workspaceUrl"),
  currentStep: varchar("currentStep", { length: 500 }),
  totalSteps: int("totalSteps"),
  completedSteps: int("completedSteps"),
  /** Per-task system prompt override (null = use global default) */
  systemPrompt: text("systemPrompt"),
  /** Optional project association (null = standalone task) */
  projectId: int("projectId"),
  /** Soft-delete flag: archived tasks are hidden from sidebar but preserved */
  archived: int("archived").default(0).notNull(),
  /** Favorite/bookmark flag for quick access */
  favorite: int("favorite").default(0).notNull(),
  /** Flag: set to 1 when task was auto-completed by stale sweep */
  staleCompleted: int("staleCompleted").default(0).notNull(),
  /** Task priority: high=1, normal=2, low=3 (lower number = higher priority) */
  priority: int("priority").default(2).notNull(),
  /** Per-task timeout in seconds (null = use default 300s) */
  timeoutSeconds: int("timeoutSeconds"),
  /** Per-task recursive optimization override (null = use user preference) */
  taskRecursiveOptEnabled: boolean("taskRecursiveOptEnabled"),
  /** Per-task optimization depth override (null = use user preference) */
  taskRecursiveOptDepth: int("taskRecursiveOptDepth"),
  /** Number of retry attempts made for this task */
  retryCount: int("retryCount").default(0).notNull(),
  /** Maximum retries allowed (null = use default 3) */
  maxRetries: int("maxRetries"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("tasks_userId_idx").on(table.userId),
  statusIdx: index("tasks_status_idx").on(table.status),
  projectIdIdx: index("tasks_projectId_idx").on(table.projectId),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ── Task Ratings ──
export const taskRatings = mysqlTable("task_ratings", {
  id: int("id").autoincrement().primaryKey(),
  taskExternalId: varchar("taskExternalId", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  feedback: text("feedback"), // Optional text feedback
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskRating = typeof taskRatings.$inferSelect;
export type InsertTaskRating = typeof taskRatings.$inferInsert;

// ── Task Messages ──
export const taskMessages = mysqlTable("task_messages", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  externalId: varchar("externalId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  actions: json("actions"),
  cardType: varchar("cardType", { length: 64 }),
  cardData: json("cardData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdIdx: index("taskMessages_taskId_idx").on(table.taskId),
}));

export type TaskMessage = typeof taskMessages.$inferSelect;
export type InsertTaskMessage = typeof taskMessages.$inferInsert;

// ── Bridge Config ──
export const bridgeConfigs = mysqlTable("bridge_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bridgeUrl: text("bridgeUrl"),
  apiKey: text("apiKey"),
  enabled: int("enabled").default(0).notNull(),
  lastConnected: timestamp("lastConnected"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BridgeConfig = typeof bridgeConfigs.$inferSelect;
export type InsertBridgeConfig = typeof bridgeConfigs.$inferInsert;

// ── Task Files (S3 attachments) ──
export const taskFiles = mysqlTable("task_files", {
  id: int("id").autoincrement().primaryKey(),
  taskExternalId: varchar("taskExternalId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 1024 }).notNull(),
  url: text("url").notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  size: int("size"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskFile = typeof taskFiles.$inferSelect;
export type InsertTaskFile = typeof taskFiles.$inferInsert;

// ── User Preferences (settings + capability toggles + system prompt) ──
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  /** JSON object: { notifications: bool, soundEffects: bool, autoExpandActions: bool, compactMode: bool } */
  generalSettings: json("generalSettings"),
  /** JSON object: { "package-name": bool, ... } mapping capability package names to enabled/disabled */
  capabilities: json("capabilities"),
  /** Global default system prompt for all tasks (overridden by per-task systemPrompt) */
  systemPrompt: text("systemPrompt"),
  /** Live Preview tier: auto | webcontainer | vercel | codespace */
  previewTier: varchar("previewTier", { length: 32 }).default("auto"),
  /** Vercel project ID (if connected) */
  vercelProjectId: varchar("vercelProjectId", { length: 128 }),
  /** Vercel team slug (if connected) */
  vercelTeamSlug: varchar("vercelTeamSlug", { length: 128 }),
  /** Whether user has granted codespace scope on their GitHub token */
  codespaceScopeGranted: boolean("codespaceScopeGranted").default(false).notNull(),
  /** Search engine configuration: { searxngUrl?: string, braveApiKey?: string } */
  searchConfig: json("searchConfig"),
  /** Recursive Optimization: enable convergence-driven iterative improvement on tasks */
  recursiveOptimizationEnabled: boolean("recursiveOptimizationEnabled").default(false).notNull(),
  /** Recursive Optimization: number of consecutive clean passes required for convergence (1-1280) */
  recursiveOptimizationDepth: int("recursiveOptimizationDepth").default(3),
  /** Recursive Optimization: temperature strategy (conservative=0.15, balanced=0.5, exploratory=0.85) */
  recursiveOptimizationTemperature: varchar("recursiveOptimizationTemperature", { length: 32 }).default("balanced"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// ── Workspace Artifacts (browser screenshots, code, terminal output from bridge events) ──
export const workspaceArtifacts = mysqlTable("workspace_artifacts", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  /** Artifact type: browser_screenshot, browser_url, code, terminal */
  artifactType: mysqlEnum("artifactType", ["browser_screenshot", "browser_url", "code", "terminal", "generated_image", "document", "document_pdf", "document_docx", "document_xlsx", "document_csv", "slides", "webapp_preview", "webapp_deployed"]).notNull(),
  /** For code: filename. For terminal: command. For browser: page title. */
  label: varchar("label", { length: 500 }),
  /** Text content (code source, terminal output). Null for screenshots. */
  content: text("content"),
  /** URL for screenshots or browser URLs */
  url: text("url"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkspaceArtifact = typeof workspaceArtifacts.$inferSelect;
export type InsertWorkspaceArtifact = typeof workspaceArtifacts.$inferInsert;

// ── Memory Entries (cross-session knowledge) ──
export const memoryEntries = mysqlTable("memory_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Short key/label for the memory (e.g., "User prefers dark mode") */
  key: varchar("key", { length: 500 }).notNull(),
  /** Detailed value/content of the memory */
  value: text("value").notNull(),
  /** Source of the memory: auto-extracted from task, or user-created */
  source: mysqlEnum("source", ["auto", "user"]).default("auto").notNull(),
  /** Task that produced this memory (null for user-created) */
  taskExternalId: varchar("taskExternalId", { length: 64 }),
  /** Last time this memory was injected into an agent context */
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow().notNull(),
  /** Number of times this memory was injected into agent context */
  accessCount: int("accessCount").default(0).notNull(),
  /** Whether this memory has been auto-archived due to inactivity */
  archived: int("archived").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MemoryEntry = typeof memoryEntries.$inferSelect;
export type InsertMemoryEntry = typeof memoryEntries.$inferInsert;

// ── Task Shares (signed URL sharing) ──
export const taskShares = mysqlTable("task_shares", {
  id: int("id").autoincrement().primaryKey(),
  taskExternalId: varchar("taskExternalId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  /** Unique share token for the public URL */
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  /** Optional bcrypt password hash for protected shares */
  passwordHash: text("passwordHash"),
  /** Optional expiration timestamp */
  expiresAt: timestamp("expiresAt"),
  /** View count */
  viewCount: int("viewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskShare = typeof taskShares.$inferSelect;
export type InsertTaskShare = typeof taskShares.$inferInsert;

// ── Notifications ──
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Notification type: task_completed, task_error, share_viewed, system, stale_completed */
  type: mysqlEnum("type", ["task_completed", "task_error", "share_viewed", "system", "stale_completed"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  /** Related task external ID (optional) */
  taskExternalId: varchar("taskExternalId", { length: 64 }),
  /** Read status */
  read: int("read").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notifications_userId_idx").on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ── Scheduled Tasks ──
export const scheduledTasks = mysqlTable("scheduled_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Human-readable name for the schedule */
  name: varchar("name", { length: 500 }).notNull(),
  /** The prompt/instruction to execute */
  prompt: text("prompt").notNull(),
  /** Schedule type: cron or interval */
  scheduleType: mysqlEnum("scheduleType", ["cron", "interval"]).notNull(),
  /** Cron expression (6-field: sec min hr dom mon dow) — null for interval type */
  cronExpression: varchar("cronExpression", { length: 128 }),
  /** Interval in seconds — null for cron type */
  intervalSeconds: int("intervalSeconds"),
  /** Whether to repeat after execution */
  repeat: int("repeat").default(1).notNull(),
  /** Whether the schedule is active */
  enabled: int("enabled").default(1).notNull(),
  /** Last execution timestamp */
  lastRunAt: timestamp("lastRunAt"),
  /** Next scheduled execution timestamp */
  nextRunAt: timestamp("nextRunAt"),
  /** Total number of executions */
  runCount: int("runCount").default(0).notNull(),
  /** Last execution status */
  lastStatus: mysqlEnum("lastStatus", ["success", "error", "running"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = typeof scheduledTasks.$inferInsert;

// ── Projects (workspace concept — Capability #11) ──
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** Project name */
  name: varchar("name", { length: 500 }).notNull(),
  /** Project description / master instructions */
  description: text("description"),
  /** Project-level system prompt (applied to all tasks in this project) */
  systemPrompt: text("systemPrompt"),
  /** Project icon emoji or URL */
  icon: varchar("icon", { length: 128 }),
  /** Pinned to top of sidebar */
  pinned: int("pinned").default(0).notNull(),
  /** Sort order for manual reordering */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Archived flag */
  archived: int("archived").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ── Project Knowledge (files/instructions attached to a project) ──
export const projectKnowledge = mysqlTable("project_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  /** Knowledge type: instruction, file, note */
  type: mysqlEnum("type", ["instruction", "file", "note"]).default("note").notNull(),
  /** Title/label */
  title: varchar("title", { length: 500 }).notNull(),
  /** Content (text for instructions/notes, URL for files) */
  content: text("content").notNull(),
  /** File URL if type is file */
  fileUrl: text("fileUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectKnowledge = typeof projectKnowledge.$inferSelect;
export type InsertProjectKnowledge = typeof projectKnowledge.$inferInsert;

// ── Task Events (for session replay) ──
export const taskEvents = mysqlTable("task_events", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  /** Event type matching SSE event types */
  eventType: varchar("eventType", { length: 64 }).notNull(),
  /** JSON payload of the event */
  payload: text("payload").notNull(),
  /** Milliseconds since task start */
  offsetMs: int("offsetMs").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskEvent = typeof taskEvents.$inferSelect;
export type InsertTaskEvent = typeof taskEvents.$inferInsert;


// ── Skills (user-installed agent skills) ──
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillId: varchar("skillId", { length: 128 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }),
  version: varchar("version", { length: 32 }).default("1.0.0"),
  config: json("config").$type<Record<string, unknown>>(),
  enabled: boolean("enabled").default(true),
  installedAt: timestamp("installedAt").defaultNow().notNull(),
});
export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

// ── Slide Decks (AI-generated presentations) ──
export const slideDecks = mysqlTable("slide_decks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  prompt: text("prompt"),
  template: varchar("template", { length: 64 }).default("blank"),
  /** JSON array of slide objects: { title, content, notes } */
  slides: json("slides").$type<Array<{ title: string; content: string; notes?: string }>>(),
  /** S3 URL if exported */
  exportUrl: text("exportUrl"),
  status: mysqlEnum("status", ["generating", "ready", "error"]).default("generating"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SlideDeck = typeof slideDecks.$inferSelect;
export type InsertSlideDeck = typeof slideDecks.$inferInsert;

// ── Connectors (third-party integrations) ──
export const connectors = mysqlTable("connectors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectorId: varchar("connectorId", { length: 128 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  /** Encrypted config (API keys, tokens, webhook URLs) */
  config: json("config").$type<Record<string, string>>(),
  /** Authentication method: oauth, api_key, webhook, or manus_oauth (verified via Manus portal) */
  authMethod: mysqlEnum("authMethod", ["oauth", "api_key", "webhook", "manus_oauth"]).default("api_key"),
  /** Provider identity verified via Manus OAuth (e.g., github username, microsoft email) */
  manusVerifiedIdentity: varchar("manusVerifiedIdentity", { length: 256 }),
  /** OAuth access token (encrypted) */
  accessToken: text("accessToken"),
  /** OAuth refresh token (encrypted) */
  refreshToken: text("refreshToken"),
  /** OAuth token expiry timestamp */
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  /** OAuth scopes granted */
  oauthScopes: text("oauthScopes"),
  status: mysqlEnum("status", ["connected", "disconnected", "error"]).default("disconnected"),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Connector = typeof connectors.$inferSelect;
export type InsertConnector = typeof connectors.$inferInsert;

// ── Meeting Sessions (transcription + summary) ──
export const meetingSessions = mysqlTable("meeting_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskId: int("taskId"),
  title: varchar("title", { length: 512 }),
  /** S3 URL of the audio recording */
  audioUrl: text("audioUrl"),
  /** Full transcription text */
  transcript: text("transcript"),
  /** LLM-generated summary */
  summary: text("summary"),
  /** LLM-generated action items as JSON array */
  actionItems: json("actionItems").$type<string[]>(),
  duration: int("duration"),
  status: mysqlEnum("status", ["recording", "transcribing", "summarizing", "ready", "error"]).default("recording"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MeetingSession = typeof meetingSessions.$inferSelect;
export type InsertMeetingSession = typeof meetingSessions.$inferInsert;


// ── Teams (Capability #56/#57/#58 — real collaboration) ──
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  name: varchar("name", { length: 256 }).notNull(),
  ownerId: int("ownerId").notNull(),
  /** Invite code for joining the team */
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique().$defaultFn(() => nanoid(12)),
  /** Plan tier: free, pro, enterprise */
  plan: mysqlEnum("plan", ["free", "pro", "enterprise"]).default("free").notNull(),
  /** Shared credit pool balance */
  creditBalance: int("creditBalance").default(1000).notNull(),
  /** Max seats allowed */
  maxSeats: int("maxSeats").default(5).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ── Team Members (junction table) ──
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ── Team Sessions (shared collaborative sessions) ──
export const teamSessions = mysqlTable("team_sessions", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  taskExternalId: varchar("taskExternalId", { length: 64 }).notNull(),
  createdBy: int("createdBy").notNull(),
  /** Active participants count */
  activeParticipants: int("activeParticipants").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TeamSession = typeof teamSessions.$inferSelect;
export type InsertTeamSession = typeof teamSessions.$inferInsert;

// ── WebApp Builds (Capability #27/#28/#29 — real persistence + publishing) ──
export const webappBuilds = mysqlTable("webapp_builds", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** User's original prompt */
  prompt: text("prompt").notNull(),
  /** Generated HTML/code content */
  generatedHtml: text("generatedHtml"),
  /** Generated source code (full) */
  sourceCode: text("sourceCode"),
  /** S3 URL of published build */
  publishedUrl: text("publishedUrl"),
  /** S3 key for the published build */
  publishedKey: text("publishedKey"),
  /** Publish status */
  status: mysqlEnum("status", ["draft", "generating", "ready", "published", "error"]).default("draft").notNull(),
  /** App name/title */
  title: varchar("title", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WebappBuild = typeof webappBuilds.$inferSelect;
export type InsertWebappBuild = typeof webappBuilds.$inferInsert;

// ── Designs (Capability #15 — real canvas persistence) ──
export const designs = mysqlTable("designs", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** Design name */
  name: varchar("name", { length: 256 }).notNull(),
  /** Canvas state as JSON (layers, positions, etc.) */
  canvasState: json("canvasState").$type<{
    layers: Array<{
      id: string;
      type: "image" | "text";
      content: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fontSize?: number;
      color?: string;
    }>;
    width: number;
    height: number;
    background: string;
  }>(),
  /** Thumbnail URL (S3) */
  thumbnailUrl: text("thumbnailUrl"),
  /** Exported PNG URL (S3) */
  exportUrl: text("exportUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Design = typeof designs.$inferSelect;
export type InsertDesign = typeof designs.$inferInsert;

// ── Connected Devices (Capability #47 — My Computer / BYOD) ──
export const connectedDevices = mysqlTable("connected_devices", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** Human-readable device name */
  name: varchar("name", { length: 256 }).notNull(),
  /** Device type: desktop, android, ios, browser_only */
  deviceType: mysqlEnum("deviceType", ["desktop", "android", "ios", "browser_only"]).notNull(),
  /** Connection method determines the automation approach */
  connectionMethod: mysqlEnum("connectionMethod", [
    "electron_app",      // Approach A: Electron companion app (full desktop control)
    "cloudflare_vnc",    // Approach B: Cloudflare Tunnel + VNC (free desktop)
    "cdp_browser",       // Approach C: CDP browser-only (zero install)
    "adb_wireless",      // Approach D: ADB + accessibility tree (Android)
    "wda_rest",          // Approach D+: WebDriverAgent REST (iOS)
    "shortcuts_webhook",  // iOS Shortcuts + Pushcut (limited iOS)
  ]).notNull(),
  /** Tunnel/relay URL for reaching the device */
  tunnelUrl: text("tunnelUrl"),
  /** Pairing code for initial device handshake (6-char alphanumeric) */
  pairingCode: varchar("pairingCode", { length: 16 }),
  /** Whether the pairing has been completed */
  paired: int("paired").default(0).notNull(),
  /** Connection status */
  status: mysqlEnum("status", ["online", "offline", "pairing", "error"]).default("offline").notNull(),
  /** Last known OS info (e.g. "Windows 11", "Android 14", "macOS 15") */
  osInfo: varchar("osInfo", { length: 128 }),
  /** Device capabilities as JSON (has_gpu, screen_resolution, etc.) */
  capabilities: json("capabilities").$type<{
    hasGpu?: boolean;
    screenWidth?: number;
    screenHeight?: number;
    browserVersion?: string;
    adbVersion?: string;
    wdaInstalled?: boolean;
  }>(),
  /** Last successful connection timestamp */
  lastConnected: timestamp("lastConnected"),
  /** Error message if status is 'error' */
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ConnectedDevice = typeof connectedDevices.$inferSelect;
export type InsertConnectedDevice = typeof connectedDevices.$inferInsert;

// ── Device Sessions (Capability #47 — active control sessions) ──
export const deviceSessions = mysqlTable("device_sessions", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  deviceId: int("deviceId").notNull(),
  /** Session state */
  status: mysqlEnum("status", ["active", "paused", "ended", "error"]).default("active").notNull(),
  /** Number of commands executed in this session */
  commandCount: int("commandCount").default(0).notNull(),
  /** Number of screenshots captured */
  screenshotCount: int("screenshotCount").default(0).notNull(),
  /** Last screenshot URL (S3) */
  lastScreenshotUrl: text("lastScreenshotUrl"),
  /** Session metadata (current app, browser tab, etc.) */
  metadata: json("metadata").$type<{
    currentApp?: string;
    currentUrl?: string;
    accessibilityTreeSize?: number;
    lastAction?: string;
  }>(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});
export type DeviceSession = typeof deviceSessions.$inferSelect;
export type InsertDeviceSession = typeof deviceSessions.$inferInsert;

// ── Mobile Projects (Capability #43 — Mobile Development) ──
export const mobileProjects = mysqlTable("mobile_projects", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** Project name */
  name: varchar("name", { length: 256 }).notNull(),
  /** Target framework */
  framework: mysqlEnum("framework", ["pwa", "capacitor", "expo"]).notNull(),
  /** Target platforms */
  platforms: json("platforms").$type<Array<"ios" | "android" | "web">>().notNull(),
  /** App bundle identifier (e.g. com.example.myapp) */
  bundleId: varchar("bundleId", { length: 256 }),
  /** App display name */
  displayName: varchar("displayName", { length: 256 }),
  /** App version */
  version: varchar("version", { length: 32 }).default("1.0.0"),
  /** PWA manifest config as JSON */
  pwaManifest: json("pwaManifest").$type<{
    name?: string;
    short_name?: string;
    description?: string;
    start_url?: string;
    display?: "standalone" | "fullscreen" | "minimal-ui" | "browser";
    orientation?: "portrait" | "landscape" | "any";
    theme_color?: string;
    background_color?: string;
    icons?: Array<{ src: string; sizes: string; type: string }>;
  }>(),
  /** Capacitor config as JSON */
  capacitorConfig: json("capacitorConfig").$type<{
    appId?: string;
    appName?: string;
    webDir?: string;
    plugins?: Record<string, unknown>;
  }>(),
  /** Expo config as JSON */
  expoConfig: json("expoConfig").$type<{
    slug?: string;
    sdkVersion?: string;
    ios?: { bundleIdentifier?: string; buildNumber?: string };
    android?: { package?: string; versionCode?: number };
  }>(),
  /** Icon URL (S3) */
  iconUrl: text("iconUrl"),
  /** Splash screen URL (S3) */
  splashUrl: text("splashUrl"),
  /** Project status */
  status: mysqlEnum("status", ["draft", "configured", "building", "ready"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MobileProject = typeof mobileProjects.$inferSelect;
export type InsertMobileProject = typeof mobileProjects.$inferInsert;

// ── App Builds (Capability #42 — Mobile Publishing) ──
export const appBuilds = mysqlTable("app_builds", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  mobileProjectId: int("mobileProjectId").notNull(),
  /** Target platform for this build */
  platform: mysqlEnum("platform", ["ios", "android", "web_pwa"]).notNull(),
  /** Build method */
  buildMethod: mysqlEnum("buildMethod", [
    "pwa_manifest",       // Free: PWA install prompt
    "capacitor_local",    // Free: local Capacitor CLI build
    "github_actions",     // Free: GitHub Actions CI/CD
    "expo_eas",           // Paid: Expo EAS Build
    "manual_xcode",       // Paid: manual Xcode build
    "manual_android_studio", // Free: manual Android Studio build
  ]).notNull(),
  /** Build status */
  status: mysqlEnum("status", ["queued", "building", "success", "failed", "cancelled"]).default("queued").notNull(),
  /** Build artifact URL (S3 — APK, IPA, or PWA bundle) */
  artifactUrl: text("artifactUrl"),
  /** Build log output */
  buildLog: text("buildLog"),
  /** GitHub Actions workflow URL (if applicable) */
  workflowUrl: text("workflowUrl"),
  /** App store metadata as JSON */
  storeMetadata: json("storeMetadata").$type<{
    title?: string;
    shortDescription?: string;
    fullDescription?: string;
    category?: string;
    keywords?: string[];
    screenshotUrls?: string[];
    privacyPolicyUrl?: string;
    supportUrl?: string;
  }>(),
  /** Version being built */
  version: varchar("version", { length: 32 }),
  /** Build number (auto-incrementing per platform) */
  buildNumber: int("buildNumber").default(1),
  /** Error message if build failed */
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type AppBuild = typeof appBuilds.$inferSelect;
export type InsertAppBuild = typeof appBuilds.$inferInsert;


// ── Video Generation Projects (#62 — Veo3 parity) ──
export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  /** Text prompt for video generation */
  prompt: text("prompt").notNull(),
  /** Provider used: ffmpeg-slideshow | replicate-svd | veo3 */
  provider: varchar("provider", { length: 64 }).default("ffmpeg-slideshow").notNull(),
  /** Source images for slideshow / img2vid (S3 URLs as JSON array) */
  sourceImages: json("sourceImages").$type<string[]>(),
  /** Generated video S3 URL */
  videoUrl: text("videoUrl"),
  /** Thumbnail S3 URL */
  thumbnailUrl: text("thumbnailUrl"),
  /** Duration in seconds */
  duration: int("duration"),
  /** Resolution e.g. "1920x1080" */
  resolution: varchar("resolution", { length: 32 }).default("1280x720"),
  status: mysqlEnum("status", ["pending", "generating", "ready", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  /** Generation metadata (model params, seed, etc.) */
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type VideoProject = typeof videoProjects.$inferSelect;
export type InsertVideoProject = typeof videoProjects.$inferInsert;


// ── GitHub Repos (NS17 — GitHub Integration with Manus-style management) ──
export const githubRepos = mysqlTable("github_repos", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** GitHub connector ID (links to connectors table for auth) */
  connectorId: int("connectorId"),
  /** GitHub repo full name (owner/repo) */
  fullName: varchar("fullName", { length: 256 }).notNull(),
  /** Short repo name */
  name: varchar("name", { length: 128 }).notNull(),
  /** Repo description */
  description: text("description"),
  /** GitHub HTML URL */
  htmlUrl: text("htmlUrl").notNull(),
  /** Clone URL (https) */
  cloneUrl: text("cloneUrl"),
  /** SSH URL */
  sshUrl: text("sshUrl"),
  /** Default branch name */
  defaultBranch: varchar("defaultBranch", { length: 128 }).default("main"),
  /** Private repo flag */
  isPrivate: int("isPrivate").default(0).notNull(),
  /** Primary language */
  language: varchar("language", { length: 64 }),
  /** Star count */
  starCount: int("starCount").default(0),
  /** Fork count */
  forkCount: int("forkCount").default(0),
  /** Open issues count */
  openIssuesCount: int("openIssuesCount").default(0),
  /** Last push timestamp from GitHub */
  pushedAt: timestamp("pushedAt"),
  /** Last sync timestamp (when we fetched from GitHub API) */
  lastSyncAt: timestamp("lastSyncAt"),
  /** Connection status */
  status: mysqlEnum("status", ["connected", "syncing", "error", "disconnected"]).default("connected").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("github_repos_userId_idx").on(table.userId),
  fullNameIdx: index("github_repos_fullName_idx").on(table.fullName),
}));
export type GitHubRepo = typeof githubRepos.$inferSelect;
export type InsertGitHubRepo = typeof githubRepos.$inferInsert;

// ── Webapp Projects (NS17 — Manus-style management with GitHub, domains, env vars, deploy) ──
export const webappProjects = mysqlTable("webapp_projects", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** Project name */
  name: varchar("name", { length: 256 }).notNull(),
  /** Project description */
  description: text("description"),
  /** Framework: react, nextjs, vue, static, custom */
  framework: varchar("framework", { length: 64 }).default("react"),
  /** Linked GitHub repo ID (null = not connected) */
  githubRepoId: int("githubRepoId"),
  /** Linked webapp build ID (null = standalone project) */
  webappBuildId: int("webappBuildId"),
  /** Custom domain (e.g. myapp.manus.space or custom domain) */
  customDomain: varchar("customDomain", { length: 256 }),
  /** Auto-generated subdomain prefix */
  subdomainPrefix: varchar("subdomainPrefix", { length: 64 }),
  /** Environment variables as encrypted JSON */
  envVars: json("envVars").$type<Record<string, string>>(),
  /** Build command (e.g. "npm run build") */
  buildCommand: varchar("buildCommand", { length: 512 }).default("npm run build"),
  /** Output directory (e.g. "dist", "build", ".next") */
  outputDir: varchar("outputDir", { length: 256 }).default("dist"),
  /** Install command (e.g. "npm install") */
  installCommand: varchar("installCommand", { length: 512 }).default("npm install"),
  /** Node.js version */
  nodeVersion: varchar("nodeVersion", { length: 16 }).default("22"),
  /** Deploy target: manus (built-in), github_pages, vercel, netlify */
  deployTarget: mysqlEnum("deployTarget", ["manus", "github_pages", "vercel", "netlify"]).default("manus"),
  /** Published URL (live site) */
  publishedUrl: text("publishedUrl"),
  /** Last deploy status */
  deployStatus: mysqlEnum("deployStatus", ["idle", "building", "deploying", "live", "failed"]).default("idle").notNull(),
  /** Last deploy error */
  deployError: text("deployError"),
  /** Favicon URL (S3) */
  faviconUrl: text("faviconUrl"),
  /** Analytics: total page views */
  totalPageViews: bigint("totalPageViews", { mode: "number" }).default(0),
  /** Analytics: total unique visitors */
  totalUniqueVisitors: bigint("totalUniqueVisitors", { mode: "number" }).default(0),
  /** Visibility: public or private */
  visibility: mysqlEnum("visibility", ["public", "private"]).default("public"),
  /** SSL certificate ARN (ACM or simulated) */
  sslCertArn: varchar("sslCertArn", { length: 512 }),
  /** SSL certificate status */
  sslStatus: mysqlEnum("sslStatus", ["none", "pending_validation", "issued", "failed", "expired", "revoked"]).default("none"),
  /** DNS validation records as JSON */
  sslValidationRecords: json("sslValidationRecords").$type<Array<{ name: string; value: string; type: string }>>(),
  /** SEO: meta description */
  metaDescription: varchar("metaDescription", { length: 500 }),
  /** SEO: Open Graph image URL */
  ogImageUrl: text("ogImageUrl"),
  /** SEO: canonical URL override */
  canonicalUrl: text("canonicalUrl"),
  /** SEO: social media title (og:title) */
  ogTitle: varchar("ogTitle", { length: 256 }),
  /** SEO: keywords (comma-separated) */
  keywords: varchar("keywords", { length: 500 }),
  /** Last deployed at */
  lastDeployedAt: timestamp("lastDeployedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WebappProject = typeof webappProjects.$inferSelect;
export type InsertWebappProject = typeof webappProjects.$inferInsert;

// ── Webapp Deployments (version history / checkpoints) ──
export const webappDeployments = mysqlTable("webapp_deployments", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  /** Deployment version label (e.g. "v1.0.3" or checkpoint description) */
  versionLabel: varchar("versionLabel", { length: 256 }),
  /** Commit SHA from GitHub (if connected) */
  commitSha: varchar("commitSha", { length: 64 }),
  /** Commit message */
  commitMessage: text("commitMessage"),
  /** S3 URL of deployed bundle */
  bundleUrl: text("bundleUrl"),
  /** S3 key for the deployed bundle */
  bundleKey: text("bundleKey"),
  /** Deploy status */
  status: mysqlEnum("status", ["building", "deploying", "live", "rolled_back", "failed"]).default("building").notNull(),
  /** Build log output */
  buildLog: text("buildLog"),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  /** Unique preview URL for this specific deployment (allows comparing versions) */
  previewUrl: text("previewUrl"),
  /** Screenshot URL for preview */
  screenshotUrl: text("screenshotUrl"),
  /** Build duration in seconds */
  buildDurationSec: int("buildDurationSec"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type WebappDeployment = typeof webappDeployments.$inferSelect;
export type InsertWebappDeployment = typeof webappDeployments.$inferInsert;

// ── Page Views (analytics tracking for deployed apps) ──
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  /** Which deployed project this view belongs to */
  projectId: int("projectId").notNull(),
  /** Page path visited (e.g. "/", "/about", "/contact") */
  path: varchar("path", { length: 512 }).default("/").notNull(),
  /** HTTP referrer header */
  referrer: text("referrer"),
  /** User-Agent string (truncated to 512 chars) */
  userAgent: varchar("userAgent", { length: 512 }),
  /** Visitor IP hash (SHA-256 of IP + daily salt for privacy) */
  visitorHash: varchar("visitorHash", { length: 64 }),
  /** Country code from IP geolocation (if available) */
  country: varchar("country", { length: 8 }),
  /** Screen width for device type classification */
  screenWidth: int("screenWidth"),
  /** Timestamp of the page view */
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
});
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

// ── Task Templates (user-saved prompt templates for quick reuse) ──
export const taskTemplates = mysqlTable("task_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Template title shown in the UI */
  title: varchar("title", { length: 256 }).notNull(),
  /** The prompt text to pre-fill */
  prompt: text("prompt").notNull(),
  /** Icon identifier (lucide icon name) */
  icon: varchar("icon", { length: 64 }).default("Sparkles"),
  /** Category for grouping (e.g., "research", "writing", "coding") */
  category: varchar("category", { length: 64 }),
  /** Usage count for sorting by popularity */
  usageCount: int("usageCount").default(0).notNull(),
  /** Display order for manual sorting */
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = typeof taskTemplates.$inferInsert;

// ── Task Branches (conversation forking — tracks parent-child relationships between tasks) ──
export const taskBranches = mysqlTable("task_branches", {
  id: int("id").autoincrement().primaryKey(),
  /** The new (child) task that was branched off */
  childTaskId: int("childTaskId").notNull(),
  /** The original (parent) task that was branched from */
  parentTaskId: int("parentTaskId").notNull(),
  /** The message ID in the parent task where the branch was created */
  branchPointMessageId: int("branchPointMessageId").notNull(),
  /** Human-readable label for the branch */
  label: varchar("label", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TaskBranch = typeof taskBranches.$inferSelect;
export type InsertTaskBranch = typeof taskBranches.$inferInsert;

// ── Strategy Telemetry (agent self-correction tracking) ──
export const strategyTelemetry = mysqlTable("strategy_telemetry", {
  id: int("id").autoincrement().primaryKey(),
  taskExternalId: varchar("taskExternalId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  /** Which stuck detection iteration triggered this (1, 2, 3, 4) */
  stuckCount: int("stuckCount").notNull(),
  /** The self-correction strategy used: diagnose-redirect, force-action, last-chance, forced_final */
  strategyLabel: varchar("strategyLabel", { length: 64 }).notNull(),
  /** What the agent was doing when it got stuck (e.g., "research_loop", "tool_repeat", "empty_response") */
  triggerPattern: varchar("triggerPattern", { length: 128 }),
  /** Outcome of the intervention: resolved (unstuck), escalated (stuck again), forced_final (hit max) */
  outcome: mysqlEnum("outcome", ["resolved", "escalated", "forced_final", "pending"]).default("pending").notNull(),
  /** Number of agent turns before intervention */
  turnsBefore: int("turnsBefore"),
  /** Number of agent turns after intervention until resolution or next stuck */
  turnsAfter: int("turnsAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdx: index("strategy_telemetry_task_idx").on(table.taskExternalId),
  userIdx: index("strategy_telemetry_user_idx").on(table.userId),
}));

export type StrategyTelemetry = typeof strategyTelemetry.$inferSelect;
export type InsertStrategyTelemetry = typeof strategyTelemetry.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// AEGIS Layer — Pre/Post-Flight Pipeline, Quality Scoring, Semantic Cache
// ═══════════════════════════════════════════════════════════════════════

// ── AEGIS Sessions (one per LLM invocation through the pipeline) ──
export const aegisSessions = mysqlTable("aegis_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskExternalId: varchar("taskExternalId", { length: 64 }),
  /** Task classification from pre-flight */
  taskType: varchar("taskType", { length: 64 }).notNull(),
  complexity: varchar("complexity", { length: 32 }),
  /** Pre-flight: was the response served from cache? */
  cacheHit: int("cacheHit").default(0).notNull(),
  /** Cost in credits (estimated or actual) */
  costCredits: int("costCredits").default(0).notNull(),
  /** Latency in milliseconds */
  latencyMs: int("latencyMs").default(0).notNull(),
  /** Token counts */
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  /** Provider used (from routing decision) */
  provider: varchar("provider", { length: 64 }),
  /** Model used */
  model: varchar("model", { length: 128 }),
  /** Session status */
  status: mysqlEnum("status", ["pending", "completed", "failed", "cached"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("aegis_sessions_user_idx").on(table.userId),
  taskIdx: index("aegis_sessions_task_idx").on(table.taskExternalId),
}));
export type AegisSession = typeof aegisSessions.$inferSelect;
export type InsertAegisSession = typeof aegisSessions.$inferInsert;

// ── AEGIS Quality Scores (post-flight quality assessment) ──
export const aegisQualityScores = mysqlTable("aegis_quality_scores", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  completeness: int("completeness").notNull(),
  accuracy: int("accuracy").notNull(),
  relevance: int("relevance").notNull(),
  clarity: int("clarity").notNull(),
  efficiency: int("efficiency").notNull(),
  overallScore: int("overallScore").notNull(),
  validationPassed: int("validationPassed").default(1).notNull(),
  validationErrors: json("validationErrors").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AegisQualityScore = typeof aegisQualityScores.$inferSelect;
export type InsertAegisQualityScore = typeof aegisQualityScores.$inferInsert;

// ── AEGIS Semantic Cache (prompt → response cache with TTL) ──
export const aegisCache = mysqlTable("aegis_cache", {
  id: int("id").autoincrement().primaryKey(),
  /** SHA-256 hash of normalized prompt */
  promptHash: varchar("promptHash", { length: 64 }).notNull().unique(),
  /** The original prompt (for debugging/inspection) */
  prompt: text("prompt").notNull(),
  /** Cached response */
  response: text("response").notNull(),
  /** Task type classification */
  taskType: varchar("taskType", { length: 64 }),
  /** Number of cache hits */
  hitCount: int("hitCount").default(0).notNull(),
  /** Cost saved per hit (in credits) */
  costSavedPerHit: int("costSavedPerHit").default(0).notNull(),
  /** TTL expiration */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastHitAt: timestamp("lastHitAt"),
}, (table) => ({
  hashIdx: index("aegis_cache_hash_idx").on(table.promptHash),
}));
export type AegisCache = typeof aegisCache.$inferSelect;
export type InsertAegisCache = typeof aegisCache.$inferInsert;

// ── AEGIS Fragments (reusable output fragments for context assembly) ──
export const aegisFragments = mysqlTable("aegis_fragments", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId"),
  fragmentType: varchar("fragmentType", { length: 64 }).notNull(),
  content: text("content").notNull(),
  contentHash: varchar("contentHash", { length: 64 }).notNull(),
  /** Which task types this fragment is relevant for */
  taskTypes: json("taskTypes").$type<string[]>(),
  /** Quality score of the source output */
  qualityScore: int("qualityScore"),
  /** Number of times this fragment was used in context assembly */
  useCount: int("useCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AegisFragment = typeof aegisFragments.$inferSelect;
export type InsertAegisFragment = typeof aegisFragments.$inferInsert;

// ── AEGIS Lessons (extracted insights from completed sessions) ──
export const aegisLessons = mysqlTable("aegis_lessons", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId"),
  lessonType: varchar("lessonType", { length: 64 }).notNull(),
  taskType: varchar("taskType", { length: 64 }).notNull(),
  description: text("description").notNull(),
  /** Impact level: low, medium, high */
  impact: varchar("impact", { length: 16 }).default("medium").notNull(),
  /** Whether this lesson has been applied to improve patterns */
  applied: int("applied").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AegisLesson = typeof aegisLessons.$inferSelect;
export type InsertAegisLesson = typeof aegisLessons.$inferInsert;

// ── AEGIS Patterns (discovered optimization patterns) ──
export const aegisPatterns = mysqlTable("aegis_patterns", {
  id: int("id").autoincrement().primaryKey(),
  patternType: mysqlEnum("patternType", ["prompt", "decomposition", "quality", "anti_pattern", "cost", "caching"]).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description").notNull(),
  /** Pattern content (e.g., optimized prompt template, decomposition strategy) */
  content: text("content"),
  /** Task types this pattern applies to */
  taskTypes: json("taskTypes").$type<string[]>(),
  /** Effectiveness score (0-100) */
  effectiveness: int("effectiveness").default(50).notNull(),
  /** Number of times this pattern was applied */
  applyCount: int("applyCount").default(0).notNull(),
  /** Whether this pattern is active */
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AegisPattern = typeof aegisPatterns.$inferSelect;
export type InsertAegisPattern = typeof aegisPatterns.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// ATLAS Layer — Goal Decomposition, Planning, Execution, Budgets
// ═══════════════════════════════════════════════════════════════════════

// ── ATLAS Goals (top-level objectives that get decomposed) ──
export const atlasGoals = mysqlTable("atlas_goals", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  taskExternalId: varchar("taskExternalId", { length: 64 }),
  /** Goal description */
  description: text("description").notNull(),
  /** Decomposition strategy used */
  strategy: varchar("strategy", { length: 64 }),
  /** Goal status */
  status: mysqlEnum("status", ["pending", "planning", "executing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  /** Progress percentage (0-100) */
  progress: int("progress").default(0).notNull(),
  /** Total cost in credits */
  totalCost: int("totalCost").default(0).notNull(),
  /** Average quality score across sub-tasks */
  avgQuality: int("avgQuality"),
  /** Budget limits */
  maxSteps: int("maxSteps").default(20),
  maxCostCredits: int("maxCostCredits").default(1000),
  maxDurationMs: bigint("maxDurationMs", { mode: "number" }).default(300000),
  /** Reflection/retrospective notes */
  reflection: text("reflection"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdx: index("atlas_goals_user_idx").on(table.userId),
  taskIdx: index("atlas_goals_task_idx").on(table.taskExternalId),
}));
export type AtlasGoal = typeof atlasGoals.$inferSelect;
export type InsertAtlasGoal = typeof atlasGoals.$inferInsert;

// ── ATLAS Plans (DAG of tasks for a goal) ──
export const atlasPlans = mysqlTable("atlas_plans", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  /** Plan as JSON DAG: { nodes: [{id, taskId, dependsOn: []}], edges: [] } */
  dag: json("dag").$type<{
    nodes: Array<{ id: string; taskId: number; dependsOn: string[] }>;
  }>().notNull(),
  /** Plan status */
  status: mysqlEnum("status", ["draft", "active", "completed", "failed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AtlasPlan = typeof atlasPlans.$inferSelect;
export type InsertAtlasPlan = typeof atlasPlans.$inferInsert;

// ── ATLAS Goal Tasks (individual sub-tasks within a goal) ──
export const atlasGoalTasks = mysqlTable("atlas_goal_tasks", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  planId: int("planId"),
  /** Task description */
  description: text("description").notNull(),
  /** Task type (from AEGIS classification) */
  taskType: varchar("taskType", { length: 64 }),
  /** Execution order within the plan */
  executionOrder: int("executionOrder").default(0).notNull(),
  /** Dependencies (IDs of other goal_tasks that must complete first) */
  dependsOn: json("dependsOn").$type<number[]>(),
  /** Task status */
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "skipped"]).default("pending").notNull(),
  /** LLM output */
  output: text("output"),
  /** Cost in credits */
  costCredits: int("costCredits").default(0),
  /** Quality score */
  qualityScore: int("qualityScore"),
  /** Provider used */
  provider: varchar("provider", { length: 64 }),
  /** AEGIS session ID (links to aegis_sessions) */
  aegisSessionId: int("aegisSessionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  goalIdx: index("atlas_goal_tasks_goal_idx").on(table.goalId),
}));
export type AtlasGoalTask = typeof atlasGoalTasks.$inferSelect;
export type InsertAtlasGoalTask = typeof atlasGoalTasks.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// Sovereign Layer — Multi-Provider Routing, Circuit Breakers, Guardrails
// ═══════════════════════════════════════════════════════════════════════

// ── Sovereign Providers (registered LLM providers) ──
export const sovereignProviders = mysqlTable("sovereign_providers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  /** Provider type: openai, anthropic, google, local, custom */
  providerType: varchar("providerType", { length: 64 }).notNull(),
  /** Base URL for API calls */
  baseUrl: text("baseUrl"),
  /** Model identifier */
  model: varchar("model", { length: 128 }).notNull(),
  /** Cost per 1K input tokens (in millicredits) */
  costPer1kInput: int("costPer1kInput").default(10).notNull(),
  /** Cost per 1K output tokens (in millicredits) */
  costPer1kOutput: int("costPer1kOutput").default(30).notNull(),
  /** Max context window tokens */
  maxContextTokens: int("maxContextTokens").default(128000),
  /** Capabilities as JSON array */
  capabilities: json("capabilities").$type<string[]>(),
  /** Whether this provider is active */
  isActive: int("isActive").default(1).notNull(),
  /** Circuit breaker state */
  circuitState: mysqlEnum("circuitState", ["closed", "open", "half_open"]).default("closed").notNull(),
  /** Consecutive failure count */
  consecutiveFailures: int("consecutiveFailures").default(0).notNull(),
  /** When the circuit was last opened */
  circuitOpenedAt: timestamp("circuitOpenedAt"),
  /** Historical success rate (0-100) */
  successRate: int("successRate").default(100).notNull(),
  /** Average latency in ms */
  avgLatencyMs: int("avgLatencyMs").default(1000),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SovereignProvider = typeof sovereignProviders.$inferSelect;
export type InsertSovereignProvider = typeof sovereignProviders.$inferInsert;

// ── Sovereign Routing Decisions (audit trail of routing choices) ──
export const sovereignRoutingDecisions = mysqlTable("sovereign_routing_decisions", {
  id: int("id").autoincrement().primaryKey(),
  aegisSessionId: int("aegisSessionId"),
  /** Task type that was routed */
  taskType: varchar("taskType", { length: 64 }).notNull(),
  /** Routing strategy used */
  strategy: mysqlEnum("strategy", ["cheapest_viable", "balanced", "quality_maximized"]).default("balanced").notNull(),
  /** Provider chosen */
  chosenProvider: varchar("chosenProvider", { length: 128 }).notNull(),
  /** Score that won the routing */
  chosenScore: int("chosenScore"),
  /** All candidates considered as JSON */
  candidates: json("candidates").$type<Array<{ provider: string; score: number; reason: string }>>(),
  /** Whether the routing was successful */
  success: int("success").default(1).notNull(),
  /** Fallback used? */
  fallbackUsed: int("fallbackUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SovereignRoutingDecision = typeof sovereignRoutingDecisions.$inferSelect;
export type InsertSovereignRoutingDecision = typeof sovereignRoutingDecisions.$inferInsert;

// ── Sovereign Provider Usage Logs (per-request metrics) ──
export const sovereignUsageLogs = mysqlTable("sovereign_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(),
  aegisSessionId: int("aegisSessionId"),
  /** Input tokens consumed */
  inputTokens: int("inputTokens").default(0).notNull(),
  /** Output tokens produced */
  outputTokens: int("outputTokens").default(0).notNull(),
  /** Cost in millicredits */
  costMillicredits: int("costMillicredits").default(0).notNull(),
  /** Latency in ms */
  latencyMs: int("latencyMs").default(0).notNull(),
  /** Whether the request succeeded */
  success: int("success").default(1).notNull(),
  /** Error message if failed */
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  providerIdx: index("sovereign_usage_provider_idx").on(table.providerId),
}));
export type SovereignUsageLog = typeof sovereignUsageLogs.$inferSelect;
export type InsertSovereignUsageLog = typeof sovereignUsageLogs.$inferInsert;

// ── App Feedback (B8: Support/feedback — general app feedback, feature requests, bug reports) ──
export const appFeedback = mysqlTable("app_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Feedback category: general, feature_request, bug_report, praise */
  category: mysqlEnum("category", ["general", "feature_request", "bug_report", "praise"]).default("general").notNull(),
  /** Short summary */
  title: varchar("title", { length: 500 }).notNull(),
  /** Detailed feedback text */
  content: text("content"),
  /** Current page/route when feedback was submitted */
  pageContext: varchar("pageContext", { length: 500 }),
  /** User agent string for bug reports */
  userAgent: text("userAgent"),
  /** Status for admin tracking */
  status: mysqlEnum("status", ["new", "acknowledged", "in_progress", "resolved", "wont_fix"]).default("new").notNull(),
  /** Admin response */
  adminResponse: text("adminResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("app_feedback_userId_idx").on(table.userId),
  statusIdx: index("app_feedback_status_idx").on(table.status),
}));
export type AppFeedback = typeof appFeedback.$inferSelect;
export type InsertAppFeedback = typeof appFeedback.$inferInsert;

// ── Connector Health (auto-refresh, token lifecycle, health monitoring) ──
export const connectorHealth = mysqlTable("connector_health", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Matches connectorId from connectors table (e.g., "github", "google-drive") */
  connectorId: varchar("connectorId", { length: 128 }).notNull(),
  /** Whether auto-refresh is enabled for this connector (only meaningful for OAuth with refresh_token) */
  autoRefreshEnabled: boolean("autoRefreshEnabled").default(false).notNull(),
  /** Last successful token refresh timestamp */
  lastRefreshAt: timestamp("lastRefreshAt"),
  /** Last successful sync/API call timestamp */
  lastSyncAt: timestamp("lastSyncAt"),
  /** Next scheduled refresh attempt (computed from token expiry minus buffer) */
  nextRefreshAt: timestamp("nextRefreshAt"),
  /** Number of consecutive refresh failures */
  refreshFailCount: int("refreshFailCount").default(0).notNull(),
  /** Last refresh failure reason */
  lastRefreshError: text("lastRefreshError"),
  /** Health status: healthy, expiring_soon, expired, refresh_failed, no_token */
  healthStatus: mysqlEnum("healthStatus", ["healthy", "expiring_soon", "expired", "refresh_failed", "no_token"]).default("no_token").notNull(),
  /** Auth method category for display: oauth, pat, api_key, manus_oauth, webhook */
  authMethodCategory: varchar("authMethodCategory", { length: 32 }),
  /** Whether this connector's auth method supports auto-refresh */
  supportsAutoRefresh: boolean("supportsAutoRefresh").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userConnectorIdx: index("connector_health_user_connector_idx").on(table.userId, table.connectorId),
}));
export type ConnectorHealth = typeof connectorHealth.$inferSelect;
export type InsertConnectorHealth = typeof connectorHealth.$inferInsert;

// ── Connector Health Logs (audit trail of refresh attempts) ──
export const connectorHealthLogs = mysqlTable("connector_health_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectorId: varchar("connectorId", { length: 128 }).notNull(),
  /** Event type: refresh_success, refresh_failed, auto_refresh_enabled, auto_refresh_disabled, manual_refresh, token_expired */
  eventType: mysqlEnum("eventType", [
    "refresh_success", "refresh_failed", "auto_refresh_enabled",
    "auto_refresh_disabled", "manual_refresh", "token_expired",
    "connected", "disconnected"
  ]).notNull(),
  /** Optional details (error message, new expiry, etc.) */
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userConnectorIdx: index("health_logs_user_connector_idx").on(table.userId, table.connectorId),
}));
export type ConnectorHealthLog = typeof connectorHealthLogs.$inferSelect;
export type InsertConnectorHealthLog = typeof connectorHealthLogs.$inferInsert;

// ── Automation Schedules (Pass 39) ──
export const automationSchedules = mysqlTable("automation_schedules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  mode: varchar("mode", { length: 50 }).notNull().default("schedule"),
  triggerType: varchar("triggerType", { length: 50 }).notNull().default("cron"),
  cronExpression: varchar("cronExpression", { length: 100 }),
  intervalSeconds: int("intervalSeconds"),
  workflowDefinition: json("workflowDefinition").$type<Record<string, unknown>>(),
  status: mysqlEnum("status", ["active", "paused", "completed", "failed"]).default("active").notNull(),
  lastRunAt: bigint("lastRunAt", { mode: "number" }),
  nextRunAt: bigint("nextRunAt", { mode: "number" }),
  runCount: int("runCount").default(0).notNull(),
  lastRunResult: json("lastRunResult").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("automation_schedules_userId_idx").on(table.userId),
  statusIdx: index("automation_schedules_status_idx").on(table.status),
}));
export type AutomationSchedule = typeof automationSchedules.$inferSelect;
export type InsertAutomationSchedule = typeof automationSchedules.$inferInsert;


// ── Pass 44: Data Pipelines ──
export const dataPipelines = mysqlTable("data_pipelines", {
  id: int("id").primaryKey().autoincrement(),
  externalId: varchar("externalId", { length: 36 }).notNull().unique(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  pipelineType: varchar("pipelineType", { length: 50 }).notNull().default("etl"),
  sourceConfig: json("sourceConfig").$type<Record<string, unknown>>(),
  transformSteps: json("transformSteps").$type<Array<{ name: string; type: string; config: Record<string, unknown> }>>(),
  destinationConfig: json("destinationConfig").$type<Record<string, unknown>>(),
  schedule: varchar("schedule", { length: 100 }),
  accessTier: varchar("accessTier", { length: 50 }).notNull().default("internal"),
  qualityScore: int("qualityScore"),
  status: mysqlEnum("status", ["draft", "active", "paused", "error", "archived"]).default("draft").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  runCount: int("runCount").default(0),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("data_pipelines_user_idx").on(table.userId),
}));
export type DataPipeline = typeof dataPipelines.$inferSelect;
export type InsertDataPipeline = typeof dataPipelines.$inferInsert;

// ── Pass 44: Data Pipeline Runs ──
export const dataPipelineRuns = mysqlTable("data_pipeline_runs", {
  id: int("id").primaryKey().autoincrement(),
  pipelineId: int("pipelineId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed", "cancelled"]).default("running").notNull(),
  recordsProcessed: int("recordsProcessed").default(0),
  recordsFailed: int("recordsFailed").default(0),
  durationMs: int("durationMs"),
  errorMessage: text("errorMessage"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  pipelineIdIdx: index("data_pipeline_runs_pipeline_idx").on(table.pipelineId),
}));
export type DataPipelineRun = typeof dataPipelineRuns.$inferSelect;
export type InsertDataPipelineRun = typeof dataPipelineRuns.$inferInsert;

// ── Pass 44: Memory Embeddings ──
export const memoryEmbeddings = mysqlTable("memory_embeddings", {
  id: int("id").primaryKey().autoincrement(),
  memoryEntryId: int("memoryEntryId").notNull(),
  userId: int("userId").notNull(),
  embeddedText: text("embeddedText").notNull(),
  embedding: json("embedding").$type<number[]>().notNull(),
  model: varchar("model", { length: 100 }).notNull().default("text-embedding-3-small"),
  dimensions: int("dimensions").notNull().default(1536),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  memoryIdx: index("memory_embeddings_memory_idx").on(table.memoryEntryId),
  userIdx: index("memory_embeddings_user_idx").on(table.userId),
}));
export type MemoryEmbedding = typeof memoryEmbeddings.$inferSelect;
export type InsertMemoryEmbedding = typeof memoryEmbeddings.$inferInsert;

// ── Pass 44: Schedule Execution History ──
export const scheduleExecutionHistory = mysqlTable("schedule_execution_history", {
  id: int("id").primaryKey().autoincrement(),
  scheduleId: int("scheduleId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed", "cancelled"]).default("running").notNull(),
  output: text("output"),
  errorMessage: text("errorMessage"),
  durationMs: int("durationMs"),
  triggerType: varchar("triggerType", { length: 50 }).notNull().default("scheduled"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  scheduleIdx: index("schedule_execution_history_schedule_idx").on(table.scheduleId),
  userIdx: index("schedule_execution_history_user_idx").on(table.userId),
}));
export type ScheduleExecutionHistoryRow = typeof scheduleExecutionHistory.$inferSelect;
export type InsertScheduleExecutionHistory = typeof scheduleExecutionHistory.$inferInsert;

// ── Per-Message Feedback (thumbs up/down on individual assistant responses) ──
export const messageFeedback = mysqlTable("message_feedback", {
  id: int("id").primaryKey().autoincrement(),
  taskExternalId: varchar("taskExternalId", { length: 64 }).notNull(),
  messageIndex: int("messageIndex").notNull(),
  userId: int("userId").notNull(),
  feedback: mysqlEnum("feedback", ["up", "down"]).notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  taskMsgIdx: index("message_feedback_task_msg_idx").on(table.taskExternalId, table.messageIndex),
  userIdx: index("message_feedback_user_idx").on(table.userId),
}));
export type MessageFeedbackRow = typeof messageFeedback.$inferSelect;
export type InsertMessageFeedback = typeof messageFeedback.$inferInsert;


// ── Personalization Preferences (user preference learning + adaptive UI) ──
export const personalizationPreferences = mysqlTable("personalization_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Preference category: interface, workflow, communication, content, accessibility */
  category: varchar("category", { length: 64 }).notNull(),
  /** Short label for the preference (e.g., "Dark Mode", "Compact View") */
  label: varchar("label", { length: 256 }).notNull(),
  /** Preference value (0.0 to 1.0 scale for sliders, or boolean-like 0/1) */
  value: int("value").default(50).notNull(),
  /** Confidence score (0-100): how certain the system is about this preference */
  confidence: int("confidence").default(50).notNull(),
  /** Source: explicit (user set it), inferred (system learned it), default */
  source: mysqlEnum("source", ["explicit", "inferred", "default"]).default("default").notNull(),
  /** Whether this preference is active */
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userCategoryIdx: index("personalization_prefs_user_category_idx").on(table.userId, table.category),
}));
export type PersonalizationPreference = typeof personalizationPreferences.$inferSelect;
export type InsertPersonalizationPreference = typeof personalizationPreferences.$inferInsert;

// ── Personalization Rules (adaptive behavior rules) ──
export const personalizationRules = mysqlTable("personalization_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Rule name (e.g., "Auto-expand code blocks") */
  name: varchar("name", { length: 256 }).notNull(),
  /** Rule condition as human-readable description */
  condition: text("condition").notNull(),
  /** Rule action as human-readable description */
  action: text("action").notNull(),
  /** Whether this rule is active */
  active: int("active").default(1).notNull(),
  /** Impact level: low, medium, high */
  impact: varchar("impact", { length: 16 }).default("medium").notNull(),
  /** Number of times this rule has been triggered */
  triggeredCount: int("triggeredCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("personalization_rules_user_idx").on(table.userId),
}));
export type PersonalizationRule = typeof personalizationRules.$inferSelect;
export type InsertPersonalizationRule = typeof personalizationRules.$inferInsert;

// ── Personalization Learning Log (interaction pattern tracking) ──
export const personalizationLearningLog = mysqlTable("personalization_learning_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Event type: preference_learned, pattern_detected, adaptation_applied, feedback_received */
  eventType: mysqlEnum("eventType", ["preference_learned", "pattern_detected", "adaptation_applied", "feedback_received"]).notNull(),
  /** Human-readable description of what was learned */
  description: text("description").notNull(),
  /** Confidence of the learning (0-100) */
  confidence: int("confidence").default(50).notNull(),
  /** Related preference ID (if applicable) */
  preferenceId: int("preferenceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("personalization_learning_user_idx").on(table.userId),
}));
export type PersonalizationLearningLogEntry = typeof personalizationLearningLog.$inferSelect;
export type InsertPersonalizationLearningLogEntry = typeof personalizationLearningLog.$inferInsert;

// ── Process Metrics (optimization tracking) ──
export const processMetrics = mysqlTable("process_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Metric name (e.g., "Task Completion Rate", "Average Response Time") */
  name: varchar("name", { length: 256 }).notNull(),
  /** Current value */
  currentValue: int("currentValue").default(0).notNull(),
  /** Previous period value (for trend calculation) */
  previousValue: int("previousValue").default(0).notNull(),
  /** Target value */
  targetValue: int("targetValue").default(100).notNull(),
  /** Unit of measurement (%, ms, count, score) */
  unit: varchar("unit", { length: 32 }).default("%").notNull(),
  /** Category: performance, quality, efficiency, user_satisfaction */
  category: varchar("category", { length: 64 }).default("performance").notNull(),
  /** Historical values as JSON array of {timestamp, value} */
  history: json("history").$type<Array<{ timestamp: string; value: number }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("process_metrics_user_idx").on(table.userId),
}));
export type ProcessMetric = typeof processMetrics.$inferSelect;
export type InsertProcessMetric = typeof processMetrics.$inferInsert;

// ── Improvement Initiatives (process improvement projects) ──
export const improvementInitiatives = mysqlTable("improvement_initiatives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Initiative title */
  title: varchar("title", { length: 256 }).notNull(),
  /** Detailed description */
  description: text("description"),
  /** Status: proposed, in_progress, completed, on_hold */
  status: mysqlEnum("status", ["proposed", "in_progress", "completed", "on_hold"]).default("proposed").notNull(),
  /** Impact score (0-100) */
  impactScore: int("impactScore").default(50).notNull(),
  /** Owner/responsible person */
  owner: varchar("owner", { length: 128 }),
  /** Linked metric IDs as JSON array */
  linkedMetricIds: json("linkedMetricIds").$type<number[]>(),
  /** Start date */
  startDate: timestamp("startDate"),
  /** Target completion date */
  targetDate: timestamp("targetDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("improvement_initiatives_user_idx").on(table.userId),
  statusIdx: index("improvement_initiatives_status_idx").on(table.status),
}));
export type ImprovementInitiative = typeof improvementInitiatives.$inferSelect;
export type InsertImprovementInitiative = typeof improvementInitiatives.$inferInsert;

// ── Optimization Cycles (iterative improvement tracking) ──
export const optimizationCycles = mysqlTable("optimization_cycles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Cycle number (sequential per user) */
  cycleNumber: int("cycleNumber").notNull(),
  /** Current phase: assess, optimize, validate */
  phase: mysqlEnum("phase", ["assess", "optimize", "validate"]).default("assess").notNull(),
  /** Status: active, completed */
  status: mysqlEnum("status", ["active", "completed"]).default("active").notNull(),
  /** Findings from the assessment phase as JSON array */
  findings: json("findings").$type<string[]>(),
  /** Improvements applied during optimization as JSON array */
  improvements: json("improvements").$type<string[]>(),
  /** Validation results as JSON */
  validationResults: json("validationResults").$type<{ passed: number; failed: number; notes: string[] }>(),
  /** Start date of this cycle */
  startDate: timestamp("startDate").defaultNow().notNull(),
  /** Completion date */
  completedDate: timestamp("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("optimization_cycles_user_idx").on(table.userId),
}));
export type OptimizationCycle = typeof optimizationCycles.$inferSelect;
export type InsertOptimizationCycle = typeof optimizationCycles.$inferInsert;


// ── Orchestration Runs (multi-agent execution history) ──
export const orchestrationRuns = mysqlTable("orchestration_runs", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique external ID for client reference */
  externalId: varchar("externalId", { length: 64 }).notNull().unique().$defaultFn(() => nanoid()),
  userId: int("userId").notNull(),
  /** The task that triggered this orchestration (optional) */
  taskExternalId: varchar("taskExternalId", { length: 64 }),
  /** The high-level goal that was decomposed */
  goal: text("goal").notNull(),
  /** Additional context provided to the supervisor */
  context: text("context"),
  /** Status of the orchestration run */
  status: mysqlEnum("status", ["planning", "executing", "completed", "failed", "cancelled"]).default("planning").notNull(),
  /** Number of agents spawned */
  agentCount: int("agentCount").default(0).notNull(),
  /** Number of tasks decomposed */
  taskCount: int("taskCount").default(0).notNull(),
  /** Number of tasks completed successfully */
  completedCount: int("completedCount").default(0).notNull(),
  /** Number of tasks that failed */
  failedCount: int("failedCount").default(0).notNull(),
  /** Average quality score across all completed tasks (0-1) */
  avgQuality: int("avgQuality").default(0).notNull(), // stored as integer 0-100
  /** Full orchestration plan as JSON (agents, tasks, dependencies) */
  plan: json("plan"),
  /** Individual task results as JSON array */
  taskResults: json("taskResults"),
  /** Final synthesized result text */
  finalResult: text("finalResult"),
  /** Execution duration in milliseconds */
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("orchestration_runs_user_idx").on(table.userId),
  taskIdx: index("orchestration_runs_task_idx").on(table.taskExternalId),
  statusIdx: index("orchestration_runs_status_idx").on(table.status),
}));
export type OrchestrationRun = typeof orchestrationRuns.$inferSelect;
export type InsertOrchestrationRun = typeof orchestrationRuns.$inferInsert;

// ─────────────────────────────────────────────────────────────────────────────
// Stewardly v3 integration schema additions (ported from stewardly-ai)
// Tables already exist in TiDB (created by Stewardly _additive migrations).
// These exports are required by server/services/{snapTrade,plaidTokenStore}.ts
// and server/routers/plaid.ts so the typed Drizzle queries compile.
// ─────────────────────────────────────────────────────────────────────────────
export const integrationProviders = mysqlTable("integration_providers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", [
    "crm", "messaging", "carrier", "investments", "insurance",
    "demographics", "economic", "enrichment", "regulatory", "property", "middleware",
    "marketing", "recruiting", "government"
  ]).notNull(),
  ownershipTier: mysqlEnum("ownership_tier", ["platform", "organization", "professional", "client"]).notNull(),
  authMethod: mysqlEnum("auth_method", [
    "oauth2", "api_key", "bearer_token", "hmac_webhook", "manual_upload", "none"
  ]).notNull(),
  baseUrl: varchar("base_url", { length: 500 }),
  docsUrl: varchar("docs_url", { length: 500 }),
  signupUrl: varchar("signup_url", { length: 500 }),
  freeTierDescription: text("free_tier_description"),
  freeTierLimit: varchar("free_tier_limit", { length: 200 }),
  logoUrl: varchar("logo_url", { length: 500 }),
  isActive: mysqlBoolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type IntegrationProvider = typeof integrationProviders.$inferSelect;

// ─── INTEGRATION CONNECTIONS (Configured connections per owner) ───────────
export const integrationConnections = mysqlTable("integration_connections", {
  id: varchar("id", { length: 36 }).primaryKey(),
  providerId: varchar("provider_id", { length: 36 }).notNull(),
  ownershipTier: mysqlEnum("ownership_tier", ["platform", "organization", "professional", "client"]).notNull(),
  ownerId: varchar("owner_id", { length: 36 }).notNull(),
  organizationId: int("organization_id"),
  userId: int("user_id"),
  status: mysqlEnum("status", ["connected", "disconnected", "error", "pending", "expired"]).default("pending"),
  credentialsEncrypted: text("credentials_encrypted"),
  configJson: json("config_json"),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: mysqlEnum("last_sync_status", ["success", "partial", "failed"]),
  lastSyncError: text("last_sync_error"),
  recordsSynced: int("records_synced").default(0),
  usageThisPeriod: int("usage_this_period").default(0),
  usagePeriodStart: timestamp("usage_period_start"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    providerIdIdx: index("idx_integration_connections_provider_id").on(table.providerId),
    ownerIdIdx: index("idx_integration_connections_owner_id").on(table.ownerId),
    organizationIdIdx: index("idx_integration_connections_organization_id").on(table.organizationId),
    userIdIdx: index("idx_integration_connections_user_id").on(table.userId),
  }));
export type IntegrationConnection = typeof integrationConnections.$inferSelect;

// ─── INTEGRATION SYNC LOGS (Audit trail of sync operations) ──────────────
export const integrationSyncLogs = mysqlTable("integration_sync_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  connectionId: varchar("connection_id", { length: 36 }).notNull(),
  syncType: mysqlEnum("sync_type", ["full", "incremental", "webhook", "manual_upload", "on_demand"]).notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound", "bidirectional"]).notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  status: mysqlEnum("status", ["running", "success", "partial", "failed", "cancelled"]).notNull(),
  recordsCreated: int("records_created").default(0),
  recordsUpdated: int("records_updated").default(0),
  recordsFailed: int("records_failed").default(0),
  errorDetails: json("error_details"),
  triggeredBy: mysqlEnum("triggered_by", ["schedule", "webhook", "manual", "system"]).notNull(),
  triggeredByUserId: int("triggered_by_user_id"),
}, (table) => ({
    connectionIdIdx: index("idx_integration_sync_logs_connection_id").on(table.connectionId),
    triggeredByUserIdIdx: index("idx_integration_sync_logs_triggered_by_user_id").on(table.triggeredByUserId),
  }));
export type IntegrationSyncLog = typeof integrationSyncLogs.$inferSelect;

// ─── INTEGRATION FIELD MAPPINGS ──────────────────────────────────────────
export const integrationFieldMappings = mysqlTable("integration_field_mappings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  connectionId: varchar("connection_id", { length: 36 }).notNull(),
  externalField: varchar("external_field", { length: 200 }).notNull(),
  internalTable: varchar("internal_table", { length: 100 }).notNull(),
  internalField: varchar("internal_field", { length: 200 }).notNull(),
  transform: mysqlEnum("transform", [
    "direct", "lowercase", "uppercase", "date_parse", "phone_e164",
    "currency_cents", "boolean_parse", "custom"
  ]).default("direct"),
  customTransform: text("custom_transform"),
  isActive: mysqlBoolean("is_active").default(true),
}, (table) => ({
    connectionIdIdx: index("idx_integration_field_mappings_connection_id").on(table.connectionId),
  }));
export type IntegrationFieldMapping = typeof integrationFieldMappings.$inferSelect;

// ─── INTEGRATION WEBHOOK EVENTS (Raw inbound webhook log) ────────────────
export const integrationWebhookEvents = mysqlTable("integration_webhook_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  connectionId: varchar("connection_id", { length: 36 }).notNull(),
  providerSlug: varchar("provider_slug", { length: 50 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payloadJson: json("payload_json").notNull(),
  signatureValid: mysqlBoolean("signature_valid").notNull(),
  processedAt: timestamp("processed_at"),
  processingStatus: mysqlEnum("processing_status", ["pending", "processed", "failed", "skipped"]).default("pending"),
  processingError: text("processing_error"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
}, (table) => ({
    connectionIdIdx: index("idx_integration_webhook_events_connection_id").on(table.connectionId),
  }));
export type IntegrationWebhookEvent = typeof integrationWebhookEvents.$inferSelect;

// ─── ENRICHMENT CACHE (Cached enrichment lookups) ────────────────────────
export const enrichmentCache = mysqlTable("enrichment_cache", {
  id: varchar("id", { length: 36 }).primaryKey(),
  providerSlug: varchar("provider_slug", { length: 50 }).notNull(),
  lookupKey: varchar("lookup_key", { length: 500 }).notNull(),
  lookupType: varchar("lookup_type", { length: 50 }).notNull(),
  resultJson: json("result_json").notNull(),
  qualityScore: decimal("quality_score", { precision: 3, scale: 2 }),
  fetchedAt: timestamp("fetched_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  hitCount: int("hit_count").default(1),
  connectionId: varchar("connection_id", { length: 36 }),
}, (table) => ({
    connectionIdIdx: index("idx_enrichment_cache_connection_id").on(table.connectionId),
  }));
export type EnrichmentCacheEntry = typeof enrichmentCache.$inferSelect;

// ─── CARRIER IMPORT TEMPLATES (Parsing templates for manual uploads) ─────
export const carrierImportTemplates = mysqlTable("carrier_import_templates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  carrierSlug: varchar("carrier_slug", { length: 50 }).notNull(),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  columnMappings: json("column_mappings").notNull(),
  parserType: mysqlEnum("parser_type", ["csv", "pdf_table", "pdf_ocr", "excel"]).notNull(),
  sampleHeaders: json("sample_headers"),
  isSystem: mysqlBoolean("is_system").default(false),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const snapTradeUsers = mysqlTable("snaptrade_users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("user_id").notNull(),
  snapTradeUserId: varchar("snaptrade_user_id", { length: 200 }).notNull(),
  snapTradeUserSecretEncrypted: text("snaptrade_user_secret_encrypted").notNull(),
  status: mysqlEnum("status", ["active", "disabled", "deleted"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    userIdIdx: index("idx_snaptrade_users_user_id").on(table.userId),
    snapTradeUserIdIdx: index("idx_snaptrade_users_snap_trade_user_id").on(table.snapTradeUserId),
  }));
export type SnapTradeUser = typeof snapTradeUsers.$inferSelect;

// ─── SNAPTRADE BROKERAGE CONNECTIONS (Per-user brokerage links) ──────────
export const snapTradeBrokerageConnections = mysqlTable("snaptrade_brokerage_connections", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("user_id").notNull(),
  snapTradeUserId: varchar("snaptrade_user_id", { length: 36 }).notNull(),
  brokerageAuthorizationId: varchar("brokerage_authorization_id", { length: 200 }).notNull(),
  brokerageName: varchar("brokerage_name", { length: 200 }),
  brokerageType: varchar("brokerage_type", { length: 100 }),
  status: mysqlEnum("status", ["active", "disabled", "error", "deleted"]).default("active").notNull(),
  disabledReason: text("disabled_reason"),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: mysqlEnum("last_sync_status", ["success", "partial", "failed"]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    userIdIdx: index("idx_snaptrade_brokerage_connections_user_id").on(table.userId),
    snapTradeUserIdIdx: index("idx_snaptrade_brokerage_connections_snap_trade_user_id").on(table.snapTradeUserId),
    brokerageAuthorizationIdIdx: index("idx_snaptrade_brokerage_connections_brokerage_authorization_id").on(table.brokerageAuthorizationId),
  }));
export type SnapTradeBrokerageConnection = typeof snapTradeBrokerageConnections.$inferSelect;

// ─── SNAPTRADE ACCOUNTS (Brokerage accounts discovered per connection) ───
export const snapTradeAccounts = mysqlTable("snaptrade_accounts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("user_id").notNull(),
  connectionId: varchar("connection_id", { length: 36 }).notNull(),
  snapTradeAccountId: varchar("snaptrade_account_id", { length: 200 }).notNull(),
  accountName: varchar("account_name", { length: 200 }),
  accountNumber: varchar("account_number", { length: 100 }),
  accountType: varchar("account_type", { length: 100 }),
  institutionName: varchar("institution_name", { length: 200 }),
  cashBalance: decimal("cash_balance", { precision: 18, scale: 4 }),
  marketValue: decimal("market_value", { precision: 18, scale: 4 }),
  totalValue: decimal("total_value", { precision: 18, scale: 4 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  lastSyncAt: timestamp("last_sync_at"),
  syncDataJson: json("sync_data_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    userIdIdx: index("idx_snaptrade_accounts_user_id").on(table.userId),
    connectionIdIdx: index("idx_snaptrade_accounts_connection_id").on(table.connectionId),
    snapTradeAccountIdIdx: index("idx_snaptrade_accounts_snap_trade_account_id").on(table.snapTradeAccountId),
  }));
export type SnapTradeAccount = typeof snapTradeAccounts.$inferSelect;

// ─── SNAPTRADE POSITIONS (Holdings per account) ──────────────────────────
export const snapTradePositions = mysqlTable("snaptrade_positions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("user_id").notNull(),
  accountId: varchar("account_id", { length: 36 }).notNull(),
  symbolTicker: varchar("symbol_ticker", { length: 20 }),
  symbolName: varchar("symbol_name", { length: 300 }),
  symbolType: varchar("symbol_type", { length: 50 }),
  units: decimal("units", { precision: 18, scale: 8 }),
  averagePrice: decimal("average_price", { precision: 18, scale: 4 }),
  currentPrice: decimal("current_price", { precision: 18, scale: 4 }),
  marketValue: decimal("market_value", { precision: 18, scale: 4 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  rawJson: json("raw_json"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    userIdIdx: index("idx_snaptrade_positions_user_id").on(table.userId),
    accountIdIdx: index("idx_snaptrade_positions_account_id").on(table.accountId),
  }));
export type SnapTradePosition = typeof snapTradePositions.$inferSelect;


// ─── PROFESSIONAL VERIFICATIONS ─────────────────────────────────────────
// DB table: professional_verifications
export const professionalVerifications = mysqlTable("professional_verifications", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professional_id").notNull(),
  verificationSource: mysqlEnum("verification_source", [
    "finra_brokercheck", "sec_iapd", "cfp_board", "nasba_cpaverify",
    "nipr_pdb", "nmls", "state_bar", "ibba", "martindale", "avvo"
  ]).notNull(),
  verificationStatus: mysqlEnum("verification_status", [
    "verified", "not_found", "flagged", "expired", "pending"
  ]).notNull(),
  externalId: varchar("external_id", { length: 100 }),
  externalUrl: varchar("external_url", { length: 500 }),
  rawData: json("raw_data"),
  disclosures: json("disclosures"),
  licenseStates: json("license_states"),
  licenseExpiration: timestamp("license_expiration"),
  verifiedAt: bigint("verified_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }),
  verificationMethod: mysqlEnum("verification_method", [
    "api", "scrape", "manual", "n8n_workflow"
  ]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    professionalIdIdx: index("idx_professional_verifications_professional_id").on(table.professionalId),
    externalIdIdx: index("idx_professional_verifications_external_id").on(table.externalId),
  }));
export type ProfessionalVerification = typeof professionalVerifications.$inferSelect;
export type InsertProfessionalVerification = typeof professionalVerifications.$inferInsert;

// ─── COI VERIFICATION BADGES ────────────────────────────────────────────
// DB table: coi_verification_badges
export const coiVerificationBadges = mysqlTable("coi_verification_badges", {
  id: int("id").autoincrement().primaryKey(),
  coiContactId: int("coi_contact_id"),
  professionalId: int("professional_id"),
  badgeType: mysqlEnum("badge_type", [
    "license_active", "cfp_certified", "cpa_active", "bar_good_standing",
    "nmls_authorized", "nipr_licensed", "cbi_certified", "no_disclosures",
    "fiduciary", "am_best_rated", "peer_rated"
  ]).notNull(),
  badgeLabel: varchar("badge_label", { length: 100 }),
  badgeData: json("badge_data"),
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  sourceVerificationId: int("source_verification_id"),
  grantedAt: bigint("granted_at", { mode: "number" }).notNull(),
  expiresAt: bigint("expires_at", { mode: "number" }),
  active: mysqlBoolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    coiContactIdIdx: index("idx_coi_verification_badges_coi_contact_id").on(table.coiContactId),
    professionalIdIdx: index("idx_coi_verification_badges_professional_id").on(table.professionalId),
    sourceVerificationIdIdx: index("idx_coi_verification_badges_source_verification_id").on(table.sourceVerificationId),
  }));
export type CoiVerificationBadge = typeof coiVerificationBadges.$inferSelect;
export type InsertCoiVerificationBadge = typeof coiVerificationBadges.$inferInsert;

// ─── VERIFICATION SCHEDULES ─────────────────────────────────────────────
// DB table: verification_schedules
export const verificationSchedules = mysqlTable("verification_schedules", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professional_id").notNull(),
  verificationSource: mysqlEnum("verification_source", [
    "finra_brokercheck", "sec_iapd", "cfp_board", "nasba_cpaverify",
    "nipr_pdb", "nmls", "state_bar", "ibba", "martindale", "avvo"
  ]).notNull(),
  frequencyDays: int("frequency_days").notNull().default(30),
  lastRunAt: bigint("last_run_at", { mode: "number" }),
  nextRunAt: bigint("next_run_at", { mode: "number" }).notNull(),
  enabled: mysqlBoolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    professionalIdIdx: index("idx_verification_schedules_professional_id").on(table.professionalId),
  }));
export type VerificationSchedule = typeof verificationSchedules.$inferSelect;
export type InsertVerificationSchedule = typeof verificationSchedules.$inferInsert;

// ─── PREMIUM FINANCE RATES ──────────────────────────────────────────────
// DB table: premium_finance_rates
export const premiumFinanceRates = mysqlTable("premium_finance_rates", {
  id: int("id").autoincrement().primaryKey(),
  rateDate: date("rate_date").notNull(),
  sofr: decimal("sofr", { precision: 6, scale: 4 }),
  sofr30: decimal("sofr_30", { precision: 6, scale: 4 }),
  sofr90: decimal("sofr_90", { precision: 6, scale: 4 }),
  treasury10y: decimal("treasury_10y", { precision: 6, scale: 4 }),
  treasury30y: decimal("treasury_30y", { precision: 6, scale: 4 }),
  primeRate: decimal("prime_rate", { precision: 6, scale: 4 }),
  fetchedAt: bigint("fetched_at", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type PremiumFinanceRate = typeof premiumFinanceRates.$inferSelect;
export type InsertPremiumFinanceRate = typeof premiumFinanceRates.$inferInsert;

// ============================================================
// DATA SEEDING & PRODUCT INTELLIGENCE TABLES (Prompt 2)
// ============================================================

// --- Phase 1: Tax & Government Data Seeds ---

export const taxParameters = mysqlTable("tax_parameters", {
  id: int("id").autoincrement().primaryKey(),
  taxYear: int("tax_year").notNull(),
  parameterName: varchar("parameter_name", { length: 100 }).notNull(),
  parameterCategory: varchar("parameter_category", { length: 50 }).notNull(),
  filingStatus: varchar("filing_status", { length: 50 }).default("all"),
  valueJson: json("value_json").notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  effectiveDate: varchar("effective_date", { length: 20 }).notNull(),
  expiryDate: varchar("expiry_date", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type TaxParameter = typeof taxParameters.$inferSelect;
export type InsertTaxParameter = typeof taxParameters.$inferInsert;

export const ssaParameters = mysqlTable("ssa_parameters", {
  id: int("id").autoincrement().primaryKey(),
  parameterYear: int("parameter_year").notNull(),
  parameterName: varchar("parameter_name", { length: 100 }).notNull(),
  valueJson: json("value_json").notNull(),
  sourceUrl: varchar("source_url", { length: 500 }),
  effectiveDate: varchar("effective_date", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type SsaParameter = typeof ssaParameters.$inferSelect;
export type InsertSsaParameter = typeof ssaParameters.$inferInsert;

export const ssaLifeTables = mysqlTable("ssa_life_tables", {
  id: int("id").autoincrement().primaryKey(),
  age: int("age").notNull(),
  sex: varchar("sex", { length: 10 }).notNull(),
  probabilityOfDeath: varchar("probability_of_death", { length: 20 }).notNull(),
  lifeExpectancy: varchar("life_expectancy", { length: 10 }).notNull(),
  tableYear: int("table_year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plaidItems = mysqlTable("plaid_items", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  itemId: varchar("item_id", { length: 255 }).notNull(),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  institutionId: varchar("institution_id", { length: 100 }),
  institutionName: varchar("institution_name", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  consentExpiresAt: bigint("consent_expires_at", { mode: "number" }),
  lastSyncedAt: bigint("last_synced_at", { mode: "number" }),
  errorCode: varchar("error_code", { length: 100 }),
  errorMessage: text("error_message"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
}, (table) => ({
  userIdIdx: index("idx_plaid_items_user_id").on(table.userId),
  itemIdIdx: index("idx_plaid_items_item_id").on(table.itemId),
}));
export type PlaidItem = typeof plaidItems.$inferSelect;
export type InsertPlaidItem = typeof plaidItems.$inferInsert;




// ─────────────────────────────────────────────────────────────────────────────
// Stewardly 5-Layer Architecture (declarations match live DB shape exactly).
// L1 Platform (global_admin) — base prompt, model defaults, global guardrails
// L2 Organization (org_admin) — brand voice, compliance, prompt overlay
// L3 Manager (manager) — team focus, reporting requirements
// L4 Professional (professional) — specialization, methodology, per-client
// L5 User (user) — personal style, format, goals (extends `userPreferences`)
// Cascade: prompt APPEND, tone OVERRIDE, guardrails UNION, approved INTERSECT.
// ─────────────────────────────────────────────────────────────────────────────

export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull(),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  ein: varchar("ein", { length: 20 }),
  industry: varchar("industry", { length: 128 }),
  size: mysqlEnum("size", ["solo", "small", "medium", "large", "enterprise"]),
  // L1 white-label columns (camelCase to match live DB).
  logoUrl: varchar("logoUrl", { length: 500 }),
  customDomain: varchar("customDomain", { length: 256 }),
  themeColor: varchar("themeColor", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export const userOrganizationRoles = mysqlTable("user_organization_roles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  organizationId: int("organizationId").notNull(),
  globalRole: mysqlEnum("globalRole", ["global_admin", "user"]).default("user"),
  organizationRole: mysqlEnum("organizationRole", ["org_admin", "manager", "professional", "user"]).default("user"),
  managerId: int("managerId"),
  professionalId: int("professionalId"),
  status: mysqlEnum("status", ["active", "inactive", "invited", "pending_approval"]),
  invitedAt: timestamp("invitedAt"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserOrganizationRole = typeof userOrganizationRoles.$inferSelect;
export type InsertUserOrganizationRole = typeof userOrganizationRoles.$inferInsert;

// L1 — Platform AI Settings (singleton, edited only by global_admin).
export const platformAiSettings = mysqlTable("platform_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 64 }).notNull(),
  baseSystemPrompt: text("baseSystemPrompt"),
  defaultTone: varchar("defaultTone", { length: 64 }),
  defaultResponseFormat: varchar("defaultResponseFormat", { length: 64 }),
  defaultResponseLength: varchar("defaultResponseLength", { length: 64 }),
  modelPreferences: json("modelPreferences"),
  ensembleWeights: json("ensembleWeights"),
  globalGuardrails: json("globalGuardrails"),
  prohibitedTopics: json("prohibitedTopics"),
  maxTokensDefault: int("maxTokensDefault"),
  temperatureDefault: float("temperatureDefault"),
  enabledFocusModes: json("enabledFocusModes"),
  platformDisclaimer: text("platformDisclaimer"),
  defaultTtsVoice: varchar("defaultTtsVoice", { length: 64 }),
  defaultSpeechRate: float("defaultSpeechRate"),
  defaultAutoPlayVoice: boolean("defaultAutoPlayVoice"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlatformAiSetting = typeof platformAiSettings.$inferSelect;
export type InsertPlatformAiSetting = typeof platformAiSettings.$inferInsert;

// L2 — Organization AI Settings (per-org, edited by org_admin).
export const organizationAiSettings = mysqlTable("organization_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull(),
  organizationName: varchar("organizationName", { length: 256 }).notNull(),
  brandVoice: text("brandVoice"),
  approvedProductCategories: json("approvedProductCategories"),
  prohibitedTopics: json("prohibitedTopics"),
  complianceLanguage: text("complianceLanguage"),
  customDisclaimers: text("customDisclaimers"),
  promptOverlay: text("promptOverlay"),
  toneStyle: varchar("toneStyle", { length: 64 }),
  responseFormat: varchar("responseFormat", { length: 64 }),
  responseLength: varchar("responseLength", { length: 64 }),
  modelPreferences: json("modelPreferences"),
  ensembleWeights: json("ensembleWeights"),
  temperature: float("temperature"),
  maxTokens: int("maxTokens"),
  enabledFocusModes: json("enabledFocusModes"),
  defaultTtsVoice: varchar("defaultTtsVoice", { length: 64 }),
  defaultSpeechRate: float("defaultSpeechRate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OrganizationAiSetting = typeof organizationAiSettings.$inferSelect;

// L3 — Manager AI Settings.
export const managerAiSettings = mysqlTable("manager_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(),
  organizationId: int("organizationId"),
  teamFocusAreas: json("teamFocusAreas"),
  clientSegmentTargeting: text("clientSegmentTargeting"),
  reportingRequirements: json("reportingRequirements"),
  promptOverlay: text("promptOverlay"),
  toneStyle: varchar("toneStyle", { length: 64 }),
  responseFormat: varchar("responseFormat", { length: 64 }),
  responseLength: varchar("responseLength", { length: 64 }),
  modelPreferences: json("modelPreferences"),
  ensembleWeights: json("ensembleWeights"),
  temperature: float("temperature"),
  maxTokens: int("maxTokens"),
  defaultTtsVoice: varchar("defaultTtsVoice", { length: 64 }),
  defaultSpeechRate: float("defaultSpeechRate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ManagerAiSetting = typeof managerAiSettings.$inferSelect;

// L4 — Professional AI Settings.
export const professionalAiSettings = mysqlTable("professional_ai_settings", {
  id: int("id").autoincrement().primaryKey(),
  professionalId: int("professionalId").notNull(),
  organizationId: int("organizationId"),
  managerId: int("managerId"),
  specialization: varchar("specialization", { length: 256 }),
  methodology: text("methodology"),
  communicationStyle: text("communicationStyle"),
  perClientOverrides: json("perClientOverrides"),
  promptOverlay: text("promptOverlay"),
  toneStyle: varchar("toneStyle", { length: 64 }),
  responseFormat: varchar("responseFormat", { length: 64 }),
  responseLength: varchar("responseLength", { length: 64 }),
  modelPreferences: json("modelPreferences"),
  ensembleWeights: json("ensembleWeights"),
  temperature: float("temperature"),
  maxTokens: int("maxTokens"),
  defaultTtsVoice: varchar("defaultTtsVoice", { length: 64 }),
  defaultSpeechRate: float("defaultSpeechRate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProfessionalAiSetting = typeof professionalAiSettings.$inferSelect;


// ─────────────────────────────────────────────────────────────────────────────
// L1 Platform API keys — issued by global_admin only. Used for partner
// integrations (read-only by default). Stored as the SHA-256 hash of the
// secret so the plaintext is never persisted; the plaintext is shown to the
// caller of `admin.issueApiKey` once and never again.
// ─────────────────────────────────────────────────────────────────────────────

export const platformApiKeys = mysqlTable("platform_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  /** Public, human-readable prefix (e.g. "swly_live_xxxx"). Safe to display. */
  keyPrefix: varchar("keyPrefix", { length: 32 }).notNull().unique(),
  /** SHA-256 hex of the full secret. */
  keyHash: varchar("keyHash", { length: 128 }).notNull(),
  /** Optional human label, e.g. "Acme integration". */
  label: varchar("label", { length: 256 }),
  /** Comma-separated scope vocabulary: read:engines, read:economic-data, ... */
  scopes: text("scopes"),
  /** Numeric id of the global_admin that issued this key. */
  issuedByUserId: int("issuedByUserId").notNull(),
  /** Optional expiry. NULL = no expiry. */
  expiresAt: timestamp("expiresAt"),
  /** When the key was last used to authenticate; NULL = never. */
  lastUsedAt: timestamp("lastUsedAt"),
  /** Soft-revoke timestamp; non-null means the key no longer authenticates. */
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlatformApiKey = typeof platformApiKeys.$inferSelect;
export type InsertPlatformApiKey = typeof platformApiKeys.$inferInsert;


// === Auto-appended re-exports from schema-ai.ts ===
// These tables/types come from the canonical stewardly-ai schema port.
// To remove: edit drizzle/schema-ai.ts directly.
// Generated 393 missing names.

export {
  accessPolicies,
  adImpressionLog,
  adPlacements,
  advisoryExecutions,
  affiliatedResources,
  agentActions,
  agentAutonomyLevels,
  agentInstances,
  agentPerformance,
  agentTemplates,
  aiConfigLayers,
  aiResponseQuality,
  aiToolCalls,
  aiToolExecutions,
  aiTools,
  analyticalModels,
  annualReviews,
  assessmentSessions,
  audioScripts,
  audioStudyProgress,
  auditTrail,
  authEnrichmentLog,
  authProviderTokens,
  benchmarkAggregates,
  benchmarkComparisons,
  beneficiaryReviews,
  billingEvents,
  browserSessions,
  bulkImportBatches,
  businessExitPlans,
} from "./schema-ai";

export {
  businessPlans,
  cadenceComplianceAudit,
  cadenceEnrollments,
  cadenceOptOutRegistry,
  cadenceTouchLog,
  calculatorResultCache,
  calculatorScenarios,
  capabilityModes,
  cardReviews,
  cardSchedules,
  carrierConnections,
  carrierSubmissions,
  ceCredits,
  chapterPrerequisites,
  clientAssociations,
  clientDiscovery,
  clientGoals,
  clientPlanOutcomes,
  clientSegments,
  coaActuals,
  coaCampaigns,
  coachingMessages,
  coiContacts,
  coiDisclosures,
  commsLog,
  communicationArchive,
  communityPosts,
  communityReplies,
  compensationBrackets,
  complianceAudit,
} from "./schema-ai";

export {
  complianceAuditSamples,
  complianceFlags,
  compliancePredictions,
  compliancePrescreening,
  complianceReviews,
  complianceRules,
  complianceWeeklyBriefs,
  consentTracking,
  constitutionalViolations,
  consultationBookings,
  contentArticles,
  contentShares,
  contextAssemblyLog,
  conversationComplianceScores,
  conversationFolders,
  conversationTopics,
  conversations,
  creditProfiles,
  crmSyncLog,
  dataAccessAudit,
  dataAuthorizations,
  dataFreshnessRegistry,
  dataQualityScores,
  dataSources,
  dataValueScores,
  delegations,
  deploymentChecks,
  deploymentHistory,
  digitalAssetInventory,
  disclaimerAudit,
} from "./schema-ai";

export {
  disclaimerInteractions,
  disclaimerTranslations,
  disclaimerVersions,
  documentAnnotations,
  documentChunks,
  documentExtractions,
  documentTagMap,
  documentTags,
  documentTemplates,
  documentVersions,
  documents,
  dripifyWebhookEvents,
  economicHistory,
  educationModules,
  educationProgress,
  educationTriggers,
  emailCampaigns,
  emailSends,
  embedConfigurations,
  encryptedFieldsRegistry,
  encryptionKeys,
  engagementLetters,
  engagementScores,
  enrichmentCohorts,
  enrichmentDatasets,
  enrichmentMatches,
  entityResolutionRules,
  equityGrants,
  escalationHistory,
  esignatureTracking,
} from "./schema-ai";

export {
  estateDocuments,
  exchangeAnalyses,
  exportJobs,
  extractionPlanJobs,
  extractionPlans,
  fairnessTestPrompts,
  fairnessTestResults,
  fairnessTestRuns,
  featureFlags,
  featurePermissions,
  feedback,
  fieldSharingControls,
  fileChunks,
  fileDerivedEnrichments,
  fileUploads,
  financialProfiles,
  financialProtectionScores,
  gateReviews,
  generatedDocuments,
  ghlLocations,
  glossaryTerms,
  healthScores,
  hnwNarrativeScores,
  hypothesisTestResults,
  importFieldMappings,
  importJobs,
  improvementActions,
  improvementFeedback,
  improvementHypotheses,
  improvementSignals,
} from "./schema-ai";

export {
  industryBenchmarks,
  ingestedRecords,
  ingestionInsights,
  ingestionJobs,
  insightActions,
  insuranceApplications,
  insuranceCarriers,
  insuranceProducts,
  insuranceQuotes,
  integrationAnalysisLog,
  integrationBlueprintRuns,
  integrationBlueprintSamples,
  integrationBlueprintVersions,
  integrationBlueprints,
  integrationHealthChecks,
  integrationHealthSummary,
  integrationImprovementLog,
  integrationOptimizationCycles,
  integrationSyncConfig,
  iulCreditingHistory,
  kbAccessTransitions,
  kbSharingDefaults,
  kbSharingPermissions,
  kgEdges,
  kgNodes,
  knowledgeArticleFeedback,
  knowledgeArticleVersions,
  knowledgeArticles,
  knowledgeGapFeedback,
  knowledgeGaps,
} from "./schema-ai";

export {
  knowledgeGraphEdges,
  knowledgeGraphEntities,
  knowledgeIngestionJobs,
  layerAudits,
  layerMetrics,
  leadCaptureConfig,
  leadPipeline,
  leadProfileAccumulator,
  leadSourcePerformance,
  leadSources,
  learningAchievements,
  learningAiQuizQuestions,
  learningBookmarks,
  learningCases,
  learningCeCredits,
  learningChallengeResults,
  learningChapters,
  learningConnections,
  learningContentHistory,
  learningContentVersions,
  learningDefinitions,
  learningDisciplines,
  learningDiscoveryHistory,
  learningFlashcards,
  learningFormulas,
  learningFsApplications,
  learningGroupActivity,
  learningGroupGoals,
  learningGroupMembers,
  learningGroupNotes,
} from "./schema-ai";

export {
  learningLicenses,
  learningMasteryProgress,
  learningPendingInvites,
  learningPlaylistItems,
  learningPlaylistShares,
  learningPlaylists,
  learningPracticeQuestions,
  learningQuizChallenges,
  learningRegulatoryUpdates,
  learningSettings,
  learningSharedQuizzes,
  learningStreaks,
  learningStudyGroups,
  learningStudySessions,
  learningSubsections,
  learningTracks,
  loadTestResults,
  locationAlertThresholds,
  ltcAnalyses,
  managerAISettings,
  marketDataCache,
  marketDataSubscriptions,
  marketEvents,
  marketIndexHistory,
  meddpiccScores,
  medicareParameters,
  meetingActionItems,
  meetings,
  memories,
  memoryEpisodes,
} from "./schema-ai";

export {
  messages,
  mfaBackupCodes,
  mfaSecrets,
  modelBacktests,
  modelCards,
  modelOutputRecords,
  modelRuns,
  modelScenarios,
  modelSchedules,
  nitrogenRiskProfiles,
  notificationLog,
  officeHourRegistrations,
  officeHours,
  onboardingProgress,
  orgAiConfig,
  orgPromptCustomizations,
  orgRetentionPolicies,
  organizationAISettings,
  organizationLandingPageConfig,
  organizationRelationships,
  paperTrades,
  passiveActionLog,
  passiveActionPreferences,
  patternTransitionAssessments,
  peerGroupMembers,
  peerGroupMessages,
  peerGroups,
  performanceMetrics,
  permissionAuditLog,
  personalFinancialReviews,
} from "./schema-ai";

export {
  pfmImports,
  pfrDocuments,
  plaidHoldings,
  plaidWebhookLog,
  plaidWebhooksLog,
  planActualInsights,
  planAdherence,
  planningAssumptions,
  planningNodes,
  planningReferences,
  planningSnapshots,
  platformAISettings,
  platformChangelog,
  platformKv,
  platformLearnings,
  policyDeliveries,
  portalEngagement,
  practiceMetrics,
  predictiveTriggers,
  premiumFinanceCases,
  privacyAudit,
  privacyConsentLog,
  proactiveEscalationRules,
  proactiveInsights,
  probeResults,
  productSuitabilityEvaluations,
  productionActuals,
  products,
  professionalAISettings,
  professionalAvailability,
} from "./schema-ai";

export {
  professionalContext,
  professionalDocuments,
  professionalRelationships,
  professionalReviews,
  professionals,
  promptExperimentResults,
  promptExperiments,
  promptGoldenTests,
  promptInteractions,
  promptRegressionRuns,
  promptVariants,
  propagationActions,
  propagationEvents,
  propensityBiasAudits,
  propensityFeatures,
  propensityModels,
  propensityScores,
  providerHealthChecks,
  qualityRatings,
  rateProfiles,
  rateRecommendations,
  rateSignalLog,
  reasoningTraces,
  recommendationsLog,
  reconciliationLog,
  recruitDimensionScores,
  referralTracking,
  referrals,
  regulatoryAlerts,
  regulatoryImpactAnalyses,
} from "./schema-ai";

export {
  regulatoryUpdates,
  reportJobs,
  reportSnapshots,
  reportTemplates,
  responseRatings,
  retentionActionsLog,
  reviewQueue,
  richMediaEmbeds,
  roleElevations,
  savedAnalyses,
  scrapeSchedules,
  scrapingAudit,
  scrapingCache,
  searchCache,
  selfDiscoveryHistory,
  serverErrors,
  sharedAssumptions,
  sharedLinks,
  smsitSyncLog,
  studentLoans,
  studyProgress,
  suitabilityAssessments,
  suitabilityChangeEvents,
  suitabilityDimensions,
  suitabilityHouseholdLinks,
  suitabilityProfiles,
  suitabilityQuestionsQueue,
  syncEventMetrics,
  syncRunHistory,
  systemHealthEvents,
} from "./schema-ai";

export {
  taxReturnReviews,
  templateOptimizationResults,
  transactionCategories,
  underwritingTracking,
  usageBudgets,
  usageTracking,
  userAiBoundaries,
  userAudioOverrides,
  userAudioPreferences,
  userAutonomyProfiles,
  userCapabilities,
  userChangelogAwareness,
  userConsents,
  userFeatureProficiency,
  userGuardrails,
  userInsightsCache,
  userLocations,
  userMemories,
  userPlatformEvents,
  userProfiles,
  userRelationships,
  videoStreamingSessions,
  viewAsAuditLog,
  viewShares,
  wealthHubAllocations,
  webScrapeResults,
  weightPresets,
  workflowChecklist,
  workflowCheckpoints,
  workflowEventChains,
} from "./schema-ai";

export {
  workflowExecutionLog,
  workflowInstances,
  zipCodeDemographics,
} from "./schema-ai";



/* ========================================================================
 * User-Installable Apps (additive, v3-native)
 *
 * Three tables back the Apps drawer's three add-flows:
 *   1. "Create new app"        → userApps (the catalog of apps a user owns)
 *   2. "Browse public catalog" → userApps where visibility='public' + appInstalls
 *   3. "Install from share link" → appShareLinks → appInstalls
 *
 * Apps are decoupled from the canonical 5 Core engines (formational,
 * relational, missional, contextual, continuous-improvement). Core engines
 * are bundled into the platform; userApps are user-created or community-
 * installed extensions that show up in the Apps drawer "Installed" group.
 * ======================================================================== */

export const userApps = mysqlTable(
  "user_apps",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Slug used in URLs (/apps/:slug). Unique across the platform. */
    slug: varchar("slug", { length: 96 }).notNull().unique(),
    /** Owner of the app (user.id). */
    ownerUserId: int("owner_user_id").notNull(),
    /** Display name shown in the Apps drawer + catalog. */
    name: varchar("name", { length: 200 }).notNull(),
    /** Short description shown in catalog cards. */
    description: text("description"),
    /** Optional emoji or icon URL shown in the Apps drawer entry. */
    icon: varchar("icon", { length: 256 }),
    /** Visibility: private (owner only), unlisted (link-only), public (catalog). */
    visibility: mysqlEnum("visibility_user_apps", ["private", "unlisted", "public"]).default("private").notNull(),
    /** Free-form JSON config blob (UI layout, embedded prompt, tool refs). */
    config: json("config"),
    /** Number of times this app has been installed by other users. */
    installCount: int("install_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index("user_apps_owner_idx").on(t.ownerUserId),
    visibilityIdx: index("user_apps_visibility_idx").on(t.visibility),
  }),
);

export type UserApp = typeof userApps.$inferSelect;
export type InsertUserApp = typeof userApps.$inferInsert;

export const appInstalls = mysqlTable(
  "app_installs",
  {
    id: int("id").autoincrement().primaryKey(),
    appId: int("app_id").notNull(),
    userId: int("user_id").notNull(),
    /** How the user installed this app: created, public_catalog, share_link. */
    installSource: mysqlEnum("install_source", ["created", "public_catalog", "share_link"]).default("created").notNull(),
    /** Reference to the share link if installSource='share_link'. */
    shareLinkToken: varchar("share_link_token", { length: 64 }),
    installedAt: timestamp("installed_at").defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("app_installs_user_idx").on(t.userId),
    appIdx: index("app_installs_app_idx").on(t.appId),
    uniqUserApp: unique("app_installs_user_app_uniq").on(t.userId, t.appId),
  }),
);

export type AppInstall = typeof appInstalls.$inferSelect;
export type InsertAppInstall = typeof appInstalls.$inferInsert;

export const appShareLinks = mysqlTable(
  "app_share_links",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Short opaque token included in the share URL. */
    token: varchar("token", { length: 64 }).notNull().unique(),
    appId: int("app_id").notNull(),
    /** User who created the share link. */
    createdByUserId: int("created_by_user_id").notNull(),
    /** Optional expiry; null = never expires. */
    expiresAt: timestamp("expires_at"),
    /** Optional max install count; null = unlimited. */
    maxInstalls: int("max_installs"),
    /** Number of times the link has been used to install the app. */
    useCount: int("use_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    appIdx: index("app_share_links_app_idx").on(t.appId),
  }),
);

export type AppShareLink = typeof appShareLinks.$inferSelect;
export type InsertAppShareLink = typeof appShareLinks.$inferInsert;


/* ========================================================================
 * Hub Items — iOS-Home-Screen-style organizing surface (additive, v3-native)
 *
 * The Hub is the central organizing surface that collapsed Apps + Engines +
 * Library entries into a single iOS-style grid. Each row is one of:
 *   • app      — links to a userApps row (or built-in engine app via builtinId)
 *   • artifact — saved chat / generated content / report
 *   • file     — uploaded file blob (storage key in payload)
 *   • folder   — container for other hubItems (parent_folder_id forms tree)
 *
 * Layered permissions reuse the same vocabulary as userApps + the 5-layer
 * RBAC stack. Visibility on each item:
 *   • private  — only owner sees / installs
 *   • org      — anyone in `organizationId` (any L2-L5 active member)
 *   • unlisted — anyone with the share token can install
 *   • public   — listed in catalog, anyone signed in can install
 *
 * Plus optional `minRole` for org-scoped items (e.g. an artifact only
 * managers+ in the org can see). global_admin always bypasses.
 * ======================================================================== */

export const hubItems = mysqlTable(
  "hub_items",
  {
    id: int("id").autoincrement().primaryKey(),
    /** Owner user id — always the creator. */
    ownerUserId: int("owner_user_id").notNull(),
    /** What this item is. */
    itemType: mysqlEnum("hub_item_type", ["app", "artifact", "file", "folder"]).notNull(),
    /** If itemType='app' and links to a userApps row. */
    appId: int("app_id"),
    /** If itemType='app' and is a built-in engine app, e.g. 'engine:formational'. */
    builtinId: varchar("builtin_id", { length: 96 }),
    /** Display label shown on the Hub tile. */
    label: varchar("label", { length: 200 }).notNull(),
    /** Emoji or icon URL. Falls back to engine-default for builtin apps. */
    icon: varchar("icon", { length: 256 }),
    /** Tile background color (hex or oklch token). */
    color: varchar("color", { length: 32 }),
    /** Parent folder id (null = root grid). */
    parentFolderId: int("parent_folder_id"),
    /** Page index on the iOS-style grid (0-indexed). */
    pageIndex: int("page_index").default(0).notNull(),
    /** Sort order within the page (or within parent folder). */
    sortOrder: int("sort_order").default(0).notNull(),
    /** Pinned to dock (always visible across pages). */
    pinnedToDock: int("pinned_to_dock").default(0).notNull(),
    /** Layered permission visibility. */
    visibility: mysqlEnum("hub_visibility", ["private", "org", "unlisted", "public"])
      .default("private")
      .notNull(),
    /** Org scope when visibility='org'. */
    organizationId: int("organization_id"),
    /**
     * Minimum org role required to see this item when visibility='org'.
     * null = any active member. global_admin always bypasses.
     */
    minRole: mysqlEnum("hub_min_role", ["user", "professional", "manager", "org_admin"]),
    /** Free-form payload: storage key for file, artifact body for artifact, etc. */
    payload: json("payload"),
    /** Last-opened timestamp for "recents" sort. */
    lastOpenedAt: timestamp("last_opened_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index("hub_items_owner_idx").on(t.ownerUserId),
    parentIdx: index("hub_items_parent_idx").on(t.parentFolderId),
    typeIdx: index("hub_items_type_idx").on(t.itemType),
    visibilityIdx: index("hub_items_visibility_idx").on(t.visibility),
    orgIdx: index("hub_items_org_idx").on(t.organizationId),
    pageIdx: index("hub_items_page_idx").on(t.ownerUserId, t.pageIndex, t.sortOrder),
  }),
);

export type HubItem = typeof hubItems.$inferSelect;
export type InsertHubItem = typeof hubItems.$inferInsert;

/**
 * Hub share links — same shape as appShareLinks but for any hub item.
 * Click → install (clones a private hub item pointing at the same payload).
 */
export const hubShareLinks = mysqlTable(
  "hub_share_links",
  {
    id: int("id").autoincrement().primaryKey(),
    token: varchar("token", { length: 64 }).notNull().unique(),
    hubItemId: int("hub_item_id").notNull(),
    createdByUserId: int("created_by_user_id").notNull(),
    expiresAt: timestamp("expires_at"),
    maxInstalls: int("max_installs"),
    useCount: int("use_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    itemIdx: index("hub_share_links_item_idx").on(t.hubItemId),
  }),
);

export type HubShareLink = typeof hubShareLinks.$inferSelect;
export type InsertHubShareLink = typeof hubShareLinks.$inferInsert;


// ── Engine Widget Layouts (Round 7 — iOS-26 polish) ──
// Stores per-user, per-engine ordered slug list for the engine hub
// sortable widget grid. Each row is the canonical layout for one user
// on one engine surface (wealth | behavioral | relational | stakeholder | platform).
export const engineWidgetLayouts = mysqlTable(
  "engine_widget_layouts",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    engineId: varchar("engine_id", { length: 64 }).notNull(),
    /** JSON array of leaf paths (strings) in the user's preferred order */
    order: json("order").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    userEngineIdx: uniqueIndex("engine_widget_layouts_user_engine_uniq").on(
      t.userId,
      t.engineId,
    ),
  }),
);

export type EngineWidgetLayout = typeof engineWidgetLayouts.$inferSelect;
export type InsertEngineWidgetLayout = typeof engineWidgetLayouts.$inferInsert;



/* ========================================================================
 * Hub Item History (R14.16) — multi-tier version history for ANY hubItems row.
 *
 * Every create / update / delete / rollback against a hub item is recorded
 * here. This is the single source of truth for:
 *   • Per-user "undo" of their own content
 *   • Professional-for-client edits (actor != onBehalfOf)
 *   • Org-admin and platform-admin scope queues
 *
 * `scopeLevel` mirrors the 5-layer ownership_tier vocabulary so an admin
 * queue at any level can filter changes that fall under their authority.
 *   • platform     → visible to global_admin
 *   • organization → visible to org_admin / manager of that org
 *   • professional → visible to the professional and their managers
 *   • client       → visible to the owning client + their advising
 *                    professional + that professional's manager + org_admin
 * ======================================================================== */

export const hubItemHistory = mysqlTable(
  "hub_item_history",
  {
    id: int("id").autoincrement().primaryKey(),
    hubItemId: int("hub_item_id").notNull(),
    /** What kind of change. */
    action: mysqlEnum("hub_history_action", [
      "create",
      "update",
      "delete",
      "rollback",
      "publish",
      "adopt",
    ]).notNull(),
    /** Tier this change belongs to (for admin-queue scoping). */
    scopeLevel: mysqlEnum("hub_history_scope", [
      "platform",
      "organization",
      "professional",
      "client",
    ]).notNull(),
    /** Optional ref id within the scope (e.g. organizationId when scope=organization). */
    scopeRefId: int("scope_ref_id"),
    /** Who performed the action. */
    actorId: int("actor_id").notNull(),
    /** When acting on behalf of someone (professional editing a client's item). */
    onBehalfOfId: int("on_behalf_of_id"),
    /** JSON snapshot of the row BEFORE the change (null on create). */
    previousData: json("previous_data"),
    /** JSON snapshot of the row AFTER the change (null on delete). */
    newData: json("new_data"),
    /** Free-form note (e.g. "promoted to canonical track"). */
    note: text("note"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    itemIdx: index("hub_history_item_idx").on(t.hubItemId),
    actorIdx: index("hub_history_actor_idx").on(t.actorId),
    onBehalfIdx: index("hub_history_on_behalf_idx").on(t.onBehalfOfId),
    scopeIdx: index("hub_history_scope_idx").on(t.scopeLevel, t.scopeRefId),
    createdIdx: index("hub_history_created_idx").on(t.createdAt),
  }),
);

export type HubItemHistory = typeof hubItemHistory.$inferSelect;
export type InsertHubItemHistory = typeof hubItemHistory.$inferInsert;
