import { buildDemoCaseStatus } from "./demo-cases";
import { categorizeStatus } from "./status";
import { getServiceCenter, isValidReceipt, normalizeReceipt, parseReceipt } from "./receipt";
import type { CaseStatus, HistoricalStatus } from "./types";

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

function getConfig() {
  const clientId = process.env.USCIS_CLIENT_ID?.trim();
  const clientSecret = process.env.USCIS_CLIENT_SECRET?.trim();
  const tokenUrl =
    process.env.USCIS_TOKEN_URL?.trim() ||
    "https://api-int.uscis.gov/oauth/accesstoken";
  const caseStatusBase =
    process.env.USCIS_CASE_STATUS_URL?.trim() ||
    "https://api-int.uscis.gov/case-status";
  const forceDemo = process.env.USCIS_FORCE_DEMO === "1";

  return {
    clientId,
    clientSecret,
    tokenUrl,
    caseStatusBase,
    forceDemo,
    hasCredentials: Boolean(clientId && clientSecret) && !forceDemo,
  };
}

export function getUscisMode(): "live" | "demo" {
  return getConfig().hasCredentials ? "live" : "demo";
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret, tokenUrl } = getConfig();
  if (!clientId || !clientSecret) {
    throw new Error("USCIS credentials are not configured");
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token request failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: string | number;
  };

  if (!data.access_token) {
    throw new Error("Token response missing access_token");
  }

  const expiresIn = Number(data.expires_in ?? 1800);
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return data.access_token;
}

function mapHistorical(
  hist: unknown
): HistoricalStatus[] {
  if (!Array.isArray(hist)) return [];
  return hist.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      status: String(row.status ?? row.current_case_status_text_en ?? "Update"),
      date: String(row.date ?? row.modifiedDate ?? "").slice(0, 10),
      description: String(
        row.description ?? row.current_case_status_desc_en ?? row.status ?? ""
      ),
      descriptionEs:
        row.descriptionEsDesc || row.current_case_status_desc_es
          ? String(row.descriptionEsDesc ?? row.current_case_status_desc_es)
          : undefined,
    };
  });
}

function normalizeLivePayload(
  receiptNumber: string,
  payload: Record<string, unknown>
): CaseStatus {
  const nested =
    (payload.case_status as Record<string, unknown> | undefined) ?? payload;
  const status = String(
    nested.current_case_status_text_en ??
      nested.status ??
      nested.currentStatus ??
      "Unknown status"
  );
  const description = String(
    nested.current_case_status_desc_en ??
      nested.description ??
      nested.details ??
      status
  );
  const formType = nested.formType
    ? String(nested.formType)
    : nested.form_type
      ? String(nested.form_type)
      : null;
  const submittedDate = nested.submittedDate
    ? String(nested.submittedDate).slice(0, 10)
    : null;
  const modifiedDate = nested.modifiedDate
    ? String(nested.modifiedDate).slice(0, 10)
    : null;
  const historical =
    mapHistorical(nested.hist_case_status) ||
    mapHistorical(nested.historicalCaseStatuses);

  const parsed = parseReceipt(receiptNumber);
  return {
    receiptNumber,
    formType,
    submittedDate,
    modifiedDate,
    status,
    description,
    descriptionEs: nested.current_case_status_desc_es
      ? String(nested.current_case_status_desc_es)
      : nested.statusEsDesc
        ? String(nested.statusEsDesc)
        : null,
    historicalCaseStatuses: historical.length
      ? historical
      : [
          {
            status,
            date: modifiedDate ?? new Date().toISOString().slice(0, 10),
            description,
          },
        ],
    serviceCenter: getServiceCenter(parsed?.prefix ?? receiptNumber.slice(0, 3)),
    category: categorizeStatus(status),
    source: "live",
    fetchedAt: new Date().toISOString(),
  };
}

export type LookupOutcome =
  | { ok: true; caseStatus: CaseStatus; mode: "live" | "demo" }
  | {
      ok: false;
      code:
        | "INVALID_FORMAT"
        | "NOT_FOUND"
        | "UNAUTHORIZED"
        | "RATE_LIMIT"
        | "UPSTREAM"
        | "CONFIG";
      error: string;
    };

export async function lookupCaseStatus(rawReceipt: string): Promise<LookupOutcome> {
  const receiptNumber = normalizeReceipt(rawReceipt);
  if (!isValidReceipt(receiptNumber)) {
    return {
      ok: false,
      code: "INVALID_FORMAT",
      error:
        "Receipt numbers are 13 characters: a 3-letter service center code plus 10 digits (for example IOE1234567890).",
    };
  }

  const config = getConfig();

  if (!config.hasCredentials) {
    const demo = buildDemoCaseStatus(receiptNumber);
    if (!demo) {
      return {
        ok: false,
        code: "INVALID_FORMAT",
        error: "Could not parse receipt number.",
      };
    }
    return { ok: true, caseStatus: demo, mode: "demo" };
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${config.caseStatusBase}/${receiptNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      return {
        ok: false,
        code: "NOT_FOUND",
        error: "Receipt number was not found in the USCIS system.",
      };
    }
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        code: "UNAUTHORIZED",
        error: "USCIS API rejected the access token. Check client credentials.",
      };
    }
    if (res.status === 429) {
      return {
        ok: false,
        code: "RATE_LIMIT",
        error: "USCIS rate limit reached. Try again later.",
      };
    }
    if (res.status === 422) {
      return {
        ok: false,
        code: "INVALID_FORMAT",
        error: "USCIS rejected the receipt number format.",
      };
    }
    if (!res.ok) {
      const text = await res.text();
      const lower = text.toLowerCase();
      if (
        res.status === 503 ||
        lower.includes("unavailable") ||
        lower.includes("normal operation hours")
      ) {
        return {
          ok: false,
          code: "UPSTREAM",
          error:
            "USCIS Case Status Sandbox is offline right now. It usually runs Monday–Friday, 7:00 AM–8:00 PM Eastern. Try again during those hours.",
        };
      }
      return {
        ok: false,
        code: "UPSTREAM",
        error: `USCIS API error (${res.status}): ${text.slice(0, 180)}`,
      };
    }

    const payload = (await res.json()) as Record<string, unknown>;
    return {
      ok: true,
      caseStatus: normalizeLivePayload(receiptNumber, payload),
      mode: "live",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown upstream error";
    return { ok: false, code: "UPSTREAM", error: message };
  }
}
