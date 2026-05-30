/* ============================================================
   AUTH.JS — Gestion authentification Supabase
   ============================================================ */

import { supabase } from './supabase.js';

/* ── Obtenir la session courante ────────────────────────── */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/* ── Obtenir l'utilisateur courant ──────────────────────── */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/* ── Inscription ────────────────────────────────────────── */
export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  if (error) throw error;

  // Créer le profil dans la table profiles
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      created_at: new Date().toISOString()
    });
  }

  return data;
}

/* ── Connexion ──────────────────────────────────────────── */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

/* ── Déconnexion ────────────────────────────────────────── */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  window.location.href = '/';
}

/* ── Protéger une page (redirige si non connecté) ───────── */
export async function requireAuth(redirectTo = '/auth') {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

/* ── Écouter les changements d'état auth ────────────────── */
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/* ── Récupérer le profil utilisateur ────────────────────── */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

/* ── Mettre à jour le profil ────────────────────────────── */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ── Mot de passe oublié ────────────────────────────────── */
export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth?mode=reset`
  });
  if (error) throw error;
}
