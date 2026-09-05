import { categorizeStatus } from "./status";
import { getServiceCenter, parseReceipt } from "./receipt";
import type { CaseStatus, HistoricalStatus } from "./types";

const FORM_BY_PREFIX_BUCKET: string[][] = [
  ["I-130", "I-485", "I-765"],
  ["I-129", "I-140", "I-539"],
  ["N-400", "I-90", "I-751"],
  ["I-131", "I-821D", "I-730"],
];

function hashDigits(digits: string): number {
  let h = 0;
  for (let i = 0; i < digits.length; i++) {
    h = (h * 31 + digits.charCodeAt(i)) >>> 0;
  }
  return h;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function pickForm(hash: number): string {
  const bucket = FORM_BY_PREFIX_BUCKET[hash % FORM_BY_PREFIX_BUCKET.length];
  return bucket[hash % bucket.length];
}

type Scenario = {
  status: string;
  description: (receipt: string, form: string, date: string) => string;
  historyBuilder: (receipt: string, form: string) => HistoricalStatus[];
};

const SCENARIOS: Scenario[] = [
  {
    status: "Case Was Received",
    description: (receipt, form, date) =>
      `On ${formatLong(date)}, we received your Form ${form}, Receipt Number ${receipt}, and sent you a receipt notice. We will mail you a decision or notice if we need something from you.`,
    historyBuilder: (receipt, form) => [
      {
        status: "Case Was Received",
        date: daysAgo(18),
        description: `On ${formatLong(daysAgo(18))}, we received your Form ${form}, Receipt Number ${receipt}.`,
      },
    ],
  },
  {
    status: "Case Is Being Actively Reviewed by USCIS",
    description: (receipt, form, date) =>
      `On ${formatLong(date)}, we are actively reviewing your Form ${form}, Receipt Number ${receipt}. Our records show nothing is outstanding at this time. You will be notified by mail if we need anything.`,
    historyBuilder: (receipt, form) => [
      {
        status: "Case Was Received",
        date: daysAgo(140),
        description: `On ${formatLong(daysAgo(140))}, we received your Form ${form}, Receipt Number ${receipt}.`,
      },
      {
        status: "Case Is Being Actively Reviewed by USCIS",
        date: daysAgo(12),
        description: `On ${formatLong(daysAgo(12))}, we began actively reviewing your Form ${form}.`,
      },
    ],
  },
  {
    status: "Request for Evidence Was Sent",
    description: (receipt, form, date) =>
      `On ${formatLong(date)}, we sent a request for additional evidence for your Form ${form}, Receipt Number ${receipt}. Please follow the instructions in the notice so we can continue processing your case.`,
    historyBuilder: (receipt, form) => [
      {
        status: "Case Was Received",
        date: daysAgo(200),
        description: `On ${formatLong(daysAgo(200))}, we received your Form ${form}, Receipt Number ${receipt}.`,
      },
      {
        status: "Case Is Being Actively Reviewed by USCIS",
        date: daysAgo(60),
        description: `On ${formatLong(daysAgo(60))}, we began actively reviewing your Form ${form}.`,
      },
      {
        status: "Request for Evidence Was Sent",
        date: daysAgo(8),
        description: `On ${formatLong(daysAgo(8))}, we mailed a request for evidence for Receipt Number ${receipt}.`,
      },
    ],
  },
  {
    status: "Interview Was Scheduled",
    description: (receipt, form, date) =>
      `On ${formatLong(date)}, we scheduled an interview for your Form ${form}, Receipt Number ${receipt}. Please appear at the date, time, and location listed on your appointment notice.`,
    historyBuilder: (receipt, form) => [
      {
        status: "Case Was Received",
        date: daysAgo(260),
        description: `On ${formatLong(daysAgo(260))}, we received your Form ${form}, Receipt Number ${receipt}.`,
      },
      {
        status: "Fingerprint Fee Was Received",
        date: daysAgo(220),
        description: `On ${formatLong(daysAgo(220))}, we received your biometrics fee for Receipt Number ${receipt}.`,
      },
      {
        status: "Interview Was Scheduled",
        date: daysAgo(21),
        description: `On ${formatLong(daysAgo(21))}, we scheduled an interview for your Form ${form}.`,
      },
    ],
  },
  {
    status: "Case Was Approved",
    description: (receipt, form, date) =>
      `On ${formatLong(date)}, we approved your Form ${form}, Receipt Number ${receipt}. We mailed you a notice explaining the next steps. If you move, update your address at www.uscis.gov/addresschange.`,
    historyBuilder: (receipt, form) => [
      {
        status: "Case Was Received",
        date: daysAgo(320),
        description: `On ${formatLong(daysAgo(320))}, we received your Form ${form}, Receipt Number ${receipt}.`,
      },
      {
        status: "Case Is Being Actively Reviewed by USCIS",
        date: daysAgo(90),
        description: `On ${formatLong(daysAgo(90))}, we were actively reviewing your Form ${form}.`,
      },
      {
        status: "Case Was Approved",
        date: daysAgo(5),
        description: `On ${formatLong(daysAgo(5))}, we approved your Form ${form}, Receipt Number ${receipt}.`,
      },
    ],
  },
  {
    status: "Card Was Mailed To Me",
    description: (receipt, form, date) =>
      `On ${formatLong(date)}, we mailed your card for Form ${form}, Receipt Number ${receipt}, to the address you provided. Allow time for USPS delivery. Track delivery updates with the notice we sent.`,
    historyBuilder: (receipt, form) => [
      {
        status: "Case Was Received",
        date: daysAgo(280),
        description: `On ${formatLong(daysAgo(280))}, we received your Form ${form}, Receipt Number ${receipt}.`,
      },
      {
        status: "Case Was Approved",
        date: daysAgo(30),
        description: `On ${formatLong(daysAgo(30))}, we approved your Form ${form}.`,
      },
      {
        status: "Card Was Produced",
        date: daysAgo(14),
        description: `On ${formatLong(daysAgo(14))}, we produced your card.`,
      },
      {
        status: "Card Was Mailed To Me",
        date: daysAgo(3),
        description: `On ${formatLong(daysAgo(3))}, we mailed your card.`,
      },
    ],
  },
];

function formatLong(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Sandbox-style fixed samples that mirror USCIS Torch API examples. */
const FIXED_SAMPLES: Record<string, Omit<CaseStatus, "fetchedAt" | "source" | "category" | "serviceCenter">> = {
  EAC9999103402: {
    receiptNumber: "EAC9999103402",
    formType: "I-130",
    submittedDate: "2023-09-05",
    modifiedDate: "2023-09-05",
    status: "Case Approval Was Affirmed",
    description:
      "The approval of your case, Receipt Number EAC9999103402, was affirmed and your case is in final review. You will be notified by mail when we have completed working on your case.",
    descriptionEs:
      "Se ratificó la aprobación del caso para su Número de Recibo EAC9999103402, y se encuentra en la instancia final de revisión.",
    historicalCaseStatuses: [
      {
        status: "Case Was Received",
        date: "2023-03-20",
        description: "On March 20, 2023, we received your case.",
      },
      {
        status: "Case Is Being Actively Reviewed by USCIS",
        date: "2023-09-15",
        description: "On September 15, 2023, we are actively reviewing your case.",
      },
      {
        status: "Case Approval Was Affirmed",
        date: "2023-09-05",
        description:
          "The approval of your case, Receipt Number EAC9999103402, was affirmed.",
      },
    ],
  },
  LIN9912345678: {
    receiptNumber: "LIN9912345678",
    formType: "I-485",
    submittedDate: "2024-01-12",
    modifiedDate: "2025-11-02",
    status: "Case Is Being Actively Reviewed by USCIS",
    description:
      "On November 2, 2025, we are actively reviewing your Form I-485, Application to Register Permanent Residence or Adjust Status, Receipt Number LIN9912345678.",
    historicalCaseStatuses: [
      {
        status: "Case Was Received",
        date: "2024-01-18",
        description: "On January 18, 2024, we received your Form I-485.",
      },
      {
        status: "Fingerprint Fee Was Received",
        date: "2024-02-03",
        description: "On February 3, 2024, we received your biometrics fee.",
      },
      {
        status: "Case Is Being Actively Reviewed by USCIS",
        date: "2025-11-02",
        description: "On November 2, 2025, we are actively reviewing your case.",
      },
    ],
  },
  IOE0912345678: {
    receiptNumber: "IOE0912345678",
    formType: "I-765",
    submittedDate: "2025-04-01",
    modifiedDate: "2025-08-19",
    status: "Case Was Approved",
    description:
      "On August 19, 2025, we approved your Form I-765, Application for Employment Authorization, Receipt Number IOE0912345678.",
    historicalCaseStatuses: [
      {
        status: "Case Was Received",
        date: "2025-04-02",
        description: "On April 2, 2025, we received your Form I-765.",
      },
      {
        status: "Case Was Approved",
        date: "2025-08-19",
        description: "On August 19, 2025, we approved your Form I-765.",
      },
    ],
  },
};

export function buildDemoCaseStatus(rawReceipt: string): CaseStatus | null {
  const parsed = parseReceipt(rawReceipt);
  if (!parsed) return null;

  const fixed = FIXED_SAMPLES[parsed.receiptNumber];
  if (fixed) {
    return {
      ...fixed,
      serviceCenter: getServiceCenter(parsed.prefix),
      category: categorizeStatus(fixed.status),
      source: "demo",
      fetchedAt: new Date().toISOString(),
    };
  }

  const hash = hashDigits(parsed.digits);
  const scenario = SCENARIOS[hash % SCENARIOS.length];
  const formType = pickForm(hash);
  const modifiedDate = scenario.historyBuilder(parsed.receiptNumber, formType).at(-1)?.date ?? daysAgo(1);
  const submittedDate = scenario.historyBuilder(parsed.receiptNumber, formType)[0]?.date ?? daysAgo(30);
  const history = scenario.historyBuilder(parsed.receiptNumber, formType);
  const status = scenario.status;
  const description = scenario.description(parsed.receiptNumber, formType, modifiedDate);

  return {
    receiptNumber: parsed.receiptNumber,
    formType,
    submittedDate,
    modifiedDate,
    status,
    description,
    descriptionEs: null,
    historicalCaseStatuses: history,
    serviceCenter: getServiceCenter(parsed.prefix),
    category: categorizeStatus(status),
    source: "demo",
    fetchedAt: new Date().toISOString(),
  };
}

export const DEMO_RECEIPTS = Object.keys(FIXED_SAMPLES);
