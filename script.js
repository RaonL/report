const categories = [
  "고객지원",
  "장애대응",
  "기술검토",
  "구축/설정",
  "자동화",
  "문서작성",
  "교육/가이드",
  "PoC/테스트",
  "내부업무",
  "F5",
  "NAC",
  "EDR"
];

const categoryHints = {
  "고객지원": ["고객 요청사항을 확인하고 처리 현황을 정리", "고객 문의에 대한 원인 분석 및 대응 방향을 안내"],
  "장애대응": ["장애 원인을 분석하고 재발 방지 관점에서 점검", "서비스 영향도를 확인하고 복구 및 후속 조치를 진행"],
  "기술검토": ["적용 가능성과 운영 영향도를 중심으로 기술 검토를 수행", "구성 방식과 제약사항을 확인하고 개선 방향을 도출"],
  "구축/설정": ["운영 환경에 맞춰 설정값을 반영하고 정상 동작 여부를 확인", "구성 변경 후 기능 검증 및 안정성 점검을 진행"],
  "자동화": ["반복 작업을 줄이기 위한 자동화 흐름을 구성", "자동 처리 가능한 항목을 분리하여 작업 효율을 개선"],
  "문서작성": ["진행 내역과 검토 결과를 문서화", "운영 참고용 절차와 결과 자료를 정리"],
  "교육/가이드": ["사용자 이해를 돕기 위한 가이드 내용을 정리", "운영자 관점의 안내 자료를 보완"],
  "PoC/테스트": ["테스트 조건을 구성하고 결과를 비교 검증", "PoC 환경에서 기능 동작과 제한사항을 확인"],
  "내부업무": ["내부 공유가 필요한 업무 현황을 정리", "팀 업무 진행을 위한 자료와 일정 항목을 정리"],
  "F5": ["F5 정책 및 트래픽 처리 흐름을 기준으로 점검", "F5 WAF 탐지 정책과 예외 처리 항목을 검토"],
  "NAC": ["NAC 접근 제어 정책과 단말 인증 흐름을 점검", "NAC 예외 정책 및 접속 이력을 기준으로 확인"],
  "EDR": ["EDR 탐지 이벤트와 대응 이력을 분석", "EDR 정책 및 탐지 룰 적용 상태를 확인"]
};

const toneEndings = {
  simple: {
    current: ["진행하였습니다.", "확인하였습니다.", "정리하였습니다."],
    next: ["진행할 예정입니다.", "확인할 예정입니다.", "정리할 예정입니다."]
  },
  report: {
    current: ["수행하고 결과를 정리하였습니다.", "점검하고 후속 조치 항목을 도출하였습니다.", "검토하여 보고 가능한 형태로 정리하였습니다."],
    next: ["보완하고 반복 검증 가능한 형태로 정리할 예정입니다.", "추가 점검 후 운영 적용 방향을 정리할 예정입니다.", "관련 내용을 정리하여 업무 효율을 개선할 예정입니다."]
  },
  technical: {
    current: ["기준으로 설정값과 동작 결과를 검증하였습니다.", "관련 로그 및 정책 흐름을 분석하여 기술 검토를 완료하였습니다.", "테스트 조건별 결과를 확인하고 개선 포인트를 정리하였습니다."],
    next: ["기준으로 세부 항목을 보완하고 검증 범위를 확대할 예정입니다.", "관련 로그와 정책 흐름을 추가 분석하여 적용 방향을 구체화할 예정입니다.", "자동화 가능 항목을 분리하고 테스트 절차를 고도화할 예정입니다."]
  }
};

const storageKey = "engineer-weekly-report-state";

const elements = {
  owner: document.querySelector("#ownerInput"),
  week: document.querySelector("#weekInput"),
  current: document.querySelector("#currentInput"),
  next: document.querySelector("#nextInput"),
  categoryGroup: document.querySelector("#categoryGroup"),
  toneGroup: document.querySelector("#toneGroup"),
  generate: document.querySelector("#generateButton"),
  copy: document.querySelector("#copyButton"),
  reset: document.querySelector("#resetButton"),
  output: document.querySelector("#resultOutput"),
  status: document.querySelector("#statusText"),
  lineCount: document.querySelector("#lineCount")
};

let selectedCategories = ["F5", "NAC", "EDR", "자동화"];
let selectedTone = "report";

function splitKeywords(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pick(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function getHint(keyword, index) {
  const matched = selectedCategories.find((category) => keyword.toLowerCase().includes(category.toLowerCase()));
  const category = matched || selectedCategories[index % selectedCategories.length] || "기술검토";
  return pick(categoryHints[category] || categoryHints["기술검토"], keyword.length + index);
}

function buildSentence(keyword, index, type) {
  const hint = getHint(keyword, index);
  const ending = pick(toneEndings[selectedTone][type], keyword.length + index * 3);

  if (selectedTone === "simple") {
    return `- ${keyword} 관련 업무를 확인하고 ${ending}`;
  }

  if (type === "next") {
    return `- ${keyword} 항목은 ${hint}하고, ${ending}`;
  }

  return `- ${keyword} 항목에 대해 ${hint}하고, ${ending}`;
}

function generateReport() {
  const currentItems = splitKeywords(elements.current.value);
  const nextItems = splitKeywords(elements.next.value);
  const ownerLine = elements.owner.value.trim() ? `작성자: ${elements.owner.value.trim()}\n` : "";
  const weekLine = elements.week.value.trim() ? `보고 주차: ${elements.week.value.trim()}\n` : "";

  const currentLines = currentItems.length
    ? currentItems.map((item, index) => buildSentence(item, index, "current"))
    : ["- 금주 수행 업무 키워드를 입력해주세요."];

  const nextLines = nextItems.length
    ? nextItems.map((item, index) => buildSentence(item, index, "next"))
    : ["- 차주 예정 업무 키워드를 입력해주세요."];

  const report = `${ownerLine}${weekLine}
[금주 수행 업무]
${currentLines.join("\n")}

[차주 예정 업무]
${nextLines.join("\n")}`.trim();

  elements.output.textContent = report;
  elements.lineCount.textContent = `${report.split("\n").length} lines`;
  setStatus("생성 완료");
  saveState();
}

function saveState() {
  const state = {
    owner: elements.owner.value,
    week: elements.week.value,
    current: elements.current.value,
    next: elements.next.value,
    selectedCategories,
    selectedTone,
    output: elements.output.textContent
  };
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    elements.week.value = getDefaultWeekLabel();
    return;
  }

  try {
    const state = JSON.parse(saved);
    elements.owner.value = state.owner || "";
    elements.week.value = state.week || getDefaultWeekLabel();
    elements.current.value = state.current || "";
    elements.next.value = state.next || "";
    selectedCategories = state.selectedCategories || selectedCategories;
    selectedTone = state.selectedTone || selectedTone;
    elements.output.textContent = state.output || elements.output.textContent;
    elements.lineCount.textContent = `${elements.output.textContent.split("\n").length} lines`;
  } catch {
    elements.week.value = getDefaultWeekLabel();
  }
}

function getDefaultWeekLabel() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const week = Math.ceil((now.getDate() + monthStart.getDay()) / 7);
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${week}주차`;
}

function renderCategories() {
  elements.categoryGroup.innerHTML = "";
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = selectedCategories.includes(category) ? "chip active" : "chip";
    button.textContent = category;
    button.addEventListener("click", () => {
      selectedCategories = selectedCategories.includes(category)
        ? selectedCategories.filter((item) => item !== category)
        : [...selectedCategories, category];
      renderCategories();
      saveState();
    });
    elements.categoryGroup.appendChild(button);
  });
}

function renderTone() {
  elements.toneGroup.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tone === selectedTone);
  });
}

function setStatus(message) {
  elements.status.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    elements.status.textContent = "";
  }, 1800);
}

async function copyReport() {
  const text = elements.output.textContent.trim();
  if (!text || text.includes("입력한 뒤")) {
    setStatus("복사할 내용 없음");
    return;
  }

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-999px";
    document.body.appendChild(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  setStatus("복사 완료");
}

function resetAll() {
  localStorage.removeItem(storageKey);
  elements.owner.value = "";
  elements.week.value = getDefaultWeekLabel();
  elements.current.value = "";
  elements.next.value = "";
  selectedCategories = ["F5", "NAC", "EDR", "자동화"];
  selectedTone = "report";
  elements.output.textContent = "금주 업무와 차주 계획 키워드를 입력한 뒤 생성하기를 눌러주세요.";
  elements.lineCount.textContent = "0 lines";
  renderCategories();
  renderTone();
  setStatus("초기화 완료");
}

elements.generate.addEventListener("click", generateReport);
elements.copy.addEventListener("click", copyReport);
elements.reset.addEventListener("click", resetAll);

elements.toneGroup.addEventListener("click", (event) => {
  if (!event.target.matches("button")) return;
  selectedTone = event.target.dataset.tone;
  renderTone();
  saveState();
});

[elements.owner, elements.week, elements.current, elements.next].forEach((field) => {
  field.addEventListener("input", saveState);
});

loadState();
renderCategories();
renderTone();
