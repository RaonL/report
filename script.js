const storageKey = "domain-locker-records";

const sampleRecords = [
  {
    id: "sample-1",
    domain: "corp-example.com",
    domainExpiry: offsetDate(18),
    sslExpiry: offsetDate(12),
    registrar: "Cloudflare",
    owner: "보안기술팀 / 홍길동",
    nameserver: "kai.ns.cloudflare.com, zara.ns.cloudflare.com",
    note: "F5 WAF VIP 연결. 인증서 갱신 시 야간 반영 필요."
  },
  {
    id: "sample-2",
    domain: "vpn-example.co.kr",
    domainExpiry: offsetDate(43),
    sslExpiry: offsetDate(29),
    registrar: "Gabia",
    owner: "인프라운영팀 / 김담당",
    nameserver: "ns.gabia.co.kr",
    note: "NAC 원격 접속 안내 페이지. 만료 전 공지 필요."
  },
  {
    id: "sample-3",
    domain: "edr-console.example.net",
    domainExpiry: offsetDate(128),
    sslExpiry: offsetDate(96),
    registrar: "Route 53",
    owner: "보안관제팀 / 이담당",
    nameserver: "ns-102.awsdns.com, ns-204.awsdns.net",
    note: "EDR 관리 콘솔. SSO 인증서와 별도 관리."
  }
];

const elements = {
  form: document.querySelector("#domainForm"),
  recordId: document.querySelector("#recordId"),
  domain: document.querySelector("#domainInput"),
  domainExpiry: document.querySelector("#domainExpiryInput"),
  sslExpiry: document.querySelector("#sslExpiryInput"),
  registrar: document.querySelector("#registrarInput"),
  owner: document.querySelector("#ownerInput"),
  nameserver: document.querySelector("#nameserverInput"),
  note: document.querySelector("#noteInput"),
  table: document.querySelector("#domainTable"),
  rowTemplate: document.querySelector("#rowTemplate"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  filter: document.querySelector("#filterSelect"),
  totalCount: document.querySelector("#totalCount"),
  dangerCount: document.querySelector("#dangerCount"),
  warningCount: document.querySelector("#warningCount"),
  safeCount: document.querySelector("#safeCount"),
  clearForm: document.querySelector("#clearFormButton"),
  loadSample: document.querySelector("#loadSampleButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  toast: document.querySelector("#toast")
};

let records = loadRecords();

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  const target = new Date(`${dateValue}T00:00:00`);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

function getStatus(record) {
  const domainDays = daysUntil(record.domainExpiry);
  const sslDays = daysUntil(record.sslExpiry);
  const activeDays = Math.min(
    domainDays ?? Number.POSITIVE_INFINITY,
    sslDays ?? Number.POSITIVE_INFINITY
  );

  if (activeDays < 0) return { key: "expired", label: "만료됨", days: activeDays };
  if (activeDays <= 15) return { key: "danger", label: "임박", days: activeDays };
  if (activeDays <= 30) return { key: "warning", label: "주의", days: activeDays };
  return { key: "safe", label: "정상", days: activeDays };
}

function formatDay(days) {
  if (days === null || days === Number.POSITIVE_INFINITY) return "-";
  if (days < 0) return `D+${Math.abs(days)}`;
  if (days === 0) return "D-Day";
  return `D-${days}`;
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(storageKey, JSON.stringify(records));
}

function getFilteredRecords() {
  const keyword = elements.search.value.trim().toLowerCase();
  const filter = elements.filter.value;

  return records
    .map((record) => ({ ...record, status: getStatus(record) }))
    .filter((record) => filter === "all" || record.status.key === filter)
    .filter((record) => {
      if (!keyword) return true;
      return [
        record.domain,
        record.registrar,
        record.owner,
        record.nameserver,
        record.note
      ].join(" ").toLowerCase().includes(keyword);
    })
    .sort((a, b) => a.status.days - b.status.days);
}

function render() {
  const filteredRecords = getFilteredRecords();
  elements.table.innerHTML = "";
  elements.empty.classList.toggle("visible", filteredRecords.length === 0);

  filteredRecords.forEach((record) => {
    const row = elements.rowTemplate.content.firstElementChild.cloneNode(true);
    const status = record.status;
    const sslDays = daysUntil(record.sslExpiry);

    row.querySelector(".status-pill").textContent = status.label;
    row.querySelector(".status-pill").classList.add(`status-${status.key}`);
    row.querySelector(".domain-name").textContent = record.domain;
    row.querySelector(".domain-note").textContent = record.note || record.nameserver || "메모 없음";
    row.querySelector(".day-cell").textContent = formatDay(status.days);
    row.querySelector(".ssl-cell").textContent = record.sslExpiry ? `${record.sslExpiry} (${formatDay(sslDays)})` : "미등록";
    row.querySelector(".registrar-cell").textContent = record.registrar || "-";
    row.querySelector(".owner-cell").textContent = record.owner || "-";
    row.querySelector(".edit-button").addEventListener("click", () => editRecord(record.id));
    row.querySelector(".delete-button").addEventListener("click", () => deleteRecord(record.id));
    elements.table.appendChild(row);
  });

  updateMetrics();
}

function updateMetrics() {
  const statuses = records.map(getStatus);
  elements.totalCount.textContent = records.length;
  elements.dangerCount.textContent = statuses.filter((status) => status.key === "danger" || status.key === "expired").length;
  elements.warningCount.textContent = statuses.filter((status) => status.key === "warning").length;
  elements.safeCount.textContent = statuses.filter((status) => status.key === "safe").length;
}

function handleSubmit(event) {
  event.preventDefault();
  const id = elements.recordId.value || createId();
  const nextRecord = {
    id,
    domain: normalizeDomain(elements.domain.value),
    domainExpiry: elements.domainExpiry.value,
    sslExpiry: elements.sslExpiry.value,
    registrar: elements.registrar.value.trim(),
    owner: elements.owner.value.trim(),
    nameserver: elements.nameserver.value.trim(),
    note: elements.note.value.trim()
  };

  records = records.some((record) => record.id === id)
    ? records.map((record) => record.id === id ? nextRecord : record)
    : [...records, nextRecord];

  saveRecords();
  clearForm();
  render();
  showToast("도메인을 저장했습니다.");
}

function normalizeDomain(value) {
  return value
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}

function editRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record) return;

  elements.recordId.value = record.id;
  elements.domain.value = record.domain;
  elements.domainExpiry.value = record.domainExpiry;
  elements.sslExpiry.value = record.sslExpiry;
  elements.registrar.value = record.registrar;
  elements.owner.value = record.owner;
  elements.nameserver.value = record.nameserver;
  elements.note.value = record.note;
  elements.domain.focus();
}

function deleteRecord(id) {
  records = records.filter((record) => record.id !== id);
  saveRecords();
  render();
  showToast("도메인을 삭제했습니다.");
}

function clearForm() {
  elements.form.reset();
  elements.recordId.value = "";
}

function loadSampleRecords() {
  records = [...sampleRecords];
  saveRecords();
  clearForm();
  render();
  showToast("샘플 도메인을 불러왔습니다.");
}

function exportCsv() {
  if (records.length === 0) {
    showToast("내보낼 도메인이 없습니다.");
    return;
  }

  const header = ["domain", "domainExpiry", "sslExpiry", "registrar", "owner", "nameserver", "note"];
  const rows = records.map((record) => header.map((key) => escapeCsv(record[key] || "")).join(","));
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `domain-locker-${toDateInputValue(new Date())}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function escapeCsv(value) {
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

function importCsv(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const imported = parseCsv(String(reader.result));
    if (imported.length === 0) {
      showToast("가져올 데이터가 없습니다.");
      return;
    }

    records = imported.map((record) => ({ id: createId(), ...record }));
    saveRecords();
    render();
    elements.importInput.value = "";
    showToast("CSV를 불러왔습니다.");
  };
  reader.readAsText(file, "utf-8");
}

function parseCsv(csv) {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((record, header, index) => {
      record[header] = values[index] || "";
      return record;
    }, {});
  }).filter((record) => record.domain && record.domainExpiry);
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 1800);
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `domain-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

elements.form.addEventListener("submit", handleSubmit);
elements.clearForm.addEventListener("click", clearForm);
elements.loadSample.addEventListener("click", loadSampleRecords);
elements.exportButton.addEventListener("click", exportCsv);
elements.importInput.addEventListener("change", (event) => importCsv(event.target.files[0]));
elements.search.addEventListener("input", render);
elements.filter.addEventListener("change", render);

render();
