"use client";

import { CATEGORY_LABELS, CATEGORY_TONES } from "@/lib/status";
import { stripHtml } from "@/lib/text";
import type { CaseStatus, HistoricalStatus } from "@/lib/types";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const iso = value.length >= 10 ? value.slice(0, 10) : value;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CaseResult({
  caseStatus,
  mode,
  onTrack,
  alreadyTracked,
}: {
  caseStatus: CaseStatus;
  mode: "live" | "demo";
  onTrack: () => void;
  alreadyTracked: boolean;
}) {
  const tone = CATEGORY_TONES[caseStatus.category];
  const description = stripHtml(caseStatus.description);

  return (
    <section className="result-panel animate-rise" aria-live="polite">
      <div className="result-header">
        <p className="eyebrow">Current status</p>
        <div className={`status-chip ${tone.bg} ${tone.text} ring-1 ${tone.ring}`}>
          <span className={`status-dot ${tone.bar}`} />
          {CATEGORY_LABELS[caseStatus.category]}
        </div>
      </div>
      <h2 className="result-status">{stripHtml(caseStatus.status)}</h2>
      <p className="result-desc">{description}</p>

      <dl className="meta-grid">
        <div>
          <dt>Receipt</dt>
          <dd className="mono">{caseStatus.receiptNumber}</dd>
        </div>
        <div>
          <dt>Form</dt>
          <dd>{caseStatus.formType ?? "—"}</dd>
        </div>
        <div>
          <dt>Service center</dt>
          <dd>
            {caseStatus.serviceCenter.code} · {caseStatus.serviceCenter.name}
          </dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDate(caseStatus.submittedDate)}</dd>
        </div>
        <div>
          <dt>Last update</dt>
          <dd>{formatDate(caseStatus.modifiedDate)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{mode === "live" ? "USCIS API (live)" : "Demo mode"}</dd>
        </div>
      </dl>

      <div className="result-actions">
        <button type="button" className="btn-primary" onClick={onTrack}>
          {alreadyTracked ? "SYNC TRACKER" : "SAVE TO TRACKER"}
        </button>
        <a
          className="btn-ghost"
          href={`https://egov.uscis.gov/`}
          target="_blank"
          rel="noreferrer"
        >
          OPEN EGOV.USCIS.GOV
        </a>
      </div>

      <StatusTimeline items={caseStatus.historicalCaseStatuses} />
    </section>
  );
}

function StatusTimeline({ items }: { items: HistoricalStatus[] }) {
  if (!items.length) return null;
  const ordered = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="timeline">
      <h3>Case timeline</h3>
      <ol>
        {ordered.map((item, idx) => (
          <li key={`${item.date}-${item.status}-${idx}`}>
            <div className="timeline-rail" aria-hidden />
            <div className="timeline-body">
              <p className="timeline-date">{formatDate(item.date)}</p>
              <p className="timeline-status">{stripHtml(item.status)}</p>
              <p className="timeline-desc">{stripHtml(item.description)}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
