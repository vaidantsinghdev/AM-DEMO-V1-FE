// Quarter helpers — same calendar quarter for start/end_date.

export function quarterDates(qLabel /* "Q2-2026" */) {
  const m = String(qLabel).match(/^Q([1-4])-(\d{4})$/);
  if (!m) throw new Error(`Invalid quarter label: ${qLabel}`);
  const q = Number(m[1]);
  const y = Number(m[2]);
  const startMonth = (q - 1) * 3;
  const start = new Date(Date.UTC(y, startMonth, 1));
  const end = new Date(Date.UTC(y, startMonth + 3, 0));
  return {
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
  };
}

export function quarterFromDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  const m = d.getUTCMonth();
  const q = Math.floor(m / 3) + 1;
  return `Q${q}-${d.getUTCFullYear()}`;
}

// Suggest the next quarter to generate.
//  - no last report:  current calendar quarter
//  - has last report: quarter after the one containing last_report_at
export function nextQuarter(lastReportAt) {
  if (!lastReportAt) return quarterFromDate(null);
  const d = new Date(lastReportAt);
  const m = d.getUTCMonth();
  const q = Math.floor(m / 3) + 1;
  const nextQ = (q % 4) + 1;
  const year = d.getUTCFullYear() + (q === 4 ? 1 : 0);
  return `Q${nextQ}-${year}`;
}

export function listRecentQuarters(count = 8) {
  const out = [];
  const now = new Date();
  let m = now.getUTCMonth();
  let y = now.getUTCFullYear();
  let q = Math.floor(m / 3) + 1;
  // start from next quarter and walk backwards
  // include next quarter at top, then current, then previous N
  let nq = (q % 4) + 1;
  let ny = y + (q === 4 ? 1 : 0);
  out.push(`Q${nq}-${ny}`);
  for (let i = 0; i < count; i++) {
    out.push(`Q${q}-${y}`);
    q -= 1;
    if (q === 0) {
      q = 4;
      y -= 1;
    }
  }
  return out;
}
