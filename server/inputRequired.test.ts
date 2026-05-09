/**
 * server/inputRequired.test.ts — invariants for the `input_required` task
 * status feature added in Round 6.
 *
 * Pure structural checks: schema membership, runner integration, UI surfacing.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
function read(p: string): string {
  return readFileSync(resolve(ROOT, p), "utf8");
}

describe("input_required status — schema + db helper", () => {
  it("tasks.status drizzle enum includes input_required", () => {
    const schema = read("drizzle/schema.ts");
    expect(schema).toMatch(
      /status:\s*mysqlEnum\("status",\s*\["idle",\s*"running",\s*"completed",\s*"error",\s*"paused",\s*"stopped",\s*"input_required"\]\)/,
    );
  });

  it("updateTaskStatus accepts the new literal in its TS signature", () => {
    const db = read("server/db.ts");
    expect(db).toContain('"input_required"');
    expect(db).toMatch(
      /updateTaskStatus\([^)]*status:\s*"idle"\s*\|\s*"running"\s*\|\s*"completed"\s*\|\s*"error"\s*\|\s*"paused"\s*\|\s*"stopped"\s*\|\s*"input_required"/,
    );
  });

  it("a drizzle migration was generated to ALTER the tasks.status enum", () => {
    const mig = read("drizzle/0054_familiar_sheva_callister.sql");
    expect(mig).toContain("ALTER TABLE `tasks` MODIFY COLUMN `status`");
    expect(mig).toContain("input_required");
  });
});

describe("input_required status — runner integration (agentStream)", () => {
  const agent = read("server/agentStream.ts");

  it("emits an input_required SSE status event when the agent ends with a clarification", () => {
    expect(agent).toMatch(/sendSSE\(safeWrite,\s*\{\s*status:\s*"input_required"\s*\}\)/);
  });

  it("only triggers when the final message is a question and no tools ran", () => {
    expect(agent).toMatch(/endsWithQuestion\s*=\s*\/\\\?\\s\*\$\//);
    expect(agent).toMatch(/needsUserReply\s*=\s*agentAskedForClarification\s*&&\s*endsWithQuestion\s*&&\s*completedToolCalls\s*===\s*0/);
  });

  it("persists the input_required state via updateTaskStatus", () => {
    expect(agent).toMatch(/updateTaskStatus\(options\.taskExternalId!,\s*"input_required"\)/);
  });

  it("notifies the project owner via notifyOwner so the input request is not silent", () => {
    expect(agent).toMatch(/notifyOwner\(\{\s*\n\s*title:\s*"Task awaiting your reply"/);
  });
});

describe("input_required status — UI surfacing", () => {
  const layout = read("client/src/components/AppLayout.tsx");
  const taskView = read("client/src/pages/TaskView.tsx");
  const ctx = read("client/src/contexts/TaskContext.tsx");

  it("TaskContext widens the Task.status union to include input_required", () => {
    expect(ctx).toMatch(/status:\s*"idle"\s*\|\s*"running"\s*\|\s*"completed"\s*\|\s*"error"\s*\|\s*"paused"\s*\|\s*"stopped"\s*\|\s*"input_required"/);
  });

  it("TaskStatusDot maps input_required to MessageCircleQuestion in primary color", () => {
    expect(layout).toContain('data-testid="task-status-dot-input-required"');
    // The dot variant emits a MessageCircleQuestion with text-primary class.
    expect(layout).toMatch(/MessageCircleQuestion[\s\S]{0,200}text-primary/);
  });

  it("TaskStatusIcon (All Tasks list) maps input_required to MessageCircleQuestion in primary color", () => {
    expect(layout).toContain('data-testid="task-status-icon-input-required"');
  });

  it("MessageCircleQuestion is imported from lucide-react", () => {
    expect(layout).toMatch(/MessageCircleQuestion[\s\S]{0,20}\}\s*from\s*"lucide-react"/);
  });

  it("AllTasks header pills include a 'Needs reply' filter for input_required", () => {
    expect(layout).toMatch(/\{\s*id:\s*"input_required",\s*label:\s*"Needs reply"\s*\}/);
  });

  it("AllTasks drawer popover filter list also includes input_required", () => {
    // both occurrences (header pills + drawer popover)
    const matches = layout.match(/id:\s*"input_required",\s*label:\s*"Needs reply"/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it("TaskView header renders a 'Needs reply' badge when task.status === input_required", () => {
    expect(taskView).toContain('data-testid="task-header-status-input-required"');
    expect(taskView).toMatch(/task\.status === "input_required"/);
    expect(taskView).toContain("Needs reply");
  });
});
