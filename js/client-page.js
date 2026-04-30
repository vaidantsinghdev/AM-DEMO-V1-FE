// client.html?id=N — read-only profile view + report history.
// Edit/Archive route back to clients.html where the drawer lives.

import { api, BASE } from "./api.js";
import { byId, fmtDate, toast } from "./dom.js";
import { formatMoney, floatToCents } from "./money.js";


const params = new URLSearchParams(location.search);
const clientId = params.get("id");
if (!clientId) location.replace("clients.html");

const KIND_TITLES = {
  retirement: "Retirement",
  non_retirement: "Non-Retirement",
  trust: "Trust",
  liability: "Liability",
};
const LABEL_TITLES = {
  ira: "IRA",
  roth_ira: "Roth IRA",
  "401k": "401(k)",
  pension: "Pension",
  brokerage: "Brokerage",
  joint: "Joint",
  trust: "Trust",
  mortgage: "Mortgage",
  auto_loan: "Auto Loan",
};
const OWNER_TITLES = { client: "Client", spouse: "Spouse" };

function formatErr(e) {
  if (!e) return "Unknown error";
  if (e.detail) {
    if (typeof e.detail === "string") return e.detail;
    if (e.detail.detail) return typeof e.detail.detail === "string" ? e.detail.detail : JSON.stringify(e.detail.detail);
    return JSON.stringify(e.detail);
  }
  return e.message || String(e);
}

function escape(s) {
  return String(s ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

let currentClient = null;

async function load() {
  byId("loading-state").style.display = "";
  byId("content").style.display = "none";
  byId("error-state").style.display = "none";
  try {
    currentClient = await api(`/clients/${clientId}`);
    render(currentClient);
    byId("loading-state").style.display = "none";
    byId("content").style.display = "";
    loadHistory();
  } catch (e) {
    byId("loading-state").style.display = "none";
    byId("error-state").style.display = "";
    byId("error-state").textContent = `Failed to load client: ${formatErr(e)}`;
  }
}

function render(c) {
  byId("household-name").textContent = c.household_name;
  const names = [c.client?.first_name, c.client?.last_name].filter(Boolean).join(" ");
  const spouse = c.spouse ? ` & ${[c.spouse.first_name, c.spouse.last_name].filter(Boolean).join(" ")}` : "";
  byId("client-names").textContent = `${c.household_type === "married" ? "Married" : "Single"} household — ${names}${spouse}`;


  // People
  const peopleGrid = byId("people-grid");
  peopleGrid.innerHTML = "";
  peopleGrid.appendChild(personCard("Client 1", c.client));
  if (c.spouse) peopleGrid.appendChild(personCard("Client 2 (Spouse)", c.spouse));

  // Accounts (non-liability)
  const allAccounts = c.accounts || [];
  const accounts = allAccounts.filter((a) => a.kind !== "liability");
  const liabs = allAccounts.filter((a) => a.kind === "liability");

  byId("accounts-list").innerHTML = accounts.length
    ? accounts.map(accountCard).join("")
    : `<p class="muted">No accounts on file.</p>`;

  byId("liabilities-list").innerHTML = liabs.length
    ? liabs.map(accountCard).join("")
    : `<p class="muted">No liabilities on file.</p>`;

  // Static financials
  const sf = c.static_financials || {};
  byId("financials-grid").innerHTML = `
    <div><dt>Monthly Inflow</dt><dd>${formatMoney(floatToCents(sf.inflow_mo))}</dd></div>
    <div><dt>Monthly Outflow</dt><dd>${formatMoney(floatToCents(sf.outflow_mo))}</dd></div>
    <div><dt>Monthly Excess</dt><dd>${formatMoney(floatToCents(sf.inflow_mo) - floatToCents(sf.outflow_mo))}</dd></div>
    <div><dt>PR Target</dt><dd>${sf.pr_target != null ? formatMoney(floatToCents(sf.pr_target)) : "—"}</dd></div>
    <div><dt>Trust Address</dt><dd>${escape(sf.trust_address) || "—"}</dd></div>
  `;
}

function personCard(title, p) {
  const div = document.createElement("div");
  div.className = "info-card";
  div.innerHTML = `
    <h3>${escape(title)}</h3>
    <dl>
      <dt>Name</dt><dd>${escape(p.first_name)} ${escape(p.last_name)}</dd>
      <dt>DOB</dt><dd>${p.dob ? fmtDate(p.dob) : "—"}</dd>
      <dt>Age</dt><dd>${p.age ?? "—"}</dd>
      <dt>SSN Last 4</dt><dd>${p.ssn_last_4 != null ? `****${String(p.ssn_last_4).padStart(4, "0")}` : "—"}</dd>
    </dl>
  `;
  return div;
}

function accountCard(a) {
  const owner = a.owner ? OWNER_TITLES[a.owner] : "Joint";
  return `
    <div class="account-card">
      <div class="account-head">
        <strong>${escape(LABEL_TITLES[a.label] || a.label)}</strong>
        <span class="tag tag-soft">${escape(KIND_TITLES[a.kind] || a.kind)}</span>
      </div>
      <dl>
        <dt>Owner</dt><dd>${escape(owner)}</dd>
        <dt>Institution</dt><dd>${escape(a.institution) || "—"}</dd>
        ${a.last_4 != null ? `<dt>Last 4</dt><dd>${escape(a.last_4)}</dd>` : ""}
        ${a.interest_rate ? `<dt>Rate</dt><dd>${escape(a.interest_rate)}</dd>` : ""}
      </dl>
    </div>
  `;
}

async function loadHistory() {
  byId("reports-loading").style.display = "";
  byId("reports-empty").style.display = "none";
  byId("reports-table").style.display = "none";
  try {
    const reports = await api(`/clients/${clientId}/reports`);
    byId("reports-loading").style.display = "none";
    if (!reports || reports.length === 0) {
      byId("reports-empty").style.display = "";
      return;
    }
    const tbody = byId("reports-tbody");
    tbody.innerHTML = reports.map((r) => `
      <tr>
        <td><strong>${escape(r.period.label)}</strong><div class="muted small">${r.period.start_date} → ${r.period.end_date}</div></td>
        <td>${fmtDate(r.generated_at)}</td>
        <td class="downloads">
          <a class="btn-link btn-link-primary" href="${BASE}${r.pdf_links.sacs}" download>SACS PDF</a>
          <a class="btn-link btn-link-primary" href="${BASE}${r.pdf_links.tcc}" download>TCC PDF</a>
        </td>
      </tr>
    `).join("");
    byId("reports-table").style.display = "";

  } catch (e) {
    byId("reports-loading").textContent = `Failed to load history: ${formatErr(e)}`;
  }
}

byId("btn-edit").addEventListener("click", () => {
  location.href = `clients.html#edit=${clientId}`;
});

byId("btn-archive").addEventListener("click", async () => {
  if (!confirm("Archive this client? They will be hidden from the list.")) return;
  try {
    await api(`/clients/${clientId}`, { method: "DELETE" });
    toast("Client archived.");
    location.href = "clients.html";
  } catch (e) {
    toast(`Archive failed: ${formatErr(e)}`, "error");
  }
});

load();
