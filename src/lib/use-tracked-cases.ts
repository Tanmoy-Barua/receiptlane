"use client";

import { useCallback, useEffect, useState } from "react";
import type { CaseStatusCategory, TrackedCase } from "@/lib/types";

const STORAGE_KEY = "receiptlane.tracked-cases.v1";

function readStorage(): TrackedCase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackedCase[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(cases: TrackedCase[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

export function useTrackedCases() {
  const [cases, setCases] = useState<TrackedCase[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCases(readStorage());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: TrackedCase[]) => {
    setCases(next);
    writeStorage(next);
  }, []);

  const upsertFromLookup = useCallback(
    (input: {
      receiptNumber: string;
      nickname?: string;
      status: string;
      description: string;
      formType: string | null;
      category: CaseStatusCategory;
    }) => {
      const existing = readStorage();
      const now = new Date().toISOString();
      const idx = existing.findIndex((c) => c.receiptNumber === input.receiptNumber);
      if (idx >= 0) {
        const prev = existing[idx];
        const changed = prev.lastStatus && prev.lastStatus !== input.status;
        const next: TrackedCase = {
          ...prev,
          nickname: input.nickname?.trim() || prev.nickname,
          lastCheckedAt: now,
          lastStatus: input.status,
          lastFormType: input.formType,
          lastCategory: input.category,
          history:
            changed || !prev.history.length
              ? [
                  {
                    checkedAt: now,
                    status: input.status,
                    description: input.description,
                    category: input.category,
                  },
                  ...prev.history,
                ].slice(0, 40)
              : prev.history,
        };
        const copy = [...existing];
        copy[idx] = next;
        persist(copy);
        return next;
      }

      const created: TrackedCase = {
        receiptNumber: input.receiptNumber,
        nickname: input.nickname?.trim() || input.formType || "Tracked case",
        addedAt: now,
        lastCheckedAt: now,
        lastStatus: input.status,
        lastFormType: input.formType,
        lastCategory: input.category,
        history: [
          {
            checkedAt: now,
            status: input.status,
            description: input.description,
            category: input.category,
          },
        ],
      };
      persist([created, ...existing]);
      return created;
    },
    [persist]
  );

  const rename = useCallback(
    (receiptNumber: string, nickname: string) => {
      persist(
        readStorage().map((c) =>
          c.receiptNumber === receiptNumber
            ? { ...c, nickname: nickname.trim() || c.nickname }
            : c
        )
      );
    },
    [persist]
  );

  const remove = useCallback(
    (receiptNumber: string) => {
      persist(readStorage().filter((c) => c.receiptNumber !== receiptNumber));
    },
    [persist]
  );

  return { cases, hydrated, upsertFromLookup, rename, remove };
}
