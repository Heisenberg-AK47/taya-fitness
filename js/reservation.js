/* ============================================================
   RESERVATION.JS
   ============================================================ */

import { initNavbar } from './navbar.js';
import { initFooter } from './footer.js';
import { getCurrentUser } from './auth.js';
import { supabase } from './supabase.js';

let selectedType   = 'visio';
let selectedDuree  = 30;
let selectedDate   = null;
let selectedHeure  = null;
let currentYear    = new Date().getFullYear();
let currentMonth   = new Date().getMonth();
let currentUser    = null;

// Créneaux disponibles par défaut (Sarah peut les configurer depuis l'admin)
const CRENEAUX = ['08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00'];

document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initFooter();

  currentUser = await getCurrentUser();
  if (!currentUser) {
    document.getElementById('alert-auth').style.display = 'block';
  }

  initTypeCards();
  initDuree();
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

/* ── Durée ───────────────────────────────────────────────── */
function initDuree() {
  document.querySelectorAll('.duree-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.duree-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDuree = parseInt(btn.dataset.duree);
      updateSummary();
    });
  });
}

/* ── Calendrier ──────────────────────────────────────────── */
function renderCalendrier() {
  const label = document.getElementById('cal-month-label');
  const grid  = document.getElementById('cal-grid');
  const today = new Date();

  const date = new Date(currentYear, currentMonth, 1);
  label.textContent = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const firstDay = (date.getDay() + 6) % 7; // Lundi = 0
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  let html = '';

  // Cases vides avant le 1er
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(currentYear, currentMonth, d);
    const isPast  = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isSun   = dateObj.getDay() === 0;
    const isToday = dateObj.toDateString() === today.toDateString();
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isSelected = selectedDate === dateStr;

    const classes = [
      'cal-day',
      isPast || isSun ? 'disabled' : '',
      isToday ? 'today' : '',
      isSelected ? 'selected' : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" data-date="${dateStr}" ${isPast || isSun ? '' : ''}>${d}</div>`;
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

  // Charger les réservations existantes pour cette date
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

  grid.innerHTML = CRENEAUX.map(h => {
    const busy = indispo.includes(h);
    return `<button class="creneau-heure ${busy ? 'indispo' : ''} ${selectedHeure === h ? 'selected' : ''}"
      data-heure="${h}" ${busy ? 'disabled' : ''}>${h}</button>`;
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
const typeLabels = { visio: 'Visio coaching', domicile: 'À domicile', salle: 'En salle' };

function updateSummary() {
  document.getElementById('summary-type').textContent  = typeLabels[selectedType] || selectedType;
  document.getElementById('summary-duree').textContent = `${selectedDuree} min`;
  document.getElementById('summary-date').textContent  = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })
    : '—';
  document.getElementById('summary-heure').textContent = selectedHeure || '—';
  checkReady();
}

function checkReady() {
  const btn = document.getElementById('btn-reserver');
  if (btn) btn.disabled = !(selectedDate && selectedHeure);
}

/* ── Confirmer réservation ───────────────────────────────── */
function initBtnReserver() {
  document.getElementById('btn-reserver')?.addEventListener('click', async () => {
    if (!selectedDate || !selectedHeure) return;

    const btn = document.getElementById('btn-reserver');
    btn.disabled = true;
    btn.textContent = '...';

    try {
      const dateHeure = new Date(`${selectedDate}T${selectedHeure}:00`).toISOString();

      if (currentUser) {
        await supabase.from('reservations').insert({
          user_id:    currentUser.id,
          date_heure: dateHeure,
          type:       selectedType,
          statut:     'en_attente',
          notes:      `Durée : ${selectedDuree} min`
        });
      }

      // Modal confirmation
      const d = new Date(`${selectedDate}T${selectedHeure}:00`);
      document.getElementById('modal-recap').innerHTML = `
        📅 ${d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}<br/>
        🕐 ${selectedHeure} · ${selectedDuree} min<br/>
        📍 ${typeLabels[selectedType]}
      `;
      document.getElementById('modal-confirmation').style.display = 'flex';

    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = 'Confirmer la réservation';
      alert('Erreur lors de la réservation. Réessaie.');
    }
  });
}
