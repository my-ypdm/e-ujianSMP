// Konfigurasi portal. Ubah nama mapel dan isi examUrl setelah link resmi tersedia.
const PORTAL_CONFIG = {
  VII: { label: "Kelas VII", subjects: [
    {name:"Bahasa Indonesia",examUrl:""},{name:"Matematika",examUrl:""},{name:"Bahasa Inggris",examUrl:""},{name:"IPA",examUrl:""},{name:"IPS",examUrl:""},{name:"Informatika",examUrl:""}
  ]},
  VIII: { label: "Kelas VIII", subjects: [
    {name:"Bahasa Indonesia",examUrl:""},{name:"Matematika",examUrl:""},{name:"Bahasa Inggris",examUrl:""},{name:"IPA",examUrl:""},{name:"IPS",examUrl:""},{name:"Informatika",examUrl:""}
  ]},
  IX: { label: "Kelas IX", subjects: [
    {name:"Bahasa Indonesia",examUrl:""},{name:"Matematika",examUrl:""},{name:"Bahasa Inggris",examUrl:""},{name:"IPA",examUrl:""},{name:"IPS",examUrl:""},{name:"Informatika",examUrl:""}
  ]}
};
const params = new URLSearchParams(location.search);
const classKey = (params.get("kelas") || "VII").toUpperCase();
const classData = PORTAL_CONFIG[classKey] || PORTAL_CONFIG.VII;
const subjectName = params.get("mapel") || "";
const subjectData = classData.subjects.find(s => s.name === subjectName);
const enc = encodeURIComponent;
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function renderSubjects() {
  const list = document.getElementById("subjectList");
  if (!list) return;
  document.getElementById("pageTitle").textContent = `Mata Pelajaran ${classData.label}`;
  document.getElementById("pageDescription").textContent = `Pilih mata pelajaran untuk ${classData.label}.`;
  document.getElementById("breadcrumbClass").textContent = classData.label;
  list.replaceChildren();
  classData.subjects.forEach((s, i) => {
    const a = document.createElement("a");
    a.className = "subject-link";
    a.href = `kelas-spesifik.html?kelas=${enc(classKey)}&mapel=${enc(s.name)}`;
    a.innerHTML = `<span class="subject-icon">${["▤","∑","A","⚗","◈","⌘"][i%6]}</span><b></b><span class="arrow">→</span>`;
    a.querySelector("b").textContent = s.name;
    list.append(a);
  });
}
function renderExam() {
  const panel = document.getElementById("examAccess");
  if (!panel) return;
  document.getElementById("subjectBreadcrumb").textContent = classData.label;
  document.getElementById("subjectBreadcrumb").href = `mapel.html?kelas=${enc(classKey)}`;
  document.getElementById("backToSubjects").href = `mapel.html?kelas=${enc(classKey)}`;
  if (!subjectData) {
    document.getElementById("examTitle").textContent = "Mata pelajaran tidak ditemukan";
    panel.textContent = "Silakan kembali dan pilih mata pelajaran dari daftar.";
    return;
  }
  document.getElementById("examTitle").textContent = subjectData.name;
  document.getElementById("examDescription").textContent = `${classData.label} · SMP Dua Mei`;
  if (subjectData.examUrl && /^https?:\/\//i.test(subjectData.examUrl)) {
    panel.innerHTML = `<div class="exam-status available"><span class="status-dot"></span> Link ujian tersedia</div><h2>${esc(subjectData.name)}</h2><p>Pastikan kamu membuka ujian untuk kelas yang benar.</p><a class="button button-orange" href="${esc(subjectData.examUrl)}" target="_blank" rel="noopener noreferrer">Buka Ujian →</a>`;
  } else {
    panel.innerHTML = `<div class="exam-status pending"><span class="status-dot"></span> Link belum tersedia</div><h2>${esc(subjectData.name)}</h2><p>Link ujian untuk ${esc(classData.label)} belum dikonfigurasi. Silakan hubungi guru atau pengawas ujian.</p>`;
  }
}
function setupSidebar() {
  const sidebar = document.getElementById("sidebar"), toggle = document.getElementById("sidebarToggle"), backdrop = document.getElementById("sidebarBackdrop");
  if (!sidebar || !toggle || !backdrop) return;
  const close = () => { sidebar.classList.remove("is-open"); backdrop.classList.remove("is-visible"); toggle.setAttribute("aria-expanded","false"); toggle.setAttribute("aria-label","Buka menu"); toggle.textContent="☰"; document.body.classList.remove("menu-open"); };
  const open = () => { sidebar.classList.add("is-open"); backdrop.classList.add("is-visible"); toggle.setAttribute("aria-expanded","true"); toggle.setAttribute("aria-label","Tutup menu"); toggle.textContent="×"; document.body.classList.add("menu-open"); };
  toggle.addEventListener("click", () => sidebar.classList.contains("is-open") ? close() : open());
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  sidebar.querySelectorAll("a").forEach(a => a.addEventListener("click", close));
}
document.addEventListener("DOMContentLoaded", () => { setupSidebar(); renderSubjects(); renderExam(); });
