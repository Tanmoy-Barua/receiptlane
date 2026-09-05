# ReceiptLane — USCIS Any-Case Tracker

Track **any** USCIS case type by 13-character receipt number (EAC, WAC, LIN, SRC, MSC, NBC, IOE, YSC, and related prefixes).

## Plan

1. **Validate** receipt numbers (3-letter service center + 10 digits).
2. **Look up** status via the official USCIS Case Status API when OAuth credentials are configured.
3. **Fall back** to a realistic demo mode so the product works without credentials.
4. **Track** multiple cases in the browser (localStorage), with refresh + local change history.
5. **Present** form type, service center, status category, and a case timeline.

## Features

- Any common receipt prefix / case type
- Live USCIS Torch API integration (client credentials)
- Demo mode with sample receipts and deterministic statuses for any valid number
- Multi-case tracker saved only in your browser
- Status categories (received, in progress, RFE, interview, approved, denied…)
- Mobile-friendly UI

## Quick start

```bash
cd uscis-case-tracker
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Live API mode

1. Create an app at [developer.uscis.gov](https://developer.uscis.gov/).
2. Copy `.env.example` to `.env.local` and set:

```bash
USCIS_CLIENT_ID=your_client_id
USCIS_CLIENT_SECRET=your_client_secret
```

3. Restart the dev server. The header badge switches to **Live USCIS API**.

Sandbox token + case endpoints default to:

- `https://api-int.uscis.gov/oauth/accesstoken`
- `https://api-int.uscis.gov/case-status/{receiptNumber}`

## API

`POST /api/case-status`

```json
{ "receipt": "IOE0912345678" }
```

`GET /api/case-status?receipt=IOE0912345678`

`GET /api/health` — reports `live` or `demo` mode.

## Sample demo receipts

- `EAC9999103402`
- `LIN9912345678`
- `IOE0912345678`

## Disclaimer

ReceiptLane is independent and not affiliated with USCIS or DHS. Official notices and [egov.uscis.gov](https://egov.uscis.gov/) remain authoritative.
