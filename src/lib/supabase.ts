import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase Configuration:')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'Not provided')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey
    }
  }
})

// Test connection on initialization
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...')
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true }).limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
    } else {
      console.log('Supabase connection successful')
    }
  } catch (error) {
    console.error('Supabase connection test error:', error)
  }
}

// Run connection test
testConnection()