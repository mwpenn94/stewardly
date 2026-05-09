/**
 * Wave E — Stewardship/fiduciary language audit
 * ================================================
 *
 * Commitment C-18: customer-facing copy must use the platform's
 * stewardship-and-fiduciary vocabulary, not the generic SaaS or
 * advice-industry vocabulary. The audit module classifies a string of
 * customer-facing copy into:
 *
 *   - aligned         — uses approved vocabulary, no banned terms
 *   - flagged         — contains a banned term that must be reworded
 *   - context-warning — uses a permitted-with-care term that may be
 *                       acceptable in context but warrants reviewer
 *                       attention
 *
 * The intent is not to rewrite existing copy (Wave E does not perform
 * a destructive sweep) but to add an authoritative audit module that
 * tests can call against any customer-facing string, including future
 * additions, so we never regress. The audit is also exposed as a
 * tRPC procedure so the operator can paste a draft and receive a
 * verdict.
 *
 * Banned terms (default policy):
 *   - "vendor"           — Stewardly is a steward, not a vendor
 *   - "subscriber"       — Stewardly customers are clients
 *   - "subscription"     — preferred: "stewardship engagement"
 *   - "AI assistant"     — preferred: "Stewardly engine surface"
 *   - "chatbot"          — preferred: "conversational surface"
 *   - "robo-advisor"     — preferred: "automated stewardship surface"
 *
 * Permitted-with-care:
 *   - "advisor"          — fine when discussing the human profession;
 *                          flag when describing Stewardly itself
 *   - "agent"            — fine in technical "engine agent" sense;
 *                          flag when describing Stewardly to clients
 *
 * Approved-vocabulary checklist (when the copy is FIDUCIARY-CRITICAL,
 * at least one approved phrase must appear):
 *   - "stewardship", "fiduciary duty", "best interest", "disclosure",
 *     "client-first", "steward"
 *
 * The audit is pure and side-effect-free.
 */

export type AuditVerdict = "aligned" | "flagged" | "context-warning";

export interface AuditFinding {
  term: string;
  /** Where in the input it occurs. */
  index: number;
  /** Reason the term was flagged. */
  reason: string;
  severity: "block" | "warn";
}

export interface AuditReport {
  verdict: AuditVerdict;
  findings: AuditFinding[];
  /** Approved-vocabulary terms found (informational). */
  approvedFound: string[];
  /** When fiduciaryCritical is true and no approved term is found, this is set. */
  fiduciaryCriticalGap: boolean;
}

const BANNED: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bvendor(s)?\b/gi, reason: 'Stewardly is a steward, not a vendor.' },
  { pattern: /\bsubscriber(s)?\b/gi, reason: 'Stewardly customers are clients, not subscribers.' },
  { pattern: /\bsubscription(s)?\b/gi, reason: 'Use "stewardship engagement" instead of "subscription".' },
  { pattern: /\bAI assistant(s)?\b/gi, reason: 'Use "Stewardly engine surface" instead of "AI assistant".' },
  { pattern: /\bchatbot(s)?\b/gi, reason: 'Use "conversational surface" instead of "chatbot".' },
  { pattern: /\brobo[- ]advisor(s)?\b/gi, reason: 'Use "automated stewardship surface" instead of "robo-advisor".' },
];

const CONTEXT_WARN: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\bagent(s)?\b/gi, reason: 'Confirm "agent" refers to the technical engine agent, not customer-facing terminology.' },
];

const APPROVED_VOCAB: RegExp[] = [
  /\bsteward(s|ship)?\b/gi,
  /\bfiduciary\b/gi,
  /\bbest interest(s)?\b/gi,
  /\bclient[- ]first\b/gi,
  /\bdisclosure(s)?\b/gi,
];

/**
 * Run the audit on a string. When `fiduciaryCritical` is true (e.g.,
 * the copy is Tier-3 advice or counsel-gated marketing), the audit
 * additionally requires at least one approved-vocabulary term to be
 * present.
 */
export function auditCopy(text: string, fiduciaryCritical = false): AuditReport {
  const findings: AuditFinding[] = [];

  for (const rule of BANNED) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      findings.push({ term: m[0], index: m.index, reason: rule.reason, severity: "block" });
    }
  }

  for (const rule of CONTEXT_WARN) {
    rule.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.pattern.exec(text)) !== null) {
      findings.push({ term: m[0], index: m.index, reason: rule.reason, severity: "warn" });
    }
  }

  const approvedFound: string[] = [];
  for (const r of APPROVED_VOCAB) {
    r.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      approvedFound.push(m[0].toLowerCase());
    }
  }

  const hasBlock = findings.some((f) => f.severity === "block");
  const hasWarn = findings.some((f) => f.severity === "warn");
  const fiduciaryCriticalGap = fiduciaryCritical && approvedFound.length === 0;

  let verdict: AuditVerdict;
  if (hasBlock || fiduciaryCriticalGap) verdict = "flagged";
  else if (hasWarn) verdict = "context-warning";
  else verdict = "aligned";

  return {
    verdict,
    findings,
    approvedFound: Array.from(new Set(approvedFound)),
    fiduciaryCriticalGap,
  };
}

/**
 * Convenience: enforce a "must be aligned" contract — throws if the
 * copy contains any block-severity finding or, when fiduciary-critical,
 * fails the approved-vocab requirement.
 */
export class LanguageAuditFailure extends Error {
  readonly code = "LANGUAGE_AUDIT_FAILED";
  constructor(public readonly report: AuditReport) {
    super(
      `Language audit failed: ${report.findings
        .filter((f) => f.severity === "block")
        .map((f) => `"${f.term}" — ${f.reason}`)
        .join("; ") || "fiduciary-critical copy missing approved vocabulary"}`,
    );
    this.name = "LanguageAuditFailure";
  }
}

export function assertAlignedCopy(text: string, fiduciaryCritical = false): AuditReport {
  const r = auditCopy(text, fiduciaryCritical);
  if (r.verdict === "flagged") throw new LanguageAuditFailure(r);
  return r;
}
