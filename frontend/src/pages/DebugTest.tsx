import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getColleges, getSubjects, getSubjectsForSemester } from '../lib/api'

export function DebugTest() {
  const [colleges, setColleges] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [semesterSubjects, setSemesterSubjects] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    async function test() {
      const errs: string[] = []

      // Test 1: Get colleges via API
      try {
        const collegesData = await getColleges()
        setColleges(collegesData)
        console.log('✅ Colleges API:', collegesData)
      } catch (e) {
        const err = `❌ Colleges API failed: ${e}`
        errs.push(err)
        console.error(err)
      }

      // Test 2: Get subjects via API
      try {
        const subjectsData = await getSubjects('a0000000-0000-0000-0000-000000000001')
        setSubjects(subjectsData)
        console.log('✅ Subjects API:', subjectsData.length, 'subjects')
      } catch (e) {
        const err = `❌ Subjects API failed: ${e}`
        errs.push(err)
        console.error(err)
      }

      // Test 3: Get subjects for semester via Supabase
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('semester', 1)
          .eq('regulation', 'R22')
        
        if (error) throw error
        setSemesterSubjects(data || [])
        console.log('✅ Supabase direct query:', data?.length, 'subjects')
      } catch (e) {
        const err = `❌ Supabase query failed: ${e}`
        errs.push(err)
        console.error(err)
      }

      // Test 4: Get subjects via helper function
      try {
        const semesterData = await getSubjectsForSemester(1, 'R22')
        console.log('✅ getSubjectsForSemester:', semesterData.length, 'subjects')
      } catch (e) {
        const err = `❌ getSubjectsForSemester failed: ${e}`
        errs.push(err)
        console.error(err)
      }

      setErrors(errs)
    }

    test()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Debug Test Page</h1>

        {errors.length > 0 && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
            <h2 className="text-red-300 font-bold mb-2">Errors:</h2>
            {errors.map((err, i) => (
              <p key={i} className="text-red-200 text-sm font-mono">{err}</p>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-white font-bold mb-2">Colleges ({colleges.length})</h2>
            <pre className="text-gray-300 text-xs overflow-auto">
              {JSON.stringify(colleges, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-white font-bold mb-2">Subjects via API ({subjects.length})</h2>
            <pre className="text-gray-300 text-xs overflow-auto max-h-60">
              {JSON.stringify(subjects.slice(0, 3), null, 2)}
            </pre>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h2 className="text-white font-bold mb-2">
              Semester 1 Subjects via Supabase ({semesterSubjects.length})
            </h2>
            <pre className="text-gray-300 text-xs overflow-auto max-h-60">
              {JSON.stringify(semesterSubjects.slice(0, 3), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
