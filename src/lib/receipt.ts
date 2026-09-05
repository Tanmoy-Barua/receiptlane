import type { ReceiptPrefix } from "./types";

export const RECEIPT_PREFIXES: Record<
  ReceiptPrefix,
  { name: string; region: string }
> = {
  EAC: { name: "Vermont Service Center", region: "East" },
  VSC: { name: "Vermont Service Center", region: "East" },
  WAC: { name: "California Service Center", region: "West" },
  CSC: { name: "California Service Center", region: "West" },
  LIN: { name: "Nebraska Service Center", region: "Midwest" },
  NSC: { name: "Nebraska Service Center", region: "Midwest" },
  SRC: { name: "Texas Service Center", region: "South" },
  TSC: { name: "Texas Service Center", region: "South" },
  MSC: { name: "National Benefits Center", region: "National" },
  NBC: { name: "National Benefits Center", region: "National" },
  IOE: { name: "ELIS / Online Filing", region: "Electronic" },
  YSC: { name: "Potomac Service Center", region: "East" },
};

const PREFIX_PATTERN = Object.keys(RECEIPT_PREFIXES).join("|");
export const RECEIPT_REGEX = new RegExp(`^(${PREFIX_PATTERN})\\d{10}$`, "i");

export function normalizeReceipt(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function isValidReceipt(input: string): boolean {
  return RECEIPT_REGEX.test(normalizeReceipt(input));
}

export function parseReceipt(input: string): {
  receiptNumber: string;
  prefix: ReceiptPrefix;
  digits: string;
} | null {
  const receiptNumber = normalizeReceipt(input);
  if (!RECEIPT_REGEX.test(receiptNumber)) return null;
  const prefix = receiptNumber.slice(0, 3) as ReceiptPrefix;
  const digits = receiptNumber.slice(3);
  return { receiptNumber, prefix, digits };
}

export function getServiceCenter(prefix: string) {
  const info = RECEIPT_PREFIXES[prefix.toUpperCase() as ReceiptPrefix];
  return {
    code: prefix.toUpperCase(),
    name: info?.name ?? "Unknown Service Center",
  };
}

/** Extract fiscal year hint from digits when possible (positions vary by era). */
export function inferFiscalYear(digits: string): number | null {
  const yy = Number(digits.slice(0, 2));
  if (Number.isNaN(yy)) return null;
  // Receipt years commonly encode FY as two digits (e.g. 25 => FY2025)
  if (yy >= 90) return 1900 + yy;
  if (yy >= 0 && yy <= 40) return 2000 + yy;
  return 2000 + yy;
}
