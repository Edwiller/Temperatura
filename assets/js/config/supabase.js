import {
    createClient
} from "https://esm.sh/@supabase/supabase-js@2";

    
const SUPABASE_URL =
    "https://shmqizeqhqvxnllqztdf.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_NYYJ90k-cZcD7FJaZH9l9g_934T0-kw";


export const supabase =
    createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );