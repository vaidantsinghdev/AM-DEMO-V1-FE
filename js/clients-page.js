// clients.html — list view + Add/Edit drawer + Generate Q… CTA.

import { api } from "./api.js";
import { byId, $$, fmtDate, toast } from "./dom.js";
import { nextQuarter } from "./quarters.js";

// ── Constants from API enum ────────────────────────────────────────────
const AccountKind = Object.freeze({
  RETIREMENT: "retirement",
  NON_RETIREMENT: "non_retirement",
  TRUST: "trust",
  LIABILITY: "liability",
});

const LABELS_BY_KIND = Object.freeze({
  retirement: ["ira", "roth_ira", "401k", "pension"],
  non_retirement: ["brokerage", "joint"],
  trust: ["trust"],
  liability: ["mortgage", "auto_loan"],
});

const LABEL_TITLES = Object.freeze({
  ira: "IRA",
  roth_ira: "Roth IRA",
  "401k": "401(k)",
  pension: "Pension",
  brokerage: "Brokerage",
  joint: "Joint",
  trust: "Trust",
  mortgage: "Mortgage",
  auto_loan: "Auto Loan",
});

const KIND_TITLES = Object.freeze({
  retirement: "Retirement",
  non_retirement: "Non-Retirement",
  trust: "Trust",
  liability: "Liability",
});

// ── Utils ──────────────────────────────────────────────────────────────
const calcAge = (dob) => {
  if (!dob) return "";
  const b = new Date(dob), t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age > 0 ? age : "";
};

const escape = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

// ── List rendering ─────────────────────────────────────────────────────
async function loadClients() {
  byId("loading-state").style.display = "";
  byId("empty-state").style.display = "none";
  byId("table-wrap").style.display = "none";
  try {
    const list = await api("/clients");
    renderClients(list);
  } catch (e) {
    byId("loading-state").textContent = `Failed to load clients: ${formatErr(e)}`;
  }
}

function renderClients(list) {
  byId("loading-state").style.display = "none";

  if (!list || list.length === 0) {
    byId("empty-state").style.display = "";
    byId("table-wrap").style.display = "none";
    return;
  }

  byId("empty-state").style.display = "none";
  byId("table-wrap").style.display = "";
  const tbody = byId("clients-tbody");
  tbody.innerHTML = "";

  for (const c of list) {
    const isMarried = c.household_type === "married";
    const nextQ = nextQuarter(c.last_report_at);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="client-name">
          <a href="client.html?id=${c.id}">${escape(c.household_name)}</a>
        </div>
      </td>
      <td><span class="tag ${isMarried ? "tag-married" : "tag-single"}">${isMarried ? "Married" : "Single"}</span></td>
      <td>${fmtDate(c.last_report_at)}</td>
      <td>
        <div class="table-actions">
          <button class="btn-link" data-action="edit" data-id="${c.id}">Edit</button>
          <button class="btn-danger" data-action="archive" data-id="${c.id}">Archive</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll('button[data-action="edit"]').forEach((b) =>
    b.addEventListener("click", () => openEdit(Number(b.dataset.id))),
  );
  tbody.querySelectorAll('button[data-action="archive"]').forEach((b) =>
    b.addEventListener("click", () => archiveClient(Number(b.dataset.id))),
  );
}

// ── Account rows in drawer ─────────────────────────────────────────────
let acctCount = 0;
let liabCount = 0;

function buildLabelOptions(kind) {
  const labels = LABELS_BY_KIND[kind] || [];
  return (
    `<option value="">Label…</option>` +
    labels.map((l) => `<option value="${escape(l)}">${escape(LABEL_TITLES[l] || l)}</option>`).join("")
  );
}

function addAccountRow(account = null) {
  acctCount++;
  const i = acctCount;
  const container = byId("accounts-list");
  const row = document.createElement("div");
  row.className = "account-row";
  row.dataset.i = i;

  const kindOptions = [AccountKind.RETIREMENT, AccountKind.NON_RETIREMENT, AccountKind.TRUST]
    .map((k) => `<option value="${k}">${KIND_TITLES[k]}</option>`)
    .join("");

  const initialKind = account?.kind ?? AccountKind.RETIREMENT;
  const labelOptions = buildLabelOptions(initialKind);

  row.innerHTML = `
    <div class="field">
      <select name="acct_owner_${i}">
        <option value="">— (joint)</option>
        <option value="client">Client</option>
        <option value="spouse">Spouse</option>
      </select>
    </div>
    <div class="field">
      <select name="acct_kind_${i}">${kindOptions}</select>
    </div>
    <div class="field">
      <input type="text" name="acct_institution_${i}" placeholder="Institution" />
    </div>
    <div class="field">
      <select name="acct_label_${i}">${labelOptions}</select>
    </div>
    <div class="field">
      <input type="text" name="acct_last4_${i}" placeholder="Last 4" maxlength="4" inputmode="numeric" />
    </div>
    <div class="field">
      <input type="text" name="acct_rate_${i}" placeholder="—" disabled />
    </div>
    <button class="remove-row-btn" type="button" aria-label="Remove">×</button>
  `;
  container.appendChild(row);

  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());

  const ownerEl = row.querySelector(`[name="acct_owner_${i}"]`);
  if (account?.owner != null) ownerEl.value = String(account.owner);

  const kindEl = row.querySelector(`[name="acct_kind_${i}"]`);
  const labelEl = row.querySelector(`[name="acct_label_${i}"]`);
  kindEl.value = initialKind;
  if (account?.label) {
    labelEl.value = account.label;
    if (labelEl.value !== account.label) {
      const opt = document.createElement("option");
      opt.value = account.label;
      opt.textContent = account.label;
      labelEl.appendChild(opt);
      labelEl.value = account.label;
    }
  }
  kindEl.addEventListener("change", () => {
    labelEl.innerHTML = buildLabelOptions(kindEl.value);
  });

  if (account) {
    const inst = row.querySelector(`[name="acct_institution_${i}"]`);
    if (account.institution) inst.value = account.institution;
    const last4 = row.querySelector(`[name="acct_last4_${i}"]`);
    if (account.last_4 != null) last4.value = String(account.last_4);
  }

  // Apply household-type owner constraints
  applyOwnerConstraints(row);
}

function applyOwnerConstraints(row) {
  const isMarried = getType() === "married";
  const ownerEl = row.querySelector('select[name^="acct_owner_"]');
  if (!ownerEl) return;
  const spouseOpt = Array.from(ownerEl.options).find((o) => o.value === "spouse");
  if (spouseOpt) spouseOpt.disabled = !isMarried;
  if (!isMarried && ownerEl.value === "spouse") ownerEl.value = "client";
}

function collectAccounts() {
  const accounts = [];
  $$(".account-row").forEach((row) => {
    const i = row.dataset.i;
    const owner = row.querySelector(`[name="acct_owner_${i}"]`)?.value || null;
    const kind = row.querySelector(`[name="acct_kind_${i}"]`)?.value;
    const institution = row.querySelector(`[name="acct_institution_${i}"]`)?.value?.trim() || null;
    const label = row.querySelector(`[name="acct_label_${i}"]`)?.value?.trim();
    const last4Raw = row.querySelector(`[name="acct_last4_${i}"]`)?.value?.trim();

    if (!kind || !label) return;

    const last_4 = last4Raw && /^\d{1,4}$/.test(last4Raw) ? parseInt(last4Raw, 10) : null;
    accounts.push({
      owner: owner || null,
      kind,
      institution,
      label,
      last_4,
      interest_rate: null,
      active: true,
    });
  });
  return accounts;
}

function addLiabilityRow(liability = null) {
  liabCount++;
  const i = liabCount;
  const container = byId("liabilities-list");
  const row = document.createElement("div");
  row.className = "liability-row";
  row.dataset.i = i;

  const typeOptions =
    `<option value="">Type…</option>` +
    LABELS_BY_KIND.liability.map((t) => `<option value="${t}">${LABEL_TITLES[t]}</option>`).join("");

  row.innerHTML = `
    <div class="field"><select name="liab_type_${i}">${typeOptions}</select></div>
    <div class="field"><input type="text" name="liab_desc_${i}" placeholder="e.g. Primary mortgage" /></div>
    <div class="field"><input type="text" name="liab_rate_${i}" placeholder="APR % e.g. 5.25%" /></div>
    <button class="remove-row-btn" type="button" aria-label="Remove">×</button>
  `;
  container.appendChild(row);
  row.querySelector(".remove-row-btn").addEventListener("click", () => row.remove());

  if (liability) {
    if (liability.label) row.querySelector(`[name="liab_type_${i}"]`).value = liability.label;
    if (liability.institution) row.querySelector(`[name="liab_desc_${i}"]`).value = liability.institution;
    if (liability.interest_rate) row.querySelector(`[name="liab_rate_${i}"]`).value = liability.interest_rate;
  }
}

function collectLiabilities() {
  const accounts = [];
  $$(".liability-row").forEach((row) => {
    const i = row.dataset.i;
    const type = row.querySelector(`[name="liab_type_${i}"]`)?.value?.trim();
    const desc = row.querySelector(`[name="liab_desc_${i}"]`)?.value?.trim();
    const rate = row.querySelector(`[name="liab_rate_${i}"]`)?.value?.trim();
    if (!type) return;
    accounts.push({
      owner: null,
      kind: "liability",
      institution: desc || null,
      label: type,
      last_4: null,
      interest_rate: rate || null,
      active: true,
    });
  });
  return accounts;
}

// ── Drawer open / close ────────────────────────────────────────────────
function openDrawer(client = null) {
  byId("client-form").reset();
  byId("accounts-list").innerHTML = "";
  byId("liabilities-list").innerHTML = "";
  acctCount = 0;
  liabCount = 0;
  setType("single");

  if (client) {
    byId("drawer-title").textContent = "Edit Client";
    byId("client-id").value = String(client.id ?? "");
    byId("household-name").value = client.household_name || "";
    setType(client.household_type === "married" ? "married" : "single");

    const c1 = client.client || {};
    const c2 = client.spouse || {};
    byId("c1-first").value = c1.first_name || "";
    byId("c1-last").value = c1.last_name || "";
    byId("c1-dob").value = c1.dob || "";
    byId("c1-age").value = c1.dob ? calcAge(c1.dob) : "";
    byId("c1-ssn").value = c1.ssn_last_4 ?? "";

    if (client.household_type === "married") {
      byId("c2-first").value = c2.first_name || "";
      byId("c2-last").value = c2.last_name || "";
      byId("c2-dob").value = c2.dob || "";
      byId("c2-age").value = c2.dob ? calcAge(c2.dob) : "";
      byId("c2-ssn").value = c2.ssn_last_4 ?? "";
    }

    const all = client.accounts || [];
    const acctRows = all.filter((a) => a.kind !== "liability");
    const liabRows = all.filter((a) => a.kind === "liability");
    if (acctRows.length === 0) addAccountRow();
    else acctRows.forEach((a) => addAccountRow(a));
    liabRows.forEach((a) => addLiabilityRow(a));

    const sf = client.static_financials || {};
    byId("inflow-mo").value = sf.inflow_mo ?? "";
    byId("outflow-mo").value = sf.outflow_mo ?? "";
    byId("pr-target").value = sf.pr_target ?? "";
    byId("trust-address").value = sf.trust_address ?? "";
  } else {
    byId("drawer-title").textContent = "New Client";
    byId("client-id").value = "";
    addAccountRow();
  }

  byId("overlay").classList.add("open");
}

function closeDrawer() {
  byId("overlay").classList.remove("open");
}

function setType(type) {
  $$(".type-toggle button").forEach((b) =>
    b.classList.toggle("active", b.dataset.type === type),
  );
  byId("spouse-section").style.display = type === "married" ? "" : "none";
  byId("client-form").dataset.type = type;
  $$(".account-row").forEach(applyOwnerConstraints);
}

const getType = () => byId("client-form").dataset.type || "single";

function buildPayload() {
  const type = getType();
  const c1 = {
    first_name: byId("c1-first").value.trim(),
    last_name: byId("c1-last").value.trim(),
    dob: byId("c1-dob").value || null,
    ssn_last_4: byId("c1-ssn").value.trim()
      ? parseInt(byId("c1-ssn").value.trim(), 10)
      : null,
  };
  const spouse = type === "married"
    ? {
        first_name: byId("c2-first").value.trim(),
        last_name: byId("c2-last").value.trim(),
        dob: byId("c2-dob").value || null,
        ssn_last_4: byId("c2-ssn").value.trim()
          ? parseInt(byId("c2-ssn").value.trim(), 10)
          : null,
      }
    : null;

  return {
    household_name: byId("household-name").value.trim(),
    household_type: type,
    client: c1,
    spouse,
    accounts: [...collectAccounts(), ...collectLiabilities()],
    static_financials: {
      inflow_mo: parseFloat(byId("inflow-mo").value) || 0,
      outflow_mo: parseFloat(byId("outflow-mo").value) || 0,
      pr_target: byId("pr-target").value.trim() ? parseFloat(byId("pr-target").value) : null,
      trust_address: byId("trust-address").value.trim() || null,
    },
  };
}

function validatePayload(p) {
  if (!p.household_name) return "Household name is required.";
  if (!p.client.first_name || !p.client.last_name) return "Client first + last name are required.";
  if (p.household_type === "married" && (!p.spouse?.first_name || !p.spouse?.last_name)) {
    return "Married households need spouse first + last name.";
  }
  if (!p.accounts || p.accounts.length === 0) {
    return "Add at least one account or liability.";
  }
  if (!p.static_financials.inflow_mo || !p.static_financials.outflow_mo) {
    return "Monthly inflow and outflow are required.";
  }
  return null;
}

async function saveForm() {
  const payload = buildPayload();
  const err = validatePayload(payload);
  if (err) {
    toast(err, "error");
    return;
  }

  const id = byId("client-id").value;
  const btn = byId("btn-save");
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    if (id) {
      await api(`/clients/${id}`, { method: "PATCH", body: payload });
      toast("Client updated.");
    } else {
      const created = await api("/clients", { method: "POST", body: payload });
      toast("Client created.");
      closeDrawer();
      window.location.href = `client.html?id=${created.id}`;
      return;
    }
    closeDrawer();
    await loadClients();
  } catch (e) {
    toast(`Save failed: ${formatErr(e)}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Client";
  }
}

async function openEdit(id) {
  try {
    const client = await api(`/clients/${id}`);
    openDrawer(client);
  } catch (e) {
    toast(`Could not load client: ${formatErr(e)}`, "error");
  }
}

async function archiveClient(id) {
  if (!confirm("Archive this client? They will be hidden from the list.")) return;
  try {
    await api(`/clients/${id}`, { method: "DELETE" });
    toast("Client archived.");
    await loadClients();
  } catch (e) {
    toast(`Archive failed: ${formatErr(e)}`, "error");
  }
}

function formatErr(e) {
  if (!e) return "Unknown error";
  if (e.detail) {
    if (typeof e.detail === "string") return e.detail;
    if (e.detail.detail) return JSON.stringify(e.detail.detail);
    return JSON.stringify(e.detail);
  }
  return e.message || String(e);
}

function maybeAutoOpenEdit() {
  const m = location.hash.match(/^#edit=(\d+)/);
  if (m) {
    history.replaceState(null, "", location.pathname + location.search);
    openEdit(Number(m[1]));
  }
}

// ── Init ───────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadClients();
  maybeAutoOpenEdit();

  byId("btn-add-client").addEventListener("click", () => openDrawer());
  byId("btn-add-first").addEventListener("click", () => openDrawer());
  byId("btn-cancel").addEventListener("click", closeDrawer);
  byId("btn-cancel-footer").addEventListener("click", closeDrawer);
  byId("btn-save").addEventListener("click", saveForm);
  byId("btn-add-account").addEventListener("click", () => addAccountRow());
  byId("btn-add-liability").addEventListener("click", () => addLiabilityRow());

  byId("overlay").addEventListener("click", (e) => {
    if (e.target === byId("overlay")) closeDrawer();
  });

  $$(".type-toggle button").forEach((b) =>
    b.addEventListener("click", () => setType(b.dataset.type)),
  );

  ["c1-dob", "c2-dob"].forEach((id) => {
    byId(id)?.addEventListener("change", (e) => {
      const ageId = id === "c1-dob" ? "c1-age" : "c2-age";
      byId(ageId).value = calcAge(e.target.value);
    });
  });
});
