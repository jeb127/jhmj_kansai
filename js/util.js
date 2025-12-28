/* ===============================
   앱 있으면 앱 / 없으면 웹 (새 창)
================================ */
function openAppOrWeb(appUrl, webUrl) {
  // 앱 열기 시도 (현재 창)
  location.href = appUrl;

  // 앱이 없으면 → 웹을 새 창으로
  setTimeout(() => {
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }, 1000);
}

/* ===============================
   구글맵
================================ */
function openGoogleMap() {
  const app = "comgooglemaps://";
  const web = "https://www.google.com/maps";
  openAppOrWeb(app, web);
}

/* ===============================
   파파고
================================ */
function openPapago() {
  const app = "papago://";
  const web = "https://papago.naver.com";
  openAppOrWeb(app, web);
}

/* ===============================
   USJ
   (앱 딥링크 불안정 → 웹만 새 창)
================================ */
function openUSJ() {
  window.open(
    "https://www.usj.co.jp/web/ko/kr",
    "_blank",
    "noopener,noreferrer"
  );
}

/* ===============================
   환율 계산기
================================ */

// 고정 환율 (1엔 ≈ 9.2원)
const RATE = 9.2;

const yenInput = document.getElementById("yen");
const wonInput = document.getElementById("won");

// 엔 → 원
yenInput.addEventListener("input", () => {
  const yen = Number(yenInput.value);
  if (isNaN(yen)) return;
  wonInput.value = Math.round(yen * RATE);
});

// 원 → 엔
wonInput.addEventListener("input", () => {
  const won = Number(wonInput.value);
  if (isNaN(won)) return;
  yenInput.value = Math.round(won / RATE);
});
