/*
  PORTAL SMP DUA MEI — JADWAL DARI ADMIN PUSAT
  Data jadwal dibaca dari JSON publik. Link ujian hanya diambil dari field link_ujian.
  Jangan menaruh token GitHub atau password di portal siswa.
*/
const SCHEDULE_JSON_URL = 'https://my-ypdm.github.io/e-ujian-admindm/data/smp.json';

const params = new URLSearchParams(location.search);
const requestedClass = (params.get('kelas') || 'VII').toUpperCase();
const validClass = ['VII', 'VIII', 'IX'].includes(requestedClass) ? requestedClass : 'VII';
const classLabels = { VII: 'Kelas VII', VIII: 'Kelas VIII', IX: 'Kelas IX' };
const classLabel = classLabels[validClass];
const subjectName = params.get('mapel') || '';
const encode = value => encodeURIComponent(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let scheduleRows = [];
let scheduleLoadError = '';

function cleanClassName(value) {
  return String(value || '').trim().replace(/^kelas\s+/i, '').trim().toUpperCase();
}
function gradeForClassName(value) {
  const name = cleanClassName(value);
  if (name === 'VII' || name === '7' || name === '7A' || name.startsWith('VII ')) return 'VII';
  if (name === 'VIII' || name === '8' || name === '8A' || name.startsWith('VIII ')) return 'VIII';
  if (name === 'IX' || name === '9' || name === '9A' || name.startsWith('IX ')) return 'IX';
  return '';
}
function rowsForClass(grade) {
  return scheduleRows.filter(row => gradeForClassName(row.kelas) === grade);
}
function rowsForSubject(grade, name) {
  return rowsForClass(grade).filter(row => String(row.mapel || '').trim() === String(name || '').trim());
}
function unique(values) { return [...new Set(values.filter(Boolean))]; }
function compareSchedule(a, b) {
  return `${a.tanggal || ''} ${a.jam_mulai || ''}`.localeCompare(`${b.tanggal || ''} ${b.jam_mulai || ''}`);
}
function formatDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value || 'Tanggal belum ditentukan');
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}
function formatTime(row) {
  const start = String(row.jam_mulai || '').trim();
  const end = String(row.jam_selesai || '').trim();
  if (start && end) return `${start}–${end}`;
  return start || end || 'Jam belum ditentukan';
}
function rowSummary(row) {
  const parts = [];
  if (row.tanggal) parts.push(formatDate(row.tanggal));
  if (row.jam_mulai || row.jam_selesai) parts.push(formatTime(row));
  if (row.status) parts.push(String(row.status));
  return parts.join(' · ') || 'Jadwal tersedia';
}
function subjectSummary(rows) {
  const sorted = [...rows].sort(compareSchedule);
  if (!sorted.length) return '';
  return `${rowSummary(sorted[0])}${sorted.length > 1 ? ` · ${sorted.length} jadwal` : ''}`;
}
async function loadScheduleJson() {
  try {
    const response = await fetch(SCHEDULE_JSON_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload || !Array.isArray(payload.jadwal)) throw new Error('Format JSON tidak sesuai (jadwal tidak ditemukan).');
    scheduleRows = payload.jadwal
      .filter(row => row && row.kelas && row.mapel)
      .map(row => ({ ...row, kelas: String(row.kelas).trim(), mapel: String(row.mapel).trim() }))
      .sort(compareSchedule);
    return true;
  } catch (error) {
    console.error('Gagal memuat jadwal SMP dari Admin Pusat:', error);
    scheduleLoadError = 'Jadwal belum dapat dimuat dari Admin Pusat. Periksa koneksi internet atau pastikan JSON sudah diterbitkan.';
    return false;
  }
}
function setNotice(message, title = 'Informasi ujian') {
  const notice = document.querySelector('.notice');
  if (!notice) return;
  notice.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = title;
  notice.append(strong, document.createTextNode(message));
  notice.classList.remove('hidden');
}
function makeEmptyState(message) {
  const el = document.createElement('div');
  el.className = 'empty-state';
  el.textContent = message;
  return el;
}

async function renderSubjects() {
  const list = document.getElementById('subjectList');
  if (!list) return;
  document.getElementById('pageTitle').textContent = `Mata Pelajaran ${classLabel}`;
  document.getElementById('pageDescription').textContent = `Pilih mata pelajaran untuk ${classLabel}.`;
  document.getElementById('breadcrumbClass').textContent = classLabel;
  list.replaceChildren();
  const loaded = await loadScheduleJson();
  if (!loaded) { list.append(makeEmptyState(scheduleLoadError)); return; }
  const rows = rowsForClass(validClass);
  if (!rows.length) {
    list.append(makeEmptyState(`Belum ada jadwal untuk ${classLabel}. Admin sekolah perlu menambahkan jadwal dan menerbitkan JSON kembali.`));
    return;
  }
  const names = unique(rows.map(row => row.mapel)).sort((a, b) => a.localeCompare(b, 'id'));
  names.forEach((name, index) => {
    const subjectRows = rows.filter(row => row.mapel === name);
    const a = document.createElement('a');
    a.className = 'subject-link';
    a.href = `kelas-spesifik.html?kelas=${encode(validClass)}&mapel=${encode(name)}`;
    const icon = document.createElement('span');
    icon.className = 'subject-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = ['▤', '∑', 'A', '⚗', '◈', '⌘'][index % 6];
    const content = document.createElement('span');
    content.style.flex = '1';
    const title = document.createElement('b');
    title.textContent = name;
    const summary = document.createElement('small');
    summary.textContent = subjectSummary(subjectRows);
    summary.style.display = 'block'; summary.style.marginTop = '4px'; summary.style.fontSize = '11px'; summary.style.color = 'var(--muted)';
    content.append(title, summary);
    const arrow = document.createElement('span'); arrow.className = 'arrow'; arrow.textContent = '→';
    a.append(icon, content, arrow); list.append(a);
  });
}

async function renderExam() {
  const panel = document.getElementById('examAccess');
  if (!panel) return;
  document.getElementById('subjectBreadcrumb').textContent = classLabel;
  document.getElementById('subjectBreadcrumb').href = `mapel.html?kelas=${encode(validClass)}`;
  document.getElementById('backToSubjects').href = `mapel.html?kelas=${encode(validClass)}`;
  document.getElementById('examTitle').textContent = subjectName || 'Akses Ujian';
  document.getElementById('examDescription').textContent = `${classLabel} · SMP Dua Mei`;
  panel.replaceChildren();
  const loaded = await loadScheduleJson();
  if (!loaded) { panel.append(makeEmptyState(scheduleLoadError)); return; }
  if (!subjectName) { panel.append(makeEmptyState('Silakan kembali dan pilih mata pelajaran dari daftar.')); return; }
  const relevant = rowsForSubject(validClass, subjectName).sort(compareSchedule);
  if (!relevant.length) { panel.append(makeEmptyState(`Belum ada jadwal untuk ${subjectName} pada ${classLabel}.`)); return; }

  relevant.forEach(row => {
    const card = document.createElement('div');
    card.className = 'schedule-item';
    const status = String(row.status || '').trim();
    const url = String(row.link_ujian || '').trim();
    const validUrl = /^https?:\/\//i.test(url);
    const statusBox = document.createElement('div');
    statusBox.className = `exam-status ${validUrl ? 'available' : 'pending'}`;
    const dot = document.createElement('span'); dot.className = 'status-dot';
    statusBox.append(dot, document.createTextNode(validUrl ? 'Link ujian tersedia' : 'Link belum tersedia'));
    const heading = document.createElement('h2'); heading.textContent = subjectName;
    const detail = document.createElement('p'); detail.textContent = `${rowSummary(row)}${status ? '' : ''}`;
    card.append(statusBox, heading, detail);
    if (validUrl) {
      const link = document.createElement('a'); link.className = 'button button-orange';
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Buka Ujian →'; card.append(link);
    } else {
      const note = document.createElement('p');
      note.textContent = 'Jadwal sudah terdaftar, tetapi link ujian belum diaktifkan. Silakan hubungi guru atau pengawas ujian.';
      card.append(note);
    }
    panel.append(card);
  });
}

function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebarToggle');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (!sidebar || !toggle || !backdrop) return;
  const close = () => {
    sidebar.classList.remove('is-open'); backdrop.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Buka menu');
    toggle.textContent = '☰'; document.body.classList.remove('menu-open');
  };
  const open = () => {
    sidebar.classList.add('is-open'); backdrop.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Tutup menu');
    toggle.textContent = '×'; document.body.classList.add('menu-open');
  };
  toggle.addEventListener('click', () => sidebar.classList.contains('is-open') ? close() : open());
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  sidebar.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
}

document.addEventListener('DOMContentLoaded', () => {
  setupSidebar();
  renderSubjects();
  renderExam();
});
