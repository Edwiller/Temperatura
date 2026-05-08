import { createClient } from "https://esm.sh/@supabase/supabase-js"

const SUPABASE_URL = "https://mrahvdxihpbzikdcmafo.supabase.co"
const SUPABASE_KEY = "sb_publishable_CZ7Ku_eOdxMEXfhHq4JVHA_SKqerTuU"

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
)