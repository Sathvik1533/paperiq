import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jkocmlgaovfchjkxvwfp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprb2NtbGdhb3ZmY2hqa3h2d2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTgxNjcsImV4cCI6MjA5NjEzNDE2N30.hCuaquovFFRRrXFeNRcgu_Ds83rkGSP6dUH71H2IB3E'
)

console.log('\n=== Testing Supabase Table Access ===\n')

// Test colleges
console.log('1. Testing colleges table...')
const { data: colleges, error: collegesError } = await supabase
  .from('colleges')
  .select('*')

if (collegesError) {
  console.error('❌ Colleges query failed:', collegesError.message)
  console.error('   Details:', collegesError)
} else {
  console.log('✅ Colleges query success:', colleges?.length, 'colleges found')
}

// Test subjects
console.log('\n2. Testing subjects table...')
const { data: subjects, error: subjectsError } = await supabase
  .from('subjects')
  .select('*')

if (subjectsError) {
  console.error('❌ Subjects query failed:', subjectsError.message)
  console.error('   Details:', subjectsError)
} else {
  console.log('✅ Subjects query success:', subjects?.length, 'subjects found')
}

// Test subjects with filter
console.log('\n3. Testing subjects with semester filter...')
const { data: sem1, error: sem1Error } = await supabase
  .from('subjects')
  .select('*')
  .eq('semester', 1)
  .eq('regulation', 'R22')

if (sem1Error) {
  console.error('❌ Filtered subjects query failed:', sem1Error.message)
  console.error('   Details:', sem1Error)
} else {
  console.log('✅ Filtered subjects query success:', sem1?.length, 'subjects found')
  if (sem1 && sem1.length > 0) {
    console.log('   Sample:', sem1[0].code, '-', sem1[0].name)
  }
}
