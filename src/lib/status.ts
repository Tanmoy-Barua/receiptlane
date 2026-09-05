import type { CaseStatusCategory } from "./types";

const RULES: Array<{ category: CaseStatusCategory; patterns: RegExp[] }> = [
  {
    category: "approved",
    patterns: [
      /approv/i,
      /card\s+was\s+mailed/i,
      /card\s+was\s+produced/i,
      /oath\s+ceremony/i,
      /naturalization\s+certificate/i,
      /affirm/i,
    ],
  },
  {
    category: "denied",
    patterns: [/deni/i, /reject/i, /abandon/i],
  },
  {
    category: "action_required",
    patterns: [
      /request\s+for\s+evidence/i,
      /\brfe\b/i,
      /intent\s+to\s+deny/i,
      /\bnoid\b/i,
      /fingerprint\s+fee/i,
      /resubmit/i,
      /additional\s+evidence/i,
    ],
  },
  {
    category: "interview",
    patterns: [/interview/i, /biometrics/i, /asc\s+appointment/i],
  },
  {
    category: "closed",
    patterns: [/withdrawn/i, /closed/i, /transferred\s+to\s+nvc/i, /administratively\s+closed/i],
  },
  {
    category: "received",
    patterns: [/was\s+received/i, /receipt\s+notice/i, /accepted/i],
  },
  {
    category: "in_progress",
    patterns: [
      /actively\s+review/i,
      /being\s+reviewed/i,
      /transferred/i,
      /updated/i,
      /continue\s+to\s+process/i,
      /new\s+card\s+is\s+being/i,
    ],
  },
];

export function categorizeStatus(status: string): CaseStatusCategory {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(status))) return rule.category;
  }
  return "unknown";
}

export const CATEGORY_LABELS: Record<CaseStatusCategory, string> = {
  received: "Received",
  in_progress: "In progress",
  action_required: "Action required",
  interview: "Interview / biometrics",
  approved: "Approved",
  denied: "Denied",
  closed: "Closed",
  unknown: "Status update",
};

export const CATEGORY_TONES: Record<
  CaseStatusCategory,
  { bg: string; text: string; ring: string; bar: string }
> = {
  received: {
    bg: "bg-sky-50",
    text: "text-sky-900",
    ring: "ring-sky-200",
    bar: "bg-sky-500",
  },
  in_progress: {
    bg: "bg-amber-50",
    text: "text-amber-950",
    ring: "ring-amber-200",
    bar: "bg-amber-500",
  },
  action_required: {
    bg: "bg-orange-50",
    text: "text-orange-950",
    ring: "ring-orange-200",
    bar: "bg-orange-500",
  },
  interview: {
    bg: "bg-violet-50",
    text: "text-violet-950",
    ring: "ring-violet-200",
    bar: "bg-violet-500",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-950",
    ring: "ring-emerald-200",
    bar: "bg-emerald-500",
  },
  denied: {
    bg: "bg-rose-50",
    text: "text-rose-950",
    ring: "ring-rose-200",
    bar: "bg-rose-500",
  },
  closed: {
    bg: "bg-slate-100",
    text: "text-slate-800",
    ring: "ring-slate-200",
    bar: "bg-slate-500",
  },
  unknown: {
    bg: "bg-teal-50",
    text: "text-teal-950",
    ring: "ring-teal-200",
    bar: "bg-teal-500",
  },
};
