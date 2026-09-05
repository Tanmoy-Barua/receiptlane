"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { CaseResult } from "@/components/CaseResult";
import { TrackedCases } from "@/components/TrackedCases";
import { DEMO_RECEIPTS } from "@/lib/demo-cases";
import { RECEIPT_PREFIXES, isValidReceipt, normalizeReceipt } from "@/lib/receipt";
import type { CaseLookupResult, CaseStatus } from "@/lib/types";
import { useTrackedCases } from "@/lib/use-tracked-cases";

export function TrackerApp() {
  const [receipt, setReceipt] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CaseStatus | null>(null);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [busyReceipt, setBusyReceipt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { cases, hydrated, upsertFromLookup, remove } = useTrackedCases();

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: { mode?: "live" | "demo" }) => {
        if (data.mode) setMode(data.mode);
      })
      .catch(() => undefined);
  }, []);

  const alreadyTracked = useMemo(() => {
    if (!result) return false;
    return cases.some((c) => c.receiptNumber === result.receiptNumber);
  }, [cases, result]);

  async function lookup(raw: string) {
    const normalized = normalizeReceipt(raw);
    setError(null);
    setBusyReceipt(normalized);

    if (!isValidReceipt(normalized)) {
      setBusyReceipt(null);
      setError(
        "Enter a valid 13-character receipt number (3 letters + 10 digits)."
      );
      return;
    }

    try {
      const res = await fetch("/api/case-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: normalized }),
      });
      const data = (await res.json()) as CaseLookupResult;
      if (!data.ok) {
        setResult(null);
        setError(data.error);
        return;
      }
      setMode(data.mode);
      setResult(data.caseStatus);
      setReceipt(data.caseStatus.receiptNumber);
    } catch {
      setError("Could not reach the case status service. Try again.");
      setResult(null);
    } finally {
      setBusyReceipt(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    startTransition(() => {
      void lookup(receipt);
    });
  }

  function trackCurrent() {
    if (!result) return;
    upsertFromLookup({
      receiptNumber: result.receiptNumber,
      nickname: nickname || result.formType || undefined,
      status: result.status,
      description: result.description,
      formType: result.formType,
      category: result.category,
    });
  }

  async function refreshTracked(receiptNumber: string) {
    setError(null);
    setBusyReceipt(receiptNumber);
    try {
      const res = await fetch("/api/case-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipt: receiptNumber }),
      });
      const data = (await res.json()) as CaseLookupResult;
      if (!data.ok) {
        setError(data.error);
        return;
      }
      setMode(data.mode);
      setResult(data.caseStatus);
      setReceipt(data.caseStatus.receiptNumber);
      upsertFromLookup({
        receiptNumber: data.caseStatus.receiptNumber,
        status: data.caseStatus.status,
        description: data.caseStatus.description,
        formType: data.caseStatus.formType,
        category: data.caseStatus.category,
      });
    } catch {
      setError("Could not reach the case status service. Try again.");
    } finally {
      setBusyReceipt(null);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden>
            <span />
          </span>
          <div>
            <p className="brand-name">ReceiptLane</p>
            <p className="brand-tag">USCIS any-case tracker</p>
          </div>
        </div>
        <div className="header-meta">
          <span className={`mode-badge ${mode}`}>
            {mode === "live" ? "Live USCIS API" : "Demo mode"}
          </span>
          <a href="#tracked" className="header-link">
            Tracked cases
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="brand-kicker">ReceiptLane</p>
            <h1>
              Track any USCIS case
              <span> by receipt number.</span>
            </h1>
            <p className="hero-lede">
              Look up EAC, WAC, LIN, SRC, MSC, NBC, IOE, YSC, and more — save
              multiple cases, refresh status, and keep a local timeline.
            </p>
          </div>

          <form className="lookup-form" onSubmit={onSubmit}>
            <label htmlFor="receipt" className="sr-only">
              USCIS receipt number
            </label>
            <div className="lookup-row">
              <input
                id="receipt"
                name="receipt"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. IOE0912345678"
                value={receipt}
                onChange={(e) => setReceipt(normalizeReceipt(e.target.value))}
                maxLength={13}
                className="receipt-input"
              />
              <button
                type="submit"
                className="btn-primary lookup-btn"
                disabled={isPending || busyReceipt !== null}
              >
                {isPending || busyReceipt ? "Checking…" : "Check status"}
              </button>
            </div>
            <div className="nickname-row">
              <label htmlFor="nickname">Optional nickname</label>
              <input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="My I-485"
                maxLength={60}
              />
            </div>
            {error ? <p className="form-error">{error}</p> : null}
            <div className="sample-row">
              <span>Try a sample:</span>
              {DEMO_RECEIPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  className="sample-chip"
                  onClick={() => {
                    setReceipt(sample);
                    startTransition(() => {
                      void lookup(sample);
                    });
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
          </form>
        </section>

        {mode === "demo" ? (
          <p className="demo-banner animate-fade">
            Running in demo mode. Add{" "}
            <code>USCIS_CLIENT_ID</code> and <code>USCIS_CLIENT_SECRET</code> from{" "}
            <a
              href="https://developer.uscis.gov/"
              target="_blank"
              rel="noreferrer"
            >
              developer.uscis.gov
            </a>{" "}
            to query the official Case Status API. Any valid receipt format still
            returns a realistic demo response so you can exercise the tracker.
          </p>
        ) : null}

        {result ? (
          <CaseResult
            caseStatus={result}
            mode={mode}
            alreadyTracked={alreadyTracked}
            onTrack={trackCurrent}
          />
        ) : null}

        <TrackedCases
          cases={cases}
          hydrated={hydrated}
          busyReceipt={busyReceipt}
          onRefresh={(r) => {
            startTransition(() => {
              void refreshTracked(r);
            });
          }}
          onRemove={remove}
          onSelect={(r) => {
            setReceipt(r);
            startTransition(() => {
              void lookup(r);
            });
          }}
        />

        <section className="centers">
          <h2>Supported receipt types</h2>
          <p className="muted">
            Every common USCIS receipt prefix maps to a service center or filing
            channel.
          </p>
          <ul className="center-grid">
            {Object.entries(RECEIPT_PREFIXES).map(([code, info]) => (
              <li key={code}>
                <strong className="mono">{code}</strong>
                <span>{info.name}</span>
                <em>{info.region}</em>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          ReceiptLane is an independent case tracker helper. It is not affiliated
          with USCIS or DHS. Always rely on official notices and{" "}
          <a href="https://egov.uscis.gov/" target="_blank" rel="noreferrer">
            egov.uscis.gov
          </a>{" "}
          for authoritative status.
        </p>
      </footer>
    </div>
  );
}
