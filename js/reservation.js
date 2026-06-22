/* ============================================================
   RESERVATION.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { getCurrentUser } from './auth.js';
import { supabase } from './supabase.js';

let selectedType  = 'stade-de-france';
let selectedDate  = null;
let selectedHeure = null;
let currentYear   = new Date().getFullYear();
let currentMonth  = new Date().getMonth();

const CRENEAUX = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00'];

const TYPE_LABELS = {
  'stade-de-france': 'Fitness Park Stade de France',
  'aubervilliers':   'Fitness Park Aubervilliers',
  'carnot':          'Fitness Park rue Carnot · Saint-Denis',
  'visio':           'Visio coaching',
};

const TYPE_ADDRESSES = {
  'stade-de-france': 'Fitness Park Stade de France, Saint-Denis (93)',
  'aubervilliers':   'Fitness Park Aubervilliers (93300)',
  'carnot':          'Fitness Park rue Carnot, Saint-Denis (93200)',
  'visio':           'En ligne — Google Meet / Zoom',
};

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    document.getElementById('alert-auth').style.display = 'block';
  }

  initTypeCards();
  renderCalendrier();
  initBtnReserver();
});

/* ── Types de séance ─────────────────────────────────────── */
function initTypeCards() {
  document.getElementById('type-cards')?.addEventListener('click', e => {
    const card = e.target.closest('.type-card');
    if (!card) return;
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedType = card.dataset.type;
    updateSummary();
  });
}

/* ── Calendrier ──────────────────────────────────────────── */
function renderCalendrier() {
  const label = document.getElementById('cal-month-label');
  const grid  = document.getElementById('cal-grid');
  const today = new Date();

  const date = new Date(currentYear, currentMonth, 1);
  label.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const firstDay    = (date.getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const isPast  = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isSun   = dateObj.getDay() === 0;
    const isToday = dateObj.toDateString() === today.toDateString();
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isSelected = selectedDate === dateStr;

    // Si c'est aujourd'hui, vérifier qu'il reste au moins un créneau disponible
    let isFull = false;
    if (isToday) {
      const nowMin = today.getHours() * 60 + today.getMinutes();
      isFull = CRENEAUX.every(h => {
        const [hh, mm] = h.split(':').map(Number);
        return hh * 60 + mm <= nowMin;
      });
    }

    const disabled = isPast || isSun || isFull;
    const classes = ['cal-day', disabled ? 'disabled' : '', isToday ? 'today' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');
    html += `<div class="${classes}" data-date="${dateStr}">${d}</div>`;
  }

  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.disabled):not(.empty)').forEach(day => {
    day.addEventListener('click', () => selectDate(day.dataset.date));
  });

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendrier();
  });

  document.getElementById('cal-next')?.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendrier();
  });
}

function selectDate(dateStr) {
  selectedDate  = dateStr;
  selectedHeure = null;
  renderCalendrier();
  renderCreneaux(dateStr);
  updateSummary();
}

/* ── Créneaux horaires ───────────────────────────────────── */
async function renderCreneaux(dateStr) {
  const section = document.getElementById('creneaux-section');
  const grid    = document.getElementById('creneaux-horaires');
  section.style.display = 'block';

  // Créneaux déjà pris en base
  let indispo = [];
  try {
    const debut = new Date(`${dateStr}T00:00:00`).toISOString();
    const fin   = new Date(`${dateStr}T23:59:59`).toISOString();
    const { data } = await supabase
      .from('reservations')
      .select('date_heure')
      .gte('date_heure', debut)
      .lte('date_heure', fin);
    indispo = (data || []).map(r => r.date_heure.slice(11, 16));
  } catch {}

  // Créneaux passés pour aujourd'hui
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const isToday  = dateStr === todayStr;
  const nowMin   = now.getHours() * 60 + now.getMinutes();

  grid.innerHTML = CRENEAUX.map(h => {
    const [hh, mm] = h.split(':').map(Number);
    const slotMin  = hh * 60 + mm;
    const isPast   = isToday && slotMin <= nowMin;
    const busy     = indispo.includes(h);
    const disabled = busy || isPast;

    return `<button class="creneau-heure${disabled ? ' indispo' : ''}${selectedHeure === h ? ' selected' : ''}"
      data-heure="${h}" ${disabled ? 'disabled' : ''}>${h}</button>`;
  }).join('');

  grid.querySelectorAll('.creneau-heure:not(.indispo)').forEach(btn => {
    btn.addEventListener('click', () => {
      grid.querySelectorAll('.creneau-heure').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedHeure = btn.dataset.heure;
      updateSummary();
      checkReady();
    });
  });
}

/* ── Résumé ──────────────────────────────────────────────── */
function updateSummary() {
  document.getElementById('summary-type').textContent = TYPE_LABELS[selectedType] || selectedType;
  document.getElementById('summary-date').textContent = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
    : '—';
  document.getElementById('summary-heure').textContent = selectedHeure || '—';
  checkReady();
}

function checkReady() {
  const btn = document.getElementById('btn-reserver');
  if (btn) btn.disabled = !(selectedDate && selectedHeure);
}

/* ── Continuer vers le paiement ──────────────────────────── */
function initBtnReserver() {
  document.getElementById('btn-reserver')?.addEventListener('click', () => {
    if (!selectedDate || !selectedHeure) return;

    const booking = {
      type:       selectedType,
      label:      TYPE_LABELS[selectedType],
      address:    TYPE_ADDRESSES[selectedType],
      date:       selectedDate,
      heure:      selectedHeure,
      date_heure: new Date(`${selectedDate}T${selectedHeure}:00`).toISOString(),
      date_label: new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' }),
    };

    sessionStorage.setItem('taya_booking', JSON.stringify(booking));
    window.location.href = '/reservation-paiement';
  });
}
