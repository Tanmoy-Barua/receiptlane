export type ReceiptPrefix =
  | "EAC"
  | "WAC"
  | "LIN"
  | "SRC"
  | "MSC"
  | "NBC"
  | "IOE"
  | "YSC"
  | "VSC"
  | "TSC"
  | "CSC"
  | "NSC";

export type CaseStatusCategory =
  | "received"
  | "in_progress"
  | "action_required"
  | "interview"
  | "approved"
  | "denied"
  | "closed"
  | "unknown";

export interface HistoricalStatus {
  status: string;
  date: string;
  description: string;
  descriptionEs?: string;
}

export interface CaseStatus {
  receiptNumber: string;
  formType: string | null;
  submittedDate: string | null;
  modifiedDate: string | null;
  status: string;
  description: string;
  descriptionEs?: string | null;
  historicalCaseStatuses: HistoricalStatus[];
  serviceCenter: {
    code: string;
    name: string;
  };
  category: CaseStatusCategory;
  source: "live" | "demo";
  fetchedAt: string;
}

export interface TrackedCase {
  receiptNumber: string;
  nickname: string;
  addedAt: string;
  lastCheckedAt: string | null;
  lastStatus: string | null;
  lastFormType: string | null;
  lastCategory: CaseStatusCategory | null;
  history: Array<{
    checkedAt: string;
    status: string;
    description: string;
    category: CaseStatusCategory;
  }>;
}

export interface CaseStatusApiResponse {
  ok: true;
  caseStatus: CaseStatus;
  mode: "live" | "demo";
}

export interface CaseStatusApiError {
  ok: false;
  error: string;
  code:
    | "INVALID_FORMAT"
    | "NOT_FOUND"
    | "UNAUTHORIZED"
    | "RATE_LIMIT"
    | "UPSTREAM"
    | "CONFIG";
}

export type CaseLookupResult = CaseStatusApiResponse | CaseStatusApiError;
