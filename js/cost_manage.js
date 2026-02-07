// ===== Firebase (module) =====
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ===== Firestore 경로 =====
const expenseColRef = collection(window.db, "trip", "jhmj-trip", "expenses");
const pwColRef = collection(window.db, "passwords");

// ===== DOM =====
const tBody = document.getElementById("cost_table");
const cavTotalEl = document.getElementById("cav_total");
const jhTotalEl = document.getElementById("jh_total");
const mjTotalEl = document.getElementById("mj_total");
const radios = document.querySelectorAll('input[name="filter"]');

// ===== 데이터 =====
let costlist = [];
let currentUser = null;
let deleteId = null;

// ===== 초기 =====
document.querySelector('input[value="공동"]').checked = true;

// ===== Firestore 실시간 반영 =====
onSnapshot(expenseColRef, (snapshot) => {
  costlist = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
  render(getCurrentFilter());
});

// ===== 필터 이벤트 =====
radios.forEach(radio => {
  radio.addEventListener("change", async () => {
    const user = radio.value;

    if (user === "공동") {
      render("공동");
      return;
    }

    currentUser = user;

    if (!(await hasPassword(user))) openModal("set");
    else openModal("check");
  });
});

// ===== 현재 필터 =====
function getCurrentFilter() {
  return document.querySelector('input[name="filter"]:checked')?.value || "공동";
}

// ===== 정렬 기준 =====
function dateKey(dateStr) {
  const s = String(dateStr ?? "").trim();

  // '이전'은 무조건 가장 먼저
  if (s === "이전") return -1;

  // "2.03" 같은 형식만 날짜로 인정
  const m = s.match(/^(\d{1,2})\.(\d{1,2})$/);
  if (!m) return 999999; // 이상한 값은 맨 뒤로

  const month = Number(m[1]);
  const day = Number(m[2]);
  return month * 100 + day; // 2월3일 -> 203
}


// ===== 렌더 =====
function render(filter) {
  const visibleList = getVisibleList(filter);

  const sorted = [...visibleList].sort((a, b) => {
    const diff = dateKey(a.date) - dateKey(b.date);
    if (diff !== 0) return diff;

    // 같은 날짜면 createdAt 오름차순
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return ta - tb;
  });

  renderTable(sorted);
  renderTotals(filter, sorted);
}

// ===== 필터링 =====
function getVisibleList(filter) {
  if (filter === "공동") {
    return costlist.filter(item => item.who === "공동" || item.date === "이전");
  }
  return costlist.filter(item => item.date === "이전" || item.who === "공동" || item.who === filter);
}

// ===== 테이블 =====
function renderTable(list) {
  tBody.innerHTML = "";

  if (list.length === 0) {
    tBody.innerHTML =
      `<tr><td colspan="4" style="text-align:center;">내역 없음</td></tr>`;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.spendby}</td>
      <td>${item.who}</td>
      <td>${Number(item.cost).toLocaleString()}엔</td>
    `;

    // 모바일 길게 눌러 삭제
    let timer;
    tr.addEventListener("touchstart", () => {
      timer = setTimeout(() => openConfirm(item.id), 700);
    });
    tr.addEventListener("touchend", () => clearTimeout(timer));

    // PC 우클릭
    tr.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openConfirm(item.id);
    });

    tBody.appendChild(tr);
  });
}

// ===== 합계 =====
function renderTotals(filter, list) {
  let total = 0;
  let personal = 0;

  list.forEach(item => {
    const cost = Number(item.cost) || 0;

    if (item.who === "공동") {
      total += cost;
      if (filter !== "공동") personal += cost / 2;
    } else {
      total += cost;
      personal += cost;
    }
  });

  cavTotalEl.textContent = total.toLocaleString();
  jhTotalEl.textContent = personal.toLocaleString();
  mjTotalEl.textContent = personal.toLocaleString();

  cavTotalEl.parentElement.style.display = "none";
  jhTotalEl.parentElement.style.display = "none";
  mjTotalEl.parentElement.style.display = "none";

  if (filter === "공동") cavTotalEl.parentElement.style.display = "";
  if (filter === "지현") jhTotalEl.parentElement.style.display = "";
  if (filter === "민지") mjTotalEl.parentElement.style.display = "";
}

// ===== 비밀번호 존재 여부 =====
async function hasPassword(user) {
  const ref = doc(window.db, "passwords", user);
  const snap = await getDoc(ref);
  return snap.exists();
}

// ===== 비밀번호 모달 =====
function openModal(mode) {
  const modal = document.getElementById("pw-modal");
  const title = document.getElementById("pw-title");
  const input = document.getElementById("pw-input");

  title.textContent =
    mode === "set"
      ? `${currentUser} 비밀번호 설정`
      : `${currentUser} 비밀번호 입력`;

  input.value = "";
  modal.dataset.mode = mode;
  modal.classList.remove("hidden");
  input.focus();
}

// ===== 비밀번호 확인 / 저장 =====
document.getElementById("pw-confirm").onclick = async () => {
  const input = document.getElementById("pw-input").value;
  const modal = document.getElementById("pw-modal");

  if (!/^\d{4}$/.test(input)) {
    alert("숫자 4자리만 가능");
    return;
  }

  const ref = doc(window.db, "passwords", currentUser);
  const snap = await getDoc(ref);

  // 최초 설정
  if (modal.dataset.mode === "set") {
    await setDoc(ref, { pw: input });
    modal.classList.add("hidden");
    render(currentUser);
    return;
  }

  // 비밀번호 확인
  if (snap.exists() && snap.data().pw === input) {
    modal.classList.add("hidden");
    render(currentUser);
  } else {
    alert("비밀번호 틀림");
    modal.classList.add("hidden");
    resetFilter();
  }
};

document.getElementById("pw-cancel").onclick = () => {
  document.getElementById("pw-modal").classList.add("hidden");
  resetFilter();
};

function resetFilter() {
  document.querySelector('input[value="공동"]').checked = true;
  render("공동");
}

// ===== 삭제 confirm =====
function openConfirm(id) {
  deleteId = id;
  document.getElementById("confirmModal").classList.remove("hidden");
}

document.getElementById("confirmCancel").onclick = () => {
  document.getElementById("confirmModal").classList.add("hidden");
  deleteId = null;
};

document.getElementById("confirmOk").onclick = async () => {
  if (!deleteId) return;
  await deleteDoc(doc(window.db, "trip", "jhmj-trip", "expenses", deleteId));
  document.getElementById("confirmModal").classList.add("hidden");
  deleteId = null;
};
