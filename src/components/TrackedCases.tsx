"use client";

import { CATEGORY_LABELS, CATEGORY_TONES } from "@/lib/status";
import type { TrackedCase } from "@/lib/types";

export function TrackedCases({
  cases,
  hydrated,
  busyReceipt,
  onRefresh,
  onRemove,
  onSelect,
}: {
  cases: TrackedCase[];
  hydrated: boolean;
  busyReceipt: string | null;
  onRefresh: (receipt: string) => void;
  onRemove: (receipt: string) => void;
  onSelect: (receipt: string) => void;
}) {
  if (!hydrated) {
    return (
      <section className="tracked-panel">
        <h2>Your tracked cases</h2>
        <p className="muted">Loading saved cases…</p>
      </section>
    );
  }

  return (
    <section className="tracked-panel" id="tracked">
      <div className="tracked-head">
        <div>
          <h2>Your tracked cases</h2>
          <p className="muted">
            Stored only in this browser. Refresh anytime to check for updates.
          </p>
        </div>
        <span className="count-pill">{cases.length} saved</span>
      </div>

      {cases.length === 0 ? (
        <p className="empty-state">
          No cases saved yet. Look up a receipt number above, then save it here.
        </p>
      ) : (
        <ul className="tracked-list">
          {cases.map((item) => {
            const tone = item.lastCategory
              ? CATEGORY_TONES[item.lastCategory]
              : CATEGORY_TONES.unknown;
            return (
              <li key={item.receiptNumber} className="tracked-item">
                <button
                  type="button"
                  className="tracked-main"
                  onClick={() => onSelect(item.receiptNumber)}
                >
                  <div className="tracked-title-row">
                    <strong>{item.nickname}</strong>
                    {item.lastCategory ? (
                      <span
                        className={`mini-chip ${tone.bg} ${tone.text} ring-1 ${tone.ring}`}
                      >
                        {CATEGORY_LABELS[item.lastCategory]}
                      </span>
                    ) : null}
                  </div>
                  <p className="mono tracked-receipt">{item.receiptNumber}</p>
                  <p className="tracked-status">
                    {item.lastStatus ?? "Not checked yet"}
                  </p>
                  <p className="tracked-meta">
                    {item.lastFormType ? `${item.lastFormType} · ` : ""}
                    {item.lastCheckedAt
                      ? `Checked ${new Date(item.lastCheckedAt).toLocaleString()}`
                      : "Never checked"}
                  </p>
                </button>
                <div className="tracked-actions">
                  <button
                    type="button"
                    className="btn-small"
                    disabled={busyReceipt === item.receiptNumber}
                    onClick={() => onRefresh(item.receiptNumber)}
                  >
                    {busyReceipt === item.receiptNumber ? "Checking…" : "Refresh"}
                  </button>
                  <button
                    type="button"
                    className="btn-small danger"
                    onClick={() => onRemove(item.receiptNumber)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
