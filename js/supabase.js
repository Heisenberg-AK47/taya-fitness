/* ============================================================
   SUPABASE.JS — Init client Supabase
   ============================================================ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://esylzsacjkimcqxllhwd.supabase.co';
const SUPABASE_ANON = 'sb_publishable_BwFcaEtnSEZovSIOYiVM3w_CAwp-gpc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export default supabase;
