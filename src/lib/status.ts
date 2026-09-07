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
    bg: "bg-cyan-950",
    text: "text-cyan-300",
    ring: "ring-cyan-700",
    bar: "bg-cyan-400",
  },
  in_progress: {
    bg: "bg-yellow-950",
    text: "text-yellow-300",
    ring: "ring-yellow-700",
    bar: "bg-yellow-400",
  },
  action_required: {
    bg: "bg-orange-950",
    text: "text-orange-300",
    ring: "ring-orange-700",
    bar: "bg-orange-400",
  },
  interview: {
    bg: "bg-lime-950",
    text: "text-lime-300",
    ring: "ring-lime-700",
    bar: "bg-lime-400",
  },
  approved: {
    bg: "bg-emerald-950",
    text: "text-emerald-300",
    ring: "ring-emerald-600",
    bar: "bg-emerald-400",
  },
  denied: {
    bg: "bg-rose-950",
    text: "text-rose-300",
    ring: "ring-rose-700",
    bar: "bg-rose-400",
  },
  closed: {
    bg: "bg-zinc-900",
    text: "text-zinc-300",
    ring: "ring-zinc-600",
    bar: "bg-zinc-400",
  },
  unknown: {
    bg: "bg-green-950",
    text: "text-green-300",
    ring: "ring-green-700",
    bar: "bg-green-400",
  },
};
