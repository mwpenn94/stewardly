import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { MotionConfig } from "framer-motion";
import { TaskProvider } from "./contexts/TaskContext";
import { BridgeProvider } from "./contexts/BridgeContext";
import { AgentBridgeProvider } from "./contexts/AgentBridgeContext";
import { GlobalVoiceFAB } from "./components/GlobalVoiceFAB";
import { AuthProvider } from "./contexts/AuthContext";
import { PILProvider } from "./components/PlatformIntelligence";
import { AudioCompanionProvider } from "./components/AudioCompanion";
import { lazy, Suspense } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "./components/AppLayout";
// Round 14.2: revert to source's OnboardingTour (OnboardingTooltips was a v3 invention).
import { OnboardingTour, useOnboardingTour } from "./components/OnboardingTour";
import AnimatedRoute from "./components/AnimatedRoute";

// Eagerly loaded
import Home from "./pages/Home";

// Lazy-loaded pages — Manus-aligned core surfaces only
const TaskView = lazy(() => import("./pages/TaskView"));
import TaskViewSkeleton from "./components/TaskViewSkeleton";
const BillingPage = lazy(() => import("./pages/BillingPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const SharedTaskView = lazy(() => import("./pages/SharedTaskView"));
const MemoryPage = lazy(() => import("./pages/MemoryPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const ReplayPage = lazy(() => import("./pages/ReplayPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const GitHubPage = lazy(() => import("./pages/GitHubPage"));
const WebAppProjectPage = lazy(() => import("./pages/WebAppProjectPage"));
const Library = lazy(() => import("./pages/Library"));
const MyContent = lazy(() => import("./pages/MyContent"));
const AdminContentReview = lazy(() => import("./pages/AdminContentReview"));
const AgentChat = lazy(() => import("./pages/AgentChat"));
const Hub = lazy(() => import("./pages/Hub"));
const AppViewer = lazy(() => import("./pages/AppViewer"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

// Tools & Management surfaces (Manus-aligned)
const ConnectorsPage = lazy(() => import("./pages/ConnectorsPage"));
const ConnectorDetailPage = lazy(() => import("./pages/ConnectorDetailPage"));
const SkillsPage = lazy(() => import("./pages/SkillsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const WebhooksPage = lazy(() => import("./pages/WebhooksPage"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage"));
const DataControlsPage = lazy(() => import("./pages/DataControlsPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const DeployedWebsitesPage = lazy(() => import("./pages/DeployedWebsitesPage"));
const DesignView = lazy(() => import("./pages/DesignView"));
const MobileProjectsPage = lazy(() => import("./pages/MobileProjectsPage"));

// Stewardship 5-layer surfaces
const IndividualHomePage = lazy(() => import("./pages/IndividualHomePage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const OrgSettingsPage = lazy(() => import("./pages/OrgSettingsPage"));
const PlatformAdminPage = lazy(() => import("./pages/PlatformAdminPage"));
const TenantManagePage = lazy(() => import("./pages/TenantManagePage"));
const ProfessionalAiSettingsPage = lazy(() => import("./pages/ProfessionalAiSettingsPage"));
const ManagerAiSettingsPage = lazy(() => import("./pages/ManagerAiSettingsPage"));
const EngineHubPage = lazy(() => import("./pages/EngineHubPage"));
// Canonical engine leaf components (Section 3.2 taxonomy)
const CalculatorsPage = lazy(() => import("./pages/Calculators"));
const PortfolioRiskMetricsPage = lazy(() => import("./pages/wealth-engine/PortfolioRiskMetrics"));
const ConnectionsPagePort = lazy(() => import("./pages/Integrations"));
const ProductsPage = lazy(() => import("./pages/Products"));
const TaxPlanningPage = lazy(() => import("./pages/TaxPlanning"));
const EstatePlanningPage = lazy(() => import("./pages/EstatePlanning"));
const InsuranceAnalysisPage = lazy(() => import("./pages/InsuranceAnalysis"));
const PeopleHubPage = lazy(() => import("./pages/PeopleHub"));
const RelationalApplet = lazy(() => import("./pages/RelationalApplet"));
const MissionalApplet = lazy(() => import("./pages/MissionalApplet"));
const ContinuousImprovementApplet = lazy(() => import("./pages/ContinuousImprovementApplet"));
const FormationalApplet = lazy(() => import("./pages/FormationalApplet"));
const ContextualApplet = lazy(() => import("./pages/ContextualApplet"));
const OrganizationsPage = lazy(() => import("./pages/Organizations"));
const OutreachAutomationPage = lazy(() => import("./pages/OutreachAutomation"));
const IntelligenceHubPage = lazy(() => import("./pages/IntelligenceHub"));
const DataPipelinesPage = lazy(() => import("./pages/DataPipelines"));
const MarketDataPage = lazy(() => import("./pages/MarketData"));
const CommunityPage = lazy(() => import("./pages/Community"));
const AchievementSystemPage = lazy(() => import("./pages/learning/AchievementSystem"));
const MyFinancialTwinPage = lazy(() => import("./pages/MyFinancialTwin"));
const LearningTracksIndexPage = lazy(() => import("./pages/learning/TracksIndex"));
const AdminHubV2Page = lazy(() => import("./pages/AdminHubV2"));
const AdminAuditTrailPage = lazy(() => import("./pages/AdminAuditTrail"));
const AdminSystemHealthPage = lazy(() => import("./pages/AdminSystemHealth"));
const APIKeysPage = lazy(() => import("./pages/APIKeys"));
const ImprovementEnginePage = lazy(() => import("./pages/ImprovementEngine"));
const PlatformGuidePage = lazy(() => import("./pages/PlatformGuide"));
// Round 14.2: source hub entry components for the 5 mission applets
const LearningHome = lazy(() => import("./pages/learning/LearningHome"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="space-y-2 w-64">
          <div className="h-3 bg-card rounded animate-pulse" />
          <div className="h-3 bg-card rounded animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  );
}

function SuspenseRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}><AnimatedRoute>{children}</AnimatedRoute></Suspense>;
}

/** Admin-only route wrapper */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-foreground">Admin Access Required</h2>
        <p className="text-muted-foreground text-center max-w-md">This page requires administrator privileges. Contact your admin for access.</p>
      </div>
    );
  }
  return <>{children}</>;
}

// === Auto-merged lazy imports from canonical ai-ref App.tsx ===
const SignIn = lazy(() => import("@/pages/SignIn"));
const OrgLanding = lazy(() => import("@/pages/OrgLanding"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const SharedPlanView = lazy(() => import("@/pages/SharedPlanView"));
// Round 13.2: SearchResults + UnifiedAI removed (legacy source-app surfaces).
const EngineDashboard = lazy(() => import("@/pages/EngineDashboard"));
const ManagerDashboard = lazy(() => import("@/pages/ManagerDashboard"));
const OrgBrandingEditor = lazy(() => import("@/pages/OrgBrandingEditor"));
const GlobalAdmin = lazy(() => import("@/pages/GlobalAdmin"));
const Portal = lazy(() => import("@/pages/Portal"));
const Organizations = lazy(() => import("@/pages/Organizations"));
const ImprovementEngine = lazy(() => import("@/pages/ImprovementEngine"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const BCP = lazy(() => import("@/pages/BCP"));
const FairnessTestDashboard = lazy(() => import("@/pages/FairnessTestDashboard"));
const KnowledgeAdmin = lazy(() => import("@/pages/KnowledgeAdmin"));
const AdminIntegrations = lazy(() => import("@/pages/AdminIntegrations"));
const AdvisorIntegrations = lazy(() => import("@/pages/AdvisorIntegrations"));
const IntegrationHealth = lazy(() => import("@/pages/IntegrationHealth"));
const SyncDashboard = lazy(() => import("@/pages/SyncDashboard"));
const LocationAnalytics = lazy(() => import("@/pages/LocationAnalytics"));
const PermissionManagement = lazy(() => import("@/pages/PermissionManagement"));
const LocationOnboarding = lazy(() => import("@/pages/LocationOnboarding"));
const LocationHealth = lazy(() => import("@/pages/LocationHealth"));
const WebhookVsPolling = lazy(() => import("@/pages/WebhookVsPolling"));
const AlertThresholds = lazy(() => import("@/pages/AlertThresholds"));
const DynamicIntegrations = lazy(() => import("@/pages/DynamicIntegrations"));
const SuitabilityPanel = lazy(() => import("@/pages/SuitabilityPanel"));
const ProficiencyDashboard = lazy(() => import("@/pages/ProficiencyDashboard"));
const ProductIntelligence = lazy(() => import("@/pages/ProductIntelligence"));
const AdminIntelligenceDashboard = lazy(() => import("@/pages/AdminIntelligenceDashboard"));
const AIUsageDashboard = lazy(() => import("@/pages/AIUsageDashboard"));
const DataEngineDashboard = lazy(() => import("@/pages/DataEngineDashboard"));
const ClientActivityTimeline = lazy(() => import("@/pages/ClientActivityTimeline"));
const PlatformGuide = lazy(() => import("@/pages/PlatformGuide"));
const PassiveActions = lazy(() => import("@/pages/PassiveActions"));
const MarketData = lazy(() => import("@/pages/MarketData"));
const ImportData = lazy(() => import("@/pages/ImportData"));
const LeadPipeline = lazy(() => import("@/pages/LeadPipeline"));
const LeadDetail = lazy(() => import("@/pages/LeadDetail"));
const CRMSync = lazy(() => import("@/pages/CRMSync"));
const ComplianceAudit = lazy(() => import("@/pages/ComplianceAudit"));
const TaxPlanning = lazy(() => import("@/pages/TaxPlanning"));
const InsuranceAnalysis = lazy(() => import("@/pages/InsuranceAnalysis"));
const EstatePlanning = lazy(() => import("@/pages/EstatePlanning"));
const SocialSecurity = lazy(() => import("@/pages/SocialSecurity"));
const MedicareAnalysis = lazy(() => import("@/pages/MedicareAnalysis"));
const RiskAssessment = lazy(() => import("@/pages/RiskAssessment"));
const IncomeProjection = lazy(() => import("@/pages/IncomeProjection"));
const PublicCalculators = lazy(() => import("@/pages/PublicCalculators"));
const EmbedWidget = lazy(() => import("@/pages/EmbedWidget"));
const EmbedCalculator = lazy(() => import("@/pages/EmbedCalculator"));
const AdvisorProfile = lazy(() => import("@/pages/AdvisorProfile"));
const TeamManagement = lazy(() => import("@/pages/TeamManagement"));
const APIKeys = lazy(() => import("@/pages/APIKeys"));
const WebhookManager = lazy(() => import("@/pages/WebhookManager"));
const GHLWebhookSetup = lazy(() => import("@/pages/GHLWebhookSetup"));
const ClientOnboarding = lazy(() => import("@/pages/ClientOnboarding"));
const FinancialProtectionScore = lazy(() => import("@/pages/FinancialProtectionScore"));
const FinancialPlanning = lazy(() => import("@/pages/FinancialPlanning"));
const Community = lazy(() => import("@/pages/Community"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const AdminSystemHealth = lazy(() => import("@/pages/AdminSystemHealth"));
const ImprovementDashboard = lazy(() => import("@/pages/ImprovementDashboard"));
const AdminDataFreshness = lazy(() => import("@/pages/AdminDataFreshness"));
const AdminLeadSources = lazy(() => import("@/pages/AdminLeadSources"));
const AdminRateManagement = lazy(() => import("@/pages/AdminRateManagement"));
const AdminPlatformReports = lazy(() => import("@/pages/AdminPlatformReports"));
const AdminFeaturePermissions = lazy(() => import("@/pages/AdminFeaturePermissions"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const MyWork = lazy(() => import("@/pages/MyWork"));
const MyFinancialTwin = lazy(() => import("@/pages/MyFinancialTwin"));
const NewLanding = lazy(() => import("@/pages/NewLanding"));
const AudioPreferences = lazy(() => import("@/pages/settings/AudioPreferences"));
const LicenseTracker = lazy(() => import("@/pages/learning/LicenseTracker"));
const ContentStudio = lazy(() => import("@/pages/learning/ContentStudio"));
const LearningTrackDetail = lazy(() => import("@/pages/learning/LearningTrackDetail"));
const LearningFlashcardStudy = lazy(() => import("@/pages/learning/LearningFlashcardStudy"));
const LearningQuizRunner = lazy(() => import("@/pages/learning/LearningQuizRunner"));
const LearningDueReview = lazy(() => import("@/pages/learning/LearningDueReview"));
const LearningSearch = lazy(() => import("@/pages/learning/LearningSearch"));
const ExamSimulatorPage = lazy(() => import("@/pages/learning/ExamSimulatorPage"));
const DisciplineDeepDive = lazy(() => import("@/pages/learning/DisciplineDeepDive"));
const CaseStudySimulatorRoute = lazy(() => import("@/pages/learning/CaseStudySimulatorRoute"));
const AchievementSystem = lazy(() => import("@/pages/learning/AchievementSystem"));
const StudyBuddy = lazy(() => import("@/pages/learning/StudyBuddy"));
const HandsFreeStudy = lazy(() => import("@/pages/learning/HandsFreeStudy"));
const AudioStudyPage = lazy(() => import("@/pages/learning/AudioStudyPage"));
const AIQuizPage = lazy(() => import("@/pages/learning/AIQuizPage"));
const FormulaLab = lazy(() => import("@/pages/learning/FormulaLab"));
const StudyAnalytics = lazy(() => import("@/pages/learning/StudyAnalytics"));
const ProgressExport = lazy(() => import("@/pages/learning/ProgressExport"));
const Bookmarks = lazy(() => import("@/pages/learning/Bookmarks"));
const Playlists = lazy(() => import("@/pages/learning/Playlists"));
const StudyGroups = lazy(() => import("@/pages/learning/StudyGroups"));
const DiscoveryHistory = lazy(() => import("@/pages/learning/DiscoveryHistory"));
const PeerGroups = lazy(() => import("@/pages/learning/PeerGroups"));
const FormulasPage = lazy(() => import("@/pages/learning/FormulasPage"));
const CasesPage = lazy(() => import("@/pages/learning/CasesPage"));
const FSToolkitPage = lazy(() => import("@/pages/learning/FSToolkitPage"));
const TracksIndex = lazy(() => import("@/pages/learning/TracksIndex"));
const StudySession = lazy(() => import("@/pages/learning/StudySession"));
const SharedPlaylist = lazy(() => import("@/pages/learning/SharedPlaylist"));
const LearningSettings = lazy(() => import("@/pages/learning/LearningSettings"));
const GlobalLeaderboard = lazy(() => import("@/pages/learning/GlobalLeaderboard"));
const AgentManager = lazy(() => import("@/pages/AgentManager"));
const AgentPage = lazy(() => import("@/pages/AgentPage"));
const AdvisoryHub = lazy(() => import("@/pages/AdvisoryHub"));
const RelationshipsHub = lazy(() => import("@/pages/RelationshipsHub"));
const Changelog = lazy(() => import("@/pages/Changelog"));
const ReferenceHub = lazy(() => import("@/pages/wealth-engine/ReferenceHub"));
const EmailCampaign = lazy(() => import("@/pages/EmailCampaign"));
const MarketingAssets = lazy(() => import("@/pages/MarketingAssets"));
const DataPipelines = lazy(() => import("@/pages/DataPipelines"));
const OutreachAutomation = lazy(() => import("@/pages/OutreachAutomation"));
const ApiDocumentation = lazy(() => import("@/pages/ApiDocumentation"));
const AdminAuditTrail = lazy(() => import("@/pages/AdminAuditTrail"));
const CommandCenter = lazy(() => import("@/pages/CommandCenter"));
const BusinessExit = lazy(() => import("@/pages/BusinessExit"));
const AnnualReview = lazy(() => import("@/pages/AnnualReview"));
const ComplianceCopilot = lazy(() => import("@/pages/ComplianceCopilot"));
const TaxProjector = lazy(() => import("@/pages/TaxProjector"));
const PremiumFinanceRates = lazy(() => import("@/pages/PremiumFinanceRates"));
const ManusNextDashboard = lazy(() => import("@/pages/ManusNextDashboard"));
const WorkflowAutomation = lazy(() => import("@/pages/WorkflowAutomation"));
const EnrichmentAdmin = lazy(() => import("@/pages/EnrichmentAdmin"));
const PortalAnalytics = lazy(() => import("@/pages/PortalAnalytics"));
const SovereignStudy = lazy(() => import("@/pages/SovereignStudy"));
const ClientSegmentation = lazy(() => import("@/pages/ClientSegmentation"));
// Round 9 — porting in source pages that were missing in v3
// Round 13.2: legacy source-app Chat surface removed; ManusNext task chat (Home + TaskView) is the single chat experience.
// R14.18: Legacy CodeChat (Cursor/Claude-Code-style surface ported from stewardlyai) fully removed; superseded by Manus Next TaskView.
const Consensus = lazy(() => import("@/pages/Consensus"));
const Comparables = lazy(() => import("@/pages/Comparables"));
const Rebalancing = lazy(() => import("@/pages/Rebalancing"));
const Workflows = lazy(() => import("@/pages/Workflows"));
const OperationsHub = lazy(() => import("@/pages/OperationsHub"));
const SettingsHub = lazy(() => import("@/pages/SettingsHub"));
const IntelligenceHubV2 = lazy(() => import("@/pages/IntelligenceHubV2"));
const ConnectionMap = lazy(() => import("@/pages/learning/ConnectionMap"));
const AdvisoryExecution = lazy(() => import("@/pages/PartGPages").then(m => ({ default: m.AdvisoryExecution })));
const CarrierConnector = lazy(() => import("@/pages/PartGPages").then(m => ({ default: m.CarrierConnector })));
const InsuranceApplications = lazy(() => import("@/pages/PartGPages").then(m => ({ default: m.InsuranceApplications })));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/task/:id">
        {() => <Suspense fallback={<TaskViewSkeleton />}><TaskView /></Suspense>}
      </Route>

      {/* Core Manus pages */}
      <Route path="/billing">
        <SuspenseRoute><BillingPage /></SuspenseRoute>
      </Route>
      <Route path="/settings">
        <SuspenseRoute><SettingsPage /></SuspenseRoute>
      </Route>
      <Route path="/memory">
        <SuspenseRoute><MemoryPage /></SuspenseRoute>
      </Route>
      <Route path="/schedule">
        <SuspenseRoute><SchedulePage /></SuspenseRoute>
      </Route>
      <Route path="/replay/:taskId">
        <SuspenseRoute><ReplayPage /></SuspenseRoute>
      </Route>
      <Route path="/replay">
        <SuspenseRoute><ReplayPage /></SuspenseRoute>
      </Route>
      <Route path="/projects/webapp/:projectId">
        <SuspenseRoute><WebAppProjectPage /></SuspenseRoute>
      </Route>
      <Route path="/projects">
        <SuspenseRoute><ProjectsPage /></SuspenseRoute>
      </Route>
      <Route path="/project/:id">
        <SuspenseRoute><ProjectsPage /></SuspenseRoute>
      </Route>
      <Route path="/library">
        <Redirect to="/hub" />
      </Route>
      <Route path="/library-classic">
        <SuspenseRoute><Library /></SuspenseRoute>
      </Route>
      <Route path="/hub">
        <SuspenseRoute><Hub /></SuspenseRoute>
      </Route>
      <Route path="/hub/:folderId">
        <SuspenseRoute><Hub /></SuspenseRoute>
      </Route>
      <Route path="/apps/:slug">
        {(params) => (
          <SuspenseRoute><AppViewer slug={params.slug ?? ""} /></SuspenseRoute>
        )}
      </Route>
      <Route path="/github/:repoId">
        <SuspenseRoute><GitHubPage /></SuspenseRoute>
      </Route>
      <Route path="/github">
        <SuspenseRoute><GitHubPage /></SuspenseRoute>
      </Route>
      <Route path="/share/:token">
        <SuspenseRoute><SharedTaskView /></SuspenseRoute>
      </Route>
      <Route path="/shared/:token">
        <SuspenseRoute><SharedTaskView /></SuspenseRoute>
      </Route>
      <Route path="/profile">
        <SuspenseRoute><ProfilePage /></SuspenseRoute>
      </Route>
      <Route path="/discover">
        <SuspenseRoute><DiscoverPage /></SuspenseRoute>
      </Route>
      <Route path="/help">
        <SuspenseRoute><HelpPage /></SuspenseRoute>
      </Route>

      {/* Management surfaces */}
      <Route path="/connectors">
        <SuspenseRoute><ConnectorsPage /></SuspenseRoute>
      </Route>
      <Route path="/connector/:id">
        <SuspenseRoute><ConnectorDetailPage /></SuspenseRoute>
      </Route>
      <Route path="/skills">
        <SuspenseRoute><SkillsPage /></SuspenseRoute>
      </Route>
      <Route path="/team">
        <SuspenseRoute><TeamPage /></SuspenseRoute>
      </Route>
      <Route path="/deployed-websites">
        <SuspenseRoute><DeployedWebsitesPage /></SuspenseRoute>
      </Route>
      <Route path="/mobile-projects">
        <SuspenseRoute><MobileProjectsPage /></SuspenseRoute>
      </Route>
      <Route path="/app-publish">
        <SuspenseRoute><DeployedWebsitesPage /></SuspenseRoute>
      </Route>
      <Route path="/design/:id">
        <SuspenseRoute><DesignView /></SuspenseRoute>
      </Route>

      {/* Fabricated v3 surfaces redirected to their canonical equivalents.
         The original components remain on disk but are no longer mounted. */}
      <Route path="/individual">
        <Redirect to="/missional" />
      </Route>

      {/* Canonical 5-engine hubs (Section 3 taxonomy) */}
      {/* Round 14.2: each mission applet renders the corresponding source hub verbatim. */}
      {/* Wave B.3: dedicated Formational applet wrapper. The previous
          implementation mounted LearningHome directly, hiding all the
          other Formational sub-surfaces (My Content, Skills, Sovereign
          Study, Library, Knowledge Admin, Deep Research, Memory).
          The applet now provides the scoped sidebar that exposes them. */}
      <Route path="/formational">
        <SuspenseRoute><FormationalApplet /></SuspenseRoute>
      </Route>
      <Route path="/formational/:tab">
        <SuspenseRoute><FormationalApplet /></SuspenseRoute>
      </Route>
      <Route path="/my-content">
        <SuspenseRoute><MyContent /></SuspenseRoute>
      </Route>
      <Route path="/agent-chat">
        <SuspenseRoute><AgentChat /></SuspenseRoute>
      </Route>
      <Route path="/admin/content-review">
        <AdminRoute><SuspenseRoute><AdminContentReview /></SuspenseRoute></AdminRoute>
      </Route>
      <Route path="/relational">
        <SuspenseRoute><RelationalApplet /></SuspenseRoute>
      </Route>
      <Route path="/relational/:tab">
        <SuspenseRoute><RelationalApplet /></SuspenseRoute>
      </Route>
      <Route path="/missional">
        <SuspenseRoute><MissionalApplet /></SuspenseRoute>
      </Route>
      <Route path="/missional/:tab">
        <SuspenseRoute><MissionalApplet /></SuspenseRoute>
      </Route>
      {/* Wave B.4: dedicated Contextual applet wrapper. The previous
          implementation mounted IntelligenceHubV2 directly, but the
          Contextual engine is responsible for memory + audit + search +
          vault — the applet exposes those surfaces in line with the
          engine's intent set (contextual.memory.*, contextual.audit.read,
          contextual.search.query, contextual.vault.*). */}
      <Route path="/contextual">
        <SuspenseRoute><ContextualApplet /></SuspenseRoute>
      </Route>
      <Route path="/contextual/:tab">
        <SuspenseRoute><ContextualApplet /></SuspenseRoute>
      </Route>
      <Route path="/continuous-improvement">
        <SuspenseRoute><ContinuousImprovementApplet /></SuspenseRoute>
      </Route>
      <Route path="/continuous-improvement/:tab">
        <SuspenseRoute><ContinuousImprovementApplet /></SuspenseRoute>
      </Route>

      {/* Round 14.2: 27 invented mission sub-leaf routes removed. Each mission applet renders the source hub which has its own internal nav + progressive disclosure. */}

      {/* Source-faithful canonical routes — these surfaces remain reachable via direct URLs. */}
      <Route path="/wealth-engine">
        <SuspenseRoute><CalculatorsPage /></SuspenseRoute>
      </Route>
      <Route path="/learning">
        <SuspenseRoute><LearningHome /></SuspenseRoute>
      </Route>
      <Route path="/people">
        <SuspenseRoute><PeopleHubPage /></SuspenseRoute>
      </Route>
      <Route path="/intelligence-hub">
        <SuspenseRoute><IntelligenceHubV2 /></SuspenseRoute>
      </Route>
      <Route path="/connections">
        <Redirect to="/learning/connections" />
      </Route>
      <Route path="/portfolio">
        <Redirect to="/portfolio-risk" />
      </Route>


      <Route path="/org/settings">
        <SuspenseRoute><OrgSettingsPage /></SuspenseRoute>
      </Route>
      <Route path="/professional/settings">
        <SuspenseRoute><ProfessionalAiSettingsPage /></SuspenseRoute>
      </Route>
      <Route path="/team/settings">
        <SuspenseRoute><ManagerAiSettingsPage /></SuspenseRoute>
      </Route>
      <Route path="/platform">
        <SuspenseRoute><PlatformAdminPage /></SuspenseRoute>
      </Route>
      <Route path="/admin/tenants/:orgId">
        <SuspenseRoute><TenantManagePage /></SuspenseRoute>
      </Route>
      <Route path="/admin">
        <SuspenseRoute><AdminHubV2Page /></SuspenseRoute>
      </Route>

      {/* Admin-only */}
      <Route path="/webhooks">
        <SuspenseRoute><AdminRoute><WebhooksPage /></AdminRoute></SuspenseRoute>
      </Route>
      <Route path="/data-controls">
        <SuspenseRoute><AdminRoute><DataControlsPage /></AdminRoute></SuspenseRoute>
      </Route>

      <Route path="/404" component={NotFound} />

      {/* === Auto-merged routes from canonical ai-ref App.tsx === */}
      <Route path="/signin" component={SignIn} />
      <Route path="/org/:slug" component={OrgLanding} />
      <Route path="/welcome" component={Welcome} />
      <Route path="terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/plan/:token" component={SharedPlanView} />
      {/* Round 13.2: /search and /ai redirected to Home (ManusNext task chat handles both intents). */}
      <Route path="/search"><Redirect to="/" /></Route>
      <Route path="/ai"><Redirect to="/" /></Route>
      <Route path="/engine-dashboard" component={EngineDashboard} />
      <Route path="/manager" component={ManagerDashboard} />
      <Route path="/org-branding" component={OrgBrandingEditor} />
      <Route path="/admin-legacy" component={GlobalAdmin} />
      <Route path="/portal" component={Portal} />
      <Route path="/organizations" component={Organizations} />
      <Route path="/admin/improvement-engine" component={ImprovementEngine} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/admin/bcp" component={BCP} />
      <Route path="/admin/fairness" component={FairnessTestDashboard} />
      <Route path="/admin/knowledge" component={KnowledgeAdmin} />
      <Route path="/admin/integrations" component={AdminIntegrations} />
      <Route path="/my-integrations" component={AdvisorIntegrations} />
      <Route path="/integration-health" component={IntegrationHealth} />
      <Route path="/sync-dashboard" component={SyncDashboard} />
      <Route path="/location-analytics" component={LocationAnalytics} />
      <Route path="/permissions" component={PermissionManagement} />
      <Route path="/location-onboarding" component={LocationOnboarding} />
      <Route path="/location-health" component={LocationHealth} />
      <Route path="/webhook-vs-polling" component={WebhookVsPolling} />
      <Route path="/alert-thresholds" component={AlertThresholds} />
      <Route path="/dynamic-integrations" component={DynamicIntegrations} />
      <Route path="/suitability-panel" component={SuitabilityPanel} />
      <Route path="/proficiency" component={ProficiencyDashboard} />
      <Route path="/product-intelligence" component={ProductIntelligence} />
      <Route path="/admin/intelligence" component={AdminIntelligenceDashboard} />
      <Route path="/ai-usage" component={AIUsageDashboard} />
      <Route path="/data-engine" component={DataEngineDashboard} />
      <Route path="/activity-timeline" component={ClientActivityTimeline} />
      <Route path="/admin/guide" component={PlatformGuide} />
      <Route path="/passive-actions" component={PassiveActions} />
      <Route path="/market-data" component={MarketData} />
      <Route path="/import" component={ImportData} />
      <Route path="/leads" component={LeadPipeline} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/crm-sync" component={CRMSync} />
      <Route path="/compliance-audit" component={ComplianceAudit} />
      <Route path="/tax-planning" component={TaxPlanning} />
      <Route path="/insurance-analysis" component={InsuranceAnalysis} />
      <Route path="/estate" component={EstatePlanning} />
      <Route path="/social-security" component={SocialSecurity} />
      <Route path="/medicare" component={MedicareAnalysis} />
      <Route path="/risk-assessment" component={RiskAssessment} />
      <Route path="/income-projection" component={IncomeProjection} />
      <Route path="/public-calculators" component={PublicCalculators} />
      <Route path="/embed" component={EmbedWidget} />
      <Route path="/embed/calculator" component={EmbedCalculator} />
      <Route path="/advisor/:id" component={AdvisorProfile} />
      <Route path="/admin/team" component={TeamManagement} />
      <Route path="/admin/billing" component={BillingPage} />
      <Route path="/admin/api-keys" component={APIKeys} />
      <Route path="/admin/webhooks" component={WebhookManager} />
      <Route path="/admin/webhooks/ghl-setup" component={GHLWebhookSetup} />
      <Route path="/client-onboarding" component={ClientOnboarding} />
      <Route path="/protection-score" component={FinancialProtectionScore} />
      <Route path="/financial-planning" component={FinancialPlanning} />
      <Route path="/community" component={Community} />
      <Route path="/unsubscribe" component={Unsubscribe} />
      <Route path="/admin/system-health" component={AdminSystemHealth} />
      <Route path="/admin/improvement" component={ImprovementDashboard} />
      <Route path="/admin/data-freshness" component={AdminDataFreshness} />
      <Route path="/admin/lead-sources" component={AdminLeadSources} />
      <Route path="/admin/rate-management" component={AdminRateManagement} />
      <Route path="/admin/platform-reports" component={AdminPlatformReports} />
      <Route path="/admin/feature-permissions" component={AdminFeaturePermissions} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/my-work" component={MyWork} />
      <Route path="/financial-twin" component={MyFinancialTwin} />
      <Route path="/welcome-landing" component={NewLanding} />
      <Route path="/settings/audio" component={AudioPreferences} />
      <Route path="/learning/licenses" component={LicenseTracker} />
      <Route path="/learning/studio" component={ContentStudio} />
      <Route path="/learning/studio/:tab" component={ContentStudio} />
      <Route path="/learning/tracks/:slug" component={LearningTrackDetail} />
      <Route path="/learning/tracks/:slug/study" component={LearningFlashcardStudy} />
      <Route path="/learning/tracks/:slug/quiz" component={LearningQuizRunner} />
      <Route path="/learning/review" component={LearningDueReview} />
      <Route path="/learning/search" component={LearningSearch} />
      <Route path="/learning/exam/:moduleSlug" component={ExamSimulatorPage} />
      <Route path="/learning/discipline/:slug" component={DisciplineDeepDive} />
      <Route path="/learning/case/:caseId" component={CaseStudySimulatorRoute} />
      <Route path="/learning/case" component={CaseStudySimulatorRoute} />
      <Route path="/learning/achievements" component={AchievementSystem} />
      <Route path="/learning/study-buddy" component={StudyBuddy} />
      <Route path="/learning/hands-free" component={HandsFreeStudy} />
      <Route path="/learning/audio/:slug" component={AudioStudyPage} />
      <Route path="/learning/ai-quiz" component={AIQuizPage} />
      <Route path="/learning/formula-lab" component={FormulaLab} />
      <Route path="/learning/analytics" component={StudyAnalytics} />
      <Route path="/learning/export" component={ProgressExport} />
      <Route path="/learning/bookmarks" component={Bookmarks} />
      <Route path="/learning/playlists" component={Playlists} />
      <Route path="/learning/groups" component={StudyGroups} />
      <Route path="/learning/discovery" component={DiscoveryHistory} />
      <Route path="/learning/peer-groups" component={PeerGroups} />
      <Route path="/learning/formulas" component={FormulasPage} />
      <Route path="/learning/cases" component={CasesPage} />
      <Route path="/learning/fs-toolkit" component={FSToolkitPage} />
      <Route path="/learning/tracks" component={TracksIndex} />
      <Route path="/learning/session/:trackSlug" component={StudySession} />
      <Route path="/learning/shared/:shareToken" component={SharedPlaylist} />
      <Route path="/learning/settings" component={LearningSettings} />
      <Route path="/learning/leaderboard" component={GlobalLeaderboard} />
      <Route path="/agents" component={AgentManager} />
      <Route path="/agent" component={AgentPage} />
      <Route path="/advisory" component={AdvisoryHub} />
      <Route path="/relationships" component={RelationshipsHub} />
      <Route path="/changelog" component={Changelog} />
      <Route path="/wealth-engine/references" component={ReferenceHub} />
      <Route path="/email-campaigns" component={EmailCampaign} />
      <Route path="/marketing-assets" component={MarketingAssets} />
      <Route path="/data-pipelines" component={DataPipelines} />
      <Route path="/outreach-automation" component={OutreachAutomation} />
      <Route path="/api-docs" component={ApiDocumentation} />
      <Route path="/admin/audit-trail" component={AdminAuditTrail} />
      <Route path="/command-center" component={CommandCenter} />
      <Route path="/business-exit" component={BusinessExit} />
      <Route path="/annual-review" component={AnnualReview} />
      <Route path="/compliance-copilot" component={ComplianceCopilot} />
      <Route path="/tax-projector" component={TaxProjector} />
      <Route path="/premium-finance-rates" component={PremiumFinanceRates} />
      <Route path="/manus-next" component={ManusNextDashboard} />
      <Route path="/workflow-automation" component={WorkflowAutomation} />
      <Route path="/enrichment-admin" component={EnrichmentAdmin} />
      <Route path="/portal-analytics" component={PortalAnalytics} />
      <Route path="/sovereign-study" component={SovereignStudy} />
      <Route path="/client-segmentation" component={ClientSegmentation} />
      {/* Round 9 — newly ported source routes */}
      {/* Round 13.2: /chat redirects to Home (new task), /chat/:id redirects to /task/:id. */}
      <Route path="/chat/:id">{(params) => <Redirect to={`/task/${params.id}`} />}</Route>
      <Route path="/chat"><Redirect to="/" /></Route>
      {/* R14.18: /code-chat removed; redirect any deep-linked traffic to the canonical chat. */}
      <Route path="/code-chat"><Redirect to="/" /></Route>
      <Route path="/consensus" component={Consensus} />
      <Route path="/comparables" component={Comparables} />
      <Route path="/rebalancing" component={Rebalancing} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/operations" component={OperationsHub} />
      <Route path="/calculators/:panel" component={CalculatorsPage} />
      <Route path="/calculators" component={CalculatorsPage} />
      <Route path="/wealth-engine/retirement" component={CalculatorsPage} />
      <Route path="/wealth-engine/strategy-comparison" component={CalculatorsPage} />
      <Route path="/wealth-engine/quick-quote" component={CalculatorsPage} />
      <Route path="/wealth-engine/practice-to-wealth" component={CalculatorsPage} />
      <Route path="/wealth-engine/business-income" component={CalculatorsPage} />
      <Route path="/wealth-engine/team-builder" component={CalculatorsPage} />
      <Route path="/wealth-engine/what-if" component={CalculatorsPage} />
      <Route path="/wealth-engine/configurator" component={CalculatorsPage} />
      <Route path="/wealth-engine/business-valuation" component={CalculatorsPage} />
      <Route path="/wealth-engine/holistic-comparison" component={CalculatorsPage} />
      <Route path="/wealth-engine/quick-quote-hub" component={CalculatorsPage} />
      <Route path="/wealth-engine/business-income-quick-quote" component={CalculatorsPage} />
      <Route path="/wealth-engine/owner-comp" component={CalculatorsPage} />
      <Route path="/wealth-engine/sensitivity" component={CalculatorsPage} />
      <Route path="/settings/knowledge" component={SettingsHub} />
      <Route path="/wealth-engine/:panel" component={CalculatorsPage} />
      <Route path="/portfolio-risk" component={PortfolioRiskMetricsPage} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/intelligence-hub/:tab" component={IntelligenceHubV2} />
      <Route path="/admin/:tab" component={AdminHubV2Page} />
      <Route path="/people/:tab" component={PeopleHubPage} />
      <Route path="/people/premium-finance"><Redirect to="/premium-finance-rates" /></Route>
      <Route path="/settings/:tab" component={SettingsHub} />
      <Route path="/learning/connections" component={ConnectionMap} />
      <Route path="/learning/study-groups"><Redirect to="/learning/groups" /></Route>
      <Route path="/learning/connections-browse" component={ConnectionMap} />
      <Route path="/insurance-applications" component={InsuranceApplications} />
      <Route path="/advisory-execution" component={AdvisoryExecution} />
      <Route path="/carrier-connector" component={CarrierConnector} />
      <Route path="/my-plan">{() => { window.location.replace('/wealth-engine?panel=myplan'); return null; }}</Route>
      <Route path="/improvement"><Redirect to="/admin/improvement" /></Route>
      {/* Source legacy redirects */}
      <Route path="/documents"><Redirect to="/settings/knowledge" /></Route>
      <Route path="/suitability"><Redirect to="/settings/suitability" /></Route>
      <Route path="/ai-settings"><Redirect to="/settings/ai-tuning" /></Route>
      <Route path="/study"><Redirect to="/chat" /></Route>
      <Route path="/education"><Redirect to="/chat" /></Route>
      <Route path="/meetings"><Redirect to="/relationships" /></Route>
      <Route path="/coach"><Redirect to="/chat" /></Route>
      <Route path="/planning"><Redirect to="/chat" /></Route>
      <Route path="/insights"><Redirect to="/chat" /></Route>
      <Route path="/student-loans"><Redirect to="/chat" /></Route>
      <Route path="/equity-comp"><Redirect to="/chat" /></Route>
      <Route path="/digital-assets"><Redirect to="/chat" /></Route>
      <Route path="/agentic"><Redirect to="/operations" /></Route>
      <Route path="/agent-operations"><Redirect to="/operations" /></Route>
      <Route path="/licensed-review"><Redirect to="/operations" /></Route>
      <Route path="/compliance"><Redirect to="/operations" /></Route>
      <Route path="/data-intelligence"><Redirect to="/intelligence-hub" /></Route>
      <Route path="/analytics-hub"><Redirect to="/intelligence-hub" /></Route>
      <Route path="/model-results"><Redirect to="/intelligence-hub" /></Route>
      <Route path="/intelligence"><Redirect to="/intelligence-hub" /></Route>
      <Route path="/insurance-quotes"><Redirect to="/advisory" /></Route>
      <Route path="/estate-planning"><Redirect to="/advisory" /></Route>
      <Route path="/premium-finance"><Redirect to="/advisory" /></Route>
      <Route path="/marketplace"><Redirect to="/advisory" /></Route>
      <Route path="/coi-network"><Redirect to="/relationships" /></Route>
      <Route path="/professionals"><Redirect to="/relationships" /></Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="top-right"
      theme={theme}
      toastOptions={{
        style: theme === 'dark' ? {
          background: 'oklch(0.2603 0 0)',
          border: '1px solid oklch(0.2768 0 0)',
          color: 'oklch(0.8884 0 0)',
        } : {
          background: 'oklch(0.98 0.001 80)',
          border: '1px solid oklch(0.88 0.002 80)',
          color: 'oklch(0.24 0.01 70)',
        },
      }}
    />
  );
}

function SourceOnboardingTourMount() {
  const { isOpen, completeTour } = useOnboardingTour();
  return <OnboardingTour isOpen={isOpen} onComplete={completeTour} />;
}

function App() {
  return (
    <ErrorBoundary>
      {/* R14.22 — framer-motion MotionConfig: when reducedMotion="user",
          framer honours `prefers-reduced-motion: reduce` and short-circuits
          transitions (durations → 0) so motion-heavy components stay
          accessible without per-component opt-in. Pairs with the
          @media (prefers-reduced-motion: reduce) rules in index.css. */}
      <MotionConfig reducedMotion="user">
      <ThemeProvider defaultTheme="dark" switchable>
        <AuthProvider>
        <AudioCompanionProvider>
        <PILProvider>
        <BridgeProvider>
          <TaskProvider>
          <AgentBridgeProvider>
          <TooltipProvider>
            <nav aria-label="Skip navigation" className="contents">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              >
                Skip to main content
              </a>
            </nav>
            <ThemedToaster />
            <AppLayout>
              <Router />
            </AppLayout>
            <SourceOnboardingTourMount />
            <GlobalVoiceFAB />
          </TooltipProvider>
          </AgentBridgeProvider>
          </TaskProvider>
        </BridgeProvider>
        </PILProvider>
        </AudioCompanionProvider>
         </AuthProvider>
      </ThemeProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
export default App;
