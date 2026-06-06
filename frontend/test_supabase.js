import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jkocmlgaovfchjkxvwfp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprb2NtbGdhb3ZmY2hqa3h2d2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTgxNjcsImV4cCI6MjA5NjEzNDE2N30.hCuaquovFFRRrXFeNRcgu_Ds83rkGSP6dUH71H2IB3E'
)

const { data, error } = await supabase
  .from('subjects')
  .select('*')
  .eq('semester', 1)
  .eq('regulation', 'R22')

if (error) {
  console.error('Error:', error)
} else {
  console.log('Found', data.length, 'subjects')
  console.log(JSON.stringify(data.slice(0, 2), null, 2))
}
