import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://fnupsoflvdmzupirxpqh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_xVYUhNPnUu-nBH_9WoKMMQ_gIGwB8Ws'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
