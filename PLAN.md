# ReceiptLane build plan

## Goal
Ship a production-ready web app that tracks **any USCIS case type** from a 13-character receipt number.

## Constraints
- Official Case Status API requires OAuth client credentials from developer.uscis.gov.
- Public egov.uscis.gov is behind Cloudflare and is not a reliable scrape target.
- my.uscis.gov internal JSON APIs require a logged-in session and mainly cover IOE.

## Architecture
1. **Next.js App Router UI** — receipt lookup, multi-case portfolio, timeline.
2. **API route `/api/case-status`** — validates receipt, calls USCIS when configured, otherwise demo.
3. **Browser localStorage** — tracked cases + local change history (no account required).
4. **Env-based live mode** — `USCIS_CLIENT_ID` / `USCIS_CLIENT_SECRET`.

## Receipt coverage
EAC/VSC, WAC/CSC, LIN/NSC, SRC/TSC, MSC/NBC, IOE, YSC.

## Delivery slices
1. Scaffold + design system
2. Receipt validation + demo/live client
3. Tracker UI + local persistence
4. Docs, build verification, sample lookups
