// ===== Firebase (module) =====
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// form 가져오기
const form = document.getElementById("cost_form");

// 취소 버튼
const cancelBtn = document.getElementById("cancel");
cancelBtn.addEventListener("click", () => {
  window.location.href = "./cost_manage.html";
});

// submit 이벤트 처리
form.addEventListener("submit", async function (e) {
  e.preventDefault(); // 페이지 새로고침 방지

  // 입력값 가져오기
  const date = document.querySelector('input[name="date"]:checked');
  const who = document.querySelector('input[name="who"]:checked');
  const spendby = document.getElementById("spendby").value.trim();
  const cost = document.getElementById("cost").value;

  // 유효성 검사
  if (!date || !who || !spendby || !cost) {
    alert("모든 항목 입력");
    return;
  }

  // 객체로 정리
  const costData = {
    date: date.value,
    who: who.value,
    spendby: spendby,
    cost: Number(cost),
    createdAt: serverTimestamp()
  };

  try {
    // Firestore에 저장 (컬렉션: trip)
    const colRef = collection(window.db, "trip", "jhmj-trip", "expenses");
    await addDoc(colRef, costData);

    // 관리 페이지로 이동
    window.location.href = "/jhmj_kansai/cost_manage.html";
  } catch (err) {
    console.error(err);
    alert("저장 실패! 콘솔(F12)에서 에러 확인해줘.");
  }
});

