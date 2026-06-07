/**
 * Profile — Screen 19
 * Route: /profile
 *
 * Shows: identity card, academic metrics, academic profile (editable), learning goals, experience preferences.
 * All dynamic from Supabase user_profiles table.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { useAuthStore } from '../store/authStore'
import { getUserProfile, upsertUserProfile } from '../lib/api'
import { supabase } from '../lib/supabase'
import { CustomSelect } from '../components/CustomSelect'
import { motion, useReducedMotion } from 'framer-motion'
import { PageTransition } from '../components/ui/PageTransition'
import { usePrefsStore } from '../store/prefsStore'

export function Profile() {
  const shouldReduceMotion = useReducedMotion()
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()
  const { prefs, setPrefs: updateGlobalPrefs } = usePrefsStore()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  const [stats, setStats] = useState({ subjects: 0, papers: 0, sessions: 0, peakSubject: '' })

  const [form, setForm] = useState({
    full_name: '',
    branch: '',
    regulation: 'R22',
    current_year: 2,
    current_semester: 3,
    target_cgpa: 7.5,
    target_marks: 70,
    hours_per_day: 4,
    preparation_level: 'intermediate',
  })

  useEffect(() => {
    if (!user) return
    loadProfile()
  }, [user])

  async function loadProfile() {
    try {
      const prof = await getUserProfile(user!.id)
      setProfile(prof)
      if (prof) {
        setForm({
          full_name:          prof.full_name || user?.user_metadata?.full_name || '',
          branch:             prof.branch || 'CSE',
          regulation:         prof.regulation || 'R22',
          current_year:       prof.current_year || 2,
          current_semester:   prof.current_semester || 3,
          target_cgpa:        prof.target_cgpa || 7.5,
          target_marks:       prof.target_marks || 70,
          hours_per_day:      prof.hours_per_day || 4,
          preparation_level:  prof.preparation_level || 'intermediate',
        })
      }

      if (prof?.current_semester && prof?.regulation) {
        const { data: subs } = await supabase
          .from('subjects')
          .select('id')
          .eq('semester', prof.current_semester)
          .eq('regulation', prof.regulation)
        setStats(s => ({ ...s, subjects: subs?.length || 0 }))
      }
      const { count: paperCount } = await supabase.from('papers').select('*', { count:'exact', head:true })
      setStats(s => ({ ...s, papers: paperCount || 0 }))

      if (prof?.current_semester && prof?.regulation) {
        const { data: userSubs } = await supabase
          .from('subjects')
          .select('id')
          .eq('semester', prof.current_semester)
          .eq('regulation', prof.regulation)
        if (userSubs?.length) {
          const subIds = userSubs.map((s: any) => s.id)
          const { count: sessionCount } = await supabase
            .from('analysis_reports')
            .select('*', { count: 'exact', head: true })
            .in('subject_id', subIds)
          setStats(s => ({ ...s, sessions: sessionCount || 0 }))

          const { data: recentReports } = await supabase
            .from('analysis_reports')
            .select('subject_id')
            .in('subject_id', subIds)
            .order('generated_at', { ascending: false })
            .limit(20)
          if (recentReports?.length) {
            const freq: Record<string, number> = {}
            for (const r of recentReports) {
              freq[r.subject_id] = (freq[r.subject_id] || 0) + 1
            }
            const topSubId = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0]
            if (topSubId) {
              const { data: subRow } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', topSubId)
                .single()
              if (subRow?.name) setStats(s => ({ ...s, peakSubject: subRow.name }))
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const academicChanged =
        form.regulation !== profile?.regulation ||
        form.current_semester !== profile?.current_semester ||
        form.current_year !== profile?.current_year

      await upsertUserProfile(user.id, {
        full_name:          form.full_name,
        regulation:         form.regulation,
        current_year:       form.current_year,
        current_semester:   form.current_semester,
        target_cgpa:        form.target_cgpa,
        target_marks:       form.target_marks,
        hours_per_day:      form.hours_per_day,
        preparation_level:  form.preparation_level,
      })
      setSuccess('Profile updated successfully.')
      setEditing(false)

      if (academicChanged) {
        navigate('/dashboard')
      } else {
        await loadProfile()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!confirm(
      'Delete your account?\n\nThis will sign you out. Your profile data will be removed on your next login attempt.\n\nTo permanently delete your account and all data, contact support@paperiq.in'
    )) return
    try {
      await supabase.from('user_profiles').delete().eq('id', user!.id)
    } catch (_) {}
    await signOut()
    navigate('/')
  }

  const initials = (form.full_name || user?.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const avatarUrl = user?.user_metadata?.avatar_url

  const ordinal = (n: number) => {
    if (n === 1) return '1st'
    if (n === 2) return '2nd'
    if (n === 3) return '3rd'
    return `${n}th`
  }
  const fieldCls = "w-full bg-surface-container border border-outline-variant rounded-xl px-md py-sm text-on-surface text-body-md focus:outline-none focus:border-primary-container transition-all"

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar activeTab="profile" />
        <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">
          <div className="skeleton rounded-3xl h-64 mb-lg" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
            <div className="md:col-span-5 space-y-lg">
              <div className="skeleton rounded-2xl h-56" />
              <div className="skeleton rounded-2xl h-48" />
            </div>
            <div className="md:col-span-7 space-y-lg">
              <div className="skeleton rounded-2xl h-32" />
              <div className="skeleton rounded-2xl h-64" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  const prepLabel = (profile?.preparation_level || form.preparation_level || 'intermediate')
  const prepCapitalized = prepLabel.charAt(0).toUpperCase() + prepLabel.slice(1)

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <NavBar activeTab="profile" />

      <main className="max-w-[1200px] mx-auto px-lg pt-28 pb-huge">

        {error   && <div className="mb-lg px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
        {success && <div className="mb-lg px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">{success}</div>}

        {/* ── Hero Banner ─────────────────────────────────────────── */}
        <motion.div
          data-tour="tour-profile-hero"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
          className="relative rounded-3xl overflow-hidden mb-xl border border-white/8"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(7,7,13,1) 40%, rgba(16,185,129,0.07) 100%)',
          }}
        >
          {/* Ambient glow orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/8 rounded-full blur-[80px] pointer-events-none" />

          {/* Subtle grid texture */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.5) 40px)' }} />

          <div className="relative p-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-xl">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary-container/50 bg-surface-container flex items-center justify-center text-3xl font-bold text-primary-container"
                  style={{ boxShadow: '0 0 32px rgba(249,115,22,0.3), 0 0 0 4px rgba(249,115,22,0.08)' }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"
                  style={{ boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
              </div>

              {/* Name + details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-sm flex-wrap mb-xs">
                  <h1 className="font-headline text-[32px] text-on-surface leading-tight tracking-tight">
                    {form.full_name || user?.user_metadata?.full_name || 'Student'}
                  </h1>
                  <span className="px-sm py-[3px] bg-primary-container/20 border border-primary-container/30 rounded-full text-[11px] font-bold text-primary-container uppercase tracking-wider">
                    Beta Tester
                  </span>
                </div>
                <p className="text-on-surface-variant text-body-sm mb-base">{user?.email}</p>
                <div className="flex flex-wrap gap-md">
                  <span className="flex items-center gap-xs text-body-sm text-on-surface-variant bg-white/5 border border-white/8 px-sm py-xs rounded-lg">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">school</span>
                    MLRIT · {form.branch || 'CSE'} · {profile?.regulation || form.regulation}
                  </span>
                  <span className="flex items-center gap-xs text-body-sm text-on-surface-variant bg-white/5 border border-white/8 px-sm py-xs rounded-lg">
                    <span className="material-symbols-outlined text-[14px] text-primary-container">book</span>
                    Semester {profile?.current_semester || form.current_semester}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-sm shrink-0">
                <button
                  onClick={() => setEditing(e => !e)}
                  className="flex items-center gap-xs px-md py-sm bg-surface-container/80 border border-outline-variant rounded-xl text-body-sm text-on-surface hover:border-primary-container/50 hover:bg-primary-container/8 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary-container">edit</span>
                  {editing ? 'Cancel' : 'Edit Profile'}
                </button>
                <button
                  onClick={() => signOut().then(() => navigate('/'))}
                  className="flex items-center gap-xs px-md py-sm bg-surface-container/80 border border-outline-variant rounded-xl text-body-sm text-on-surface-variant hover:text-error hover:border-error/30 hover:bg-error/5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sign out
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-md mt-xl pt-xl border-t border-white/8">
              {[
                { label: 'Subjects Tracked', value: stats.subjects || '—', icon: 'library_books', color: 'text-primary-container', bg: 'bg-primary-container/10' },
                { label: 'Papers in DB',     value: stats.papers  || '—', icon: 'description',   color: 'text-primary-container', bg: 'bg-primary-container/10' },
                { label: 'Analysis Runs',    value: stats.sessions || '0', icon: 'analytics',    color: 'text-emerald-400',        bg: 'bg-emerald-500/10' },
                { label: 'Prep Level',       value: prepCapitalized,        icon: 'trending_up',  color: 'text-blue-400',           bg: 'bg-blue-500/10' },
              ].map((s, index) => (
                <motion.div 
                  key={s.label} 
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring" as const, stiffness: 300, damping: 20, delay: index * 0.05 }}
                  className="flex items-center gap-md"
                >
                  <div className={`w-10 h-10 rounded-xl ${s.bg} border border-white/8 flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
                  </div>
                  <div>
                    <div className={`font-headline text-[24px] leading-none ${s.color}`}>{s.value}</div>
                    <div className="text-[11px] text-on-surface-variant mt-[3px]">{s.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Two-col layout ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">

          {/* Left — Academic Profile + Learning Goals + Security */}
          <div className="md:col-span-5 space-y-lg">

            {/* Academic Profile */}
            <div className="rounded-2xl border border-white/8 overflow-hidden"
              style={{ background: 'rgba(15,15,22,0.8)', backdropFilter: 'blur(16px)' }}>
              <div className="flex justify-between items-center px-lg pt-lg pb-md border-b border-white/6">
                <div className="flex items-center gap-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/15 border border-primary-container/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px] text-primary-container">school</span>
                  </div>
                  <h3 className="font-headline text-[17px] text-on-surface">Academic Profile</h3>
                </div>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-xs text-primary-container font-body-sm text-sm hover:underline"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>Edit
                  </button>
                )}
              </div>
              <div className="p-lg">
                {editing ? (
                  <div className="space-y-md">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Full Name</label>
                      <input type="text" value={form.full_name} onChange={e => setForm(f => ({...f, full_name:e.target.value}))} className={fieldCls} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Branch</label>
                      <CustomSelect value={form.branch} onChange={v => setForm(f => ({...f, branch: v}))}
                        options={['CSE','ECE','EEE','MECH','CIVIL','IT'].map(b => ({ value: b, label: b }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Regulation</label>
                        <CustomSelect value={form.regulation} onChange={v => setForm(f => ({...f, regulation: v}))}
                          options={['R18','R20','R22','R24'].map(r => ({ value: r, label: r }))} />
                      </div>
                      <div>
                        <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Semester</label>
                        <CustomSelect value={String(form.current_semester)} onChange={v => setForm(f => ({...f, current_semester: Number(v)}))}
                          options={[
                            { value: '3', label: '2-1 (Sem 3)' },
                            { value: '4', label: '2-2 (Sem 4)' },
                          ]} />
                      </div>
                    </div>
                    <button onClick={handleSave} disabled={saving}
                      className="w-full bg-primary-container text-on-primary-container py-sm rounded-xl font-bold hover:brightness-110 transition-all disabled:opacity-50 mt-sm flex items-center justify-center gap-sm">
                      {saving
                        ? <><span className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" />Saving…</>
                        : <><span className="material-symbols-outlined text-[16px]">check</span>Save Changes</>
                      }
                    </button>
                  </div>
                ) : (
                  <div className="space-y-[2px]">
                    {[
                      { label: 'College',     value: 'MLRIT Hyderabad' },
                      { label: 'Branch',      value: form.branch || 'CSE' },
                      { label: 'Regulation',  value: profile?.regulation || form.regulation },
                      { label: 'Year',        value: `${ordinal(profile?.current_year || form.current_year)} Year` },
                      { label: 'Semester',    value: `Semester ${profile?.current_semester || form.current_semester}` },
                    ].map(f => (
                      <div key={f.label} className="flex justify-between items-center py-[10px] border-b border-white/5 last:border-0">
                        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">{f.label}</span>
                        <span className="text-body-sm text-on-surface font-medium">{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Learning Goals */}
            <div className="rounded-2xl border border-white/8 overflow-hidden"
              style={{ background: 'rgba(15,15,22,0.8)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-sm px-lg pt-lg pb-md border-b border-white/6">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">flag</span>
                </div>
                <h3 className="font-headline text-[17px] text-on-surface">Learning Goals</h3>
              </div>
              <div className="p-lg">
                {editing ? (
                  <div className="space-y-md">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Target CGPA</label>
                      <input type="number" step="0.1" min="0" max="10" value={form.target_cgpa}
                        onChange={e => setForm(f => ({...f, target_cgpa:Number(e.target.value)}))} className={fieldCls} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Daily Study Hours</label>
                      <input type="number" min="1" max="12" value={form.hours_per_day}
                        onChange={e => setForm(f => ({...f, hours_per_day:Number(e.target.value)}))} className={fieldCls} />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-wider text-on-surface-variant mb-xs block">Preparation Level</label>
                      <CustomSelect value={form.preparation_level} onChange={v => setForm(f => ({...f, preparation_level: v}))}
                        options={['beginner','intermediate','advanced'].map(l => ({ value: l, label: l.charAt(0).toUpperCase()+l.slice(1) }))} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-[2px]">
                    {/* CGPA goal bar */}
                    <div className="py-md border-b border-white/5">
                      <div className="flex justify-between mb-sm">
                        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">Target CGPA</span>
                        <span className="text-body-sm text-primary-container font-bold">{profile?.target_cgpa || form.target_cgpa} / 10.0</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-container rounded-full"
                          style={{ width: `${((profile?.target_cgpa || form.target_cgpa) / 10) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-[10px] border-b border-white/5">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">Daily Focus</span>
                      <span className="text-body-sm text-on-surface font-medium">{profile?.hours_per_day || form.hours_per_day} hrs / day</span>
                    </div>
                    <div className="flex justify-between items-center py-[10px]">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant">Preparation</span>
                      <span className="px-sm py-[2px] text-[11px] font-bold rounded-full border capitalize
                        ${prepLabel === 'advanced' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : prepLabel === 'beginner' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-primary-container border-primary-container/30 bg-primary-container/10'}">
                        {prepCapitalized}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Security */}
            <div className="rounded-2xl border border-white/8 overflow-hidden"
              style={{ background: 'rgba(15,15,22,0.8)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-sm px-lg pt-lg pb-md border-b border-white/6">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">lock</span>
                </div>
                <h3 className="font-headline text-[17px] text-on-surface">Account Security</h3>
              </div>
              <div className="p-lg space-y-sm">
                <button onClick={() => navigate('/auth?mode=forgot')}
                  className="w-full text-left px-md py-sm rounded-xl border border-outline-variant hover:border-primary-container/40 hover:bg-primary-container/5 transition-all group flex items-center justify-between">
                  <span className="text-body-sm text-on-surface">Change Password</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary-container transition-colors">chevron_right</span>
                </button>
                <button onClick={handleDeleteAccount}
                  className="w-full text-left px-md py-sm rounded-xl border border-error/20 hover:bg-error/8 transition-all group flex items-center justify-between">
                  <span className="text-body-sm text-error/80 group-hover:text-error transition-colors">Delete Account</span>
                  <span className="material-symbols-outlined text-[16px] text-error/40 group-hover:text-error transition-colors">delete_forever</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right — Quick Actions + Experience Preferences + Peak Activity */}
          <div className="md:col-span-7 space-y-lg">

            {/* Quick Actions */}
            <div className="rounded-2xl border border-white/8 overflow-hidden"
              style={{ background: 'rgba(15,15,22,0.8)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-sm px-lg pt-lg pb-md border-b border-white/6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-blue-400">bolt</span>
                </div>
                <h3 className="font-headline text-[17px] text-on-surface">Quick Actions</h3>
              </div>
              <div className="p-lg">
                <div className="grid grid-cols-3 gap-md">
                  {[
                    { icon: 'analytics',   label: 'Run Analysis',  sub: 'Start a new run',      to: '/analysis',   color: 'text-primary-container', bg: 'bg-primary-container/10', border: 'border-primary-container/20' },
                    { icon: 'description', label: 'Browse Papers', sub: 'View past papers',     to: '/papers',     color: 'text-emerald-400',        bg: 'bg-emerald-500/10',        border: 'border-emerald-500/20' },
                    { icon: 'settings',    label: 'Settings',      sub: 'Preferences',          to: '/settings',   color: 'text-blue-400',           bg: 'bg-blue-500/10',           border: 'border-blue-500/20' },
                  ].map(action => (
                    <motion.button key={action.label} onClick={() => navigate(action.to)}
                      whileHover={shouldReduceMotion ? {} : { scale: 1.03, translateY: -2 }}
                      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                      className={`flex flex-col gap-sm p-md rounded-2xl border ${action.border} ${action.bg} hover:brightness-110 transition-all group text-left`}>
                      <span className={`material-symbols-outlined text-[24px] ${action.color} group-hover:scale-110 transition-transform`}>{action.icon}</span>
                      <div>
                        <p className="text-body-sm font-bold text-on-surface">{action.label}</p>
                        <p className="text-[11px] text-on-surface-variant mt-[2px]">{action.sub}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Peak Activity */}
            {stats.peakSubject && (
              <div
                className="rounded-2xl border border-primary-container/20 p-lg flex items-center gap-lg"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(249,115,22,0.03))' }}
              >
                <div className="w-12 h-12 rounded-2xl bg-primary-container/20 border border-primary-container/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px] text-primary-container">local_fire_department</span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-primary-container/70 mb-[2px]">Most Analyzed</p>
                  <p className="font-headline text-[17px] text-on-surface">{stats.peakSubject}</p>
                  <p className="text-[12px] text-on-surface-variant mt-[2px]">Your highest-activity subject this session</p>
                </div>
              </div>
            )}

            {/* Experience Preferences */}
            <div className="rounded-2xl border border-white/8 overflow-hidden"
              style={{ background: 'rgba(15,15,22,0.8)', backdropFilter: 'blur(16px)' }}>
              <div className="flex items-center gap-sm px-lg pt-lg pb-md border-b border-white/6">
                <div className="w-8 h-8 rounded-lg bg-primary-container/15 border border-primary-container/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px] text-primary-container">tune</span>
                </div>
                <h3 className="font-headline text-[17px] text-on-surface">Experience Preferences</h3>
              </div>
              <div className="p-lg space-y-lg">
                {[
                  {
                    id: 'dashboardView',
                    label: 'Dashboard View',
                    sub: 'Data-dense intelligence or clean personal view',
                    opts: ['Intelligence', 'Personal'],
                    active: prefs.dashboardView,
                  },
                  {
                    id: 'analysisLayout',
                    label: 'Analysis Layout',
                    sub: 'How paper breakdowns are displayed',
                    opts: ['Interactive', 'Compact'],
                    active: prefs.analysisLayout,
                  },
                ].map((pref, pi) => (
                  <div key={pref.label}>
                    {pi > 0 && <div className="h-px bg-white/5 -mx-lg mb-lg" />}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-base">
                      <div>
                        <p className="text-body-sm font-semibold text-on-surface">{pref.label}</p>
                        <p className="text-[12px] text-on-surface-variant mt-[2px]">{pref.sub}</p>
                      </div>
                      <div className="flex bg-white/5 border border-white/8 p-[3px] rounded-xl gap-[3px] shrink-0">
                        {pref.opts.map((o) => (
                          <button key={o}
                            onClick={() => updateGlobalPrefs({ [pref.id]: o as any })}
                            className={`px-md py-xs rounded-lg font-body-sm text-sm transition-all ${
                              o === pref.active
                                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                            }`}
                          >{o}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="h-px bg-white/5 -mx-lg" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-base">
                  <div>
                    <p className="text-body-sm font-semibold text-on-surface">Default Landing Page</p>
                    <p className="text-[12px] text-on-surface-variant mt-[2px]">First screen when you open PaperIQ</p>
                  </div>
                  <CustomSelect value={prefs.defaultLandingPage.charAt(0).toUpperCase() + prefs.defaultLandingPage.slice(1)} 
                    onChange={(v) => updateGlobalPrefs({ defaultLandingPage: v.toLowerCase() as any })}
                    options={['Dashboard','Analysis','Papers'].map(o => ({ value: o, label: o }))} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </PageTransition>
  )
}
