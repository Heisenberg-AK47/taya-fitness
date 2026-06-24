/* Taya Fitness — Coaching Online · Supabase client + access helpers
 * Loaded as a module. Exposes window.Taya with auth + subscription gate.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://esylzsacjkimcqxllhwd.supabase.co';
// Publishable (anon) key — safe to expose in the browser. RLS protects the data.
const SUPABASE_ANON_KEY = 'sb_publishable_BwFcaEtnSEZovSIOYiVM3w_CAwp-gpc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

/** Active subscription statuses that grant access to the member area. */
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

/** Returns the current Supabase user, or null. */
export async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

/** Returns the user's active online subscription row, or null. */
export async function activeSubscription(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('abonnements')
    .select('*')
    .eq('user_id', userId)
    .in('statut', ACTIVE_STATUSES)
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.warn('activeSubscription error', error); return null; }
  return data;
}

/**
 * Gate helper for member-only pages.
 * - Not logged in  -> redirect to /login.html
 * - No active sub  -> redirect to /index.html#offres (paywall)
 * - OK             -> resolves with { user, subscription }
 */
export async function requireSubscription() {
  const user = await currentUser();
  if (!user) { location.replace('/login.html?next=' + encodeURIComponent(location.pathname)); return null; }
  const subscription = await activeSubscription(user.id);
  if (!subscription) { location.replace('/index.html#offres'); return null; }
  return { user, subscription };
}

/** Calls the existing stripe-checkout edge function and redirects to Checkout. */
export async function startCheckout({ plan, billing = 'monthly', user_id, user_email }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ type: 'abonnement', plan, billing, user_id, user_email })
  });
  const json = await res.json();
  if (!res.ok || !json.url) throw new Error(json.error || 'Checkout indisponible');
  location.href = json.url;
}

window.Taya = { supabase, currentUser, activeSubscription, requireSubscription, startCheckout };
