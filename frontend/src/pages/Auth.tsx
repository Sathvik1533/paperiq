/**
 * Auth — Screens 02 (Login), 03 (Sign Up), 04 (Forgot Password)
 * Route: /auth?mode=login | signup | forgot
 *
 * Three modes in one page, toggled by ?mode= query param.
 * Login: Google OAuth + email/password
 * Signup: split layout — form left, analysis preview right
 * Forgot: email input + success state
 */
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { ActionButton } from '../components/ui/ActionButton'

export function Auth() {
  const { user, signInWithGoogle, loading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = (searchParams.get('mode') || 'login') as 'login' | 'signup' | 'forgot'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [signupSent, setSignupSent] = useState(false)

  // If already logged in, redirect
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` }
        })
        if (err) throw err
        setSignupSent(true)  // show confirmation email prompt
        return               // don't fall through to setSubmitting(false) below
      } else {
        // forgot
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=login`
        })
        if (err) throw err
        setForgotSent(true)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // ── FORGOT PASSWORD screen ────────────────────────────────────────────────
  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-base py-huge">
        <Link to="/" className="absolute top-6 left-6 flex items-center gap-xs text-on-surface-variant hover:text-white transition-colors text-body-sm cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span> Back
        </Link>

        <div className="glass-card rounded-2xl p-xxl w-full max-w-[480px]">
          <div className="text-center mb-xl">
            <span className="material-symbols-outlined text-[48px] text-primary-container mb-base block">lock_reset</span>
            <h1 className="font-headline text-headline-lg text-on-surface mb-sm">Reset Password</h1>
            <p className="text-body-md text-on-surface-variant">
              {forgotSent ? 'Check your email for a reset link.' : "Enter your email and we'll send a reset link."}
            </p>
          </div>

          {!forgotSent ? (
            <form onSubmit={handleEmailAuth} className="space-y-base">
              <div>
                <label className="block font-data-label text-data-label text-on-surface-variant uppercase mb-xs">Email Address</label>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-base py-md text-on-surface text-body-md focus:outline-none focus:border-primary-container transition-all"
                />
              </div>
              {error && <p className="text-error text-body-sm">{error}</p>}
              <ActionButton
                type="submit" disabled={submitting} isLoading={submitting}
                className="w-full h-12 bg-primary-container text-on-primary-container font-bold rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Send Reset Link'}
              </ActionButton>
            </form>
          ) : (
            <div className="text-center">
              <span className="material-symbols-outlined text-[64px] text-success mb-base block" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
              <p className="text-body-md text-on-surface mb-xl">Reset email sent! Check your inbox.</p>
              <button onClick={() => navigate('/auth')} className="text-primary-container hover:underline text-body-md">
                Back to Login
              </button>
            </div>
          )}

          <p className="text-center mt-xl text-body-sm text-on-surface/40">
            Remembered it?{' '}
            <button onClick={() => navigate('/auth')} className="text-primary-container hover:underline">Log In</button>
          </p>
        </div>
      </div>
    )
  }

  // ── SIGN UP — email confirmation sent ────────────────────────────────────
  if (mode === 'signup' && signupSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-base">
        <div className="glass-card rounded-2xl p-xxl w-full max-w-[480px] text-center">
          <span className="material-symbols-outlined text-[64px] text-success mb-base block" style={{fontVariationSettings:"'FILL' 1"}}>mark_email_read</span>
          <h1 className="font-headline text-headline-lg text-on-surface mb-sm">Check Your Inbox</h1>
          <p className="text-body-md text-on-surface-variant mb-sm">
            We sent a confirmation link to <span className="text-primary-container font-semibold">{email}</span>.
          </p>
          <p className="text-body-sm text-on-surface-variant mb-xl">
            Click the link in the email to activate your account, then you'll be taken to set up your profile.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="text-primary-container hover:underline font-body-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  // ── SIGN UP — split layout ────────────────────────────────────────────────
  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Progress bar */}
        <div className="fixed top-0 left-0 w-full z-50 bg-background border-b border-surface-container-highest">
          <div className="flex h-1 w-full">
            <div className="h-full flex-1 bg-primary-container" />
            <div className="h-full flex-1 bg-surface-container-highest" />
            <div className="h-full flex-1 bg-surface-container-highest" />
          </div>
        </div>

        <header className="flex justify-between items-center w-full px-base md:px-xl max-w-[1400px] mx-auto h-20">
          <Link to="/" className="font-headline text-headline-md font-bold text-on-surface tracking-tight hover:opacity-80 transition-opacity cursor-pointer">
            Paper<span className="text-primary-container">IQ</span>
          </Link>
          <div className="flex items-center gap-base">
            <span className="text-on-surface text-body-sm hidden md:block">Step 1 of 3</span>
            <button onClick={() => navigate('/auth')} className="text-primary-container font-bold text-body-md hover:brightness-110 transition-all">
              Log In
            </button>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center px-base py-section">
          <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-12 gap-xxl items-center">
            {/* Left: form */}
            <div className="lg:col-span-5 flex flex-col gap-xl max-w-[440px] mx-auto lg:mx-0 order-2 lg:order-1">
              {/* Step indicator */}
              <div className="flex items-center gap-md font-data-label text-[10px] uppercase tracking-[0.2em]">
                <div className="flex items-center gap-sm text-primary-container">
                  <span className="w-5 h-5 rounded-full border border-primary-container flex items-center justify-center text-[10px]">01</span>
                  <span>Account</span>
                </div>
                <div className="h-[1px] w-8 bg-surface-container-highest" />
                <div className="flex items-center gap-sm text-secondary">
                  <span className="w-5 h-5 rounded-full border border-surface-container-highest flex items-center justify-center text-[10px]">02</span>
                  <span>Profile</span>
                </div>
                <div className="h-[1px] w-8 bg-surface-container-highest" />
                <div className="flex items-center gap-sm text-secondary">
                  <span className="w-5 h-5 rounded-full border border-surface-container-highest flex items-center justify-center text-[10px]">03</span>
                  <span>Analysis</span>
                </div>
              </div>

              <div className="space-y-md">
                <h1 className="font-headline text-[40px] text-on-surface leading-tight font-bold tracking-tight">
                  Stop Guessing. See What Actually Matters.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface">Join students using data to skip the guesswork.</p>
              </div>

              <div className="bg-surface-container border border-surface-container-highest rounded-xl p-xl space-y-xl shadow-2xl">
                {/* Google */}
                <button
                  onClick={signInWithGoogle}
                  disabled={loading}
                  className="w-full bg-white text-black font-bold py-md px-base rounded-lg flex items-center justify-center gap-md hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-base text-surface-variant">
                  <div className="h-[1px] flex-grow bg-surface-container-highest" />
                  <span className="font-data-label text-[10px] uppercase tracking-widest text-secondary">or use email</span>
                  <div className="h-[1px] flex-grow bg-surface-container-highest" />
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-lg">
                  <div className="space-y-sm">
                    <label className="font-data-label text-[11px] text-secondary uppercase tracking-widest">University Email</label>
                    <input
                      type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-lg px-base py-md text-on-surface focus:outline-none focus:border-primary-container transition-all"
                    />
                  </div>
                  <div className="space-y-sm">
                    <label className="font-data-label text-[11px] text-secondary uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" minLength={6}
                        className="w-full bg-surface-container-lowest border border-surface-container-highest rounded-lg px-base py-md text-on-surface focus:outline-none focus:border-primary-container transition-all pr-12"
                      />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-base top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-error text-body-sm">{error}</p>}
                  <ActionButton
                    type="submit" disabled={submitting} isLoading={submitting}
                    className="w-full bg-primary-container text-white font-bold py-md px-base rounded-lg hover:brightness-110 transition-all active:scale-[0.98] uppercase tracking-wider disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Free Account'}
                  </ActionButton>
                </form>

                <p className="text-center font-body-sm text-body-sm text-secondary">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/auth')} className="text-primary-container hover:underline font-semibold">Log In</button>
                </p>
              </div>

              <div className="flex items-center gap-sm text-secondary font-body-sm">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <p>We never share hall tickets or academic records. Your data stays private.</p>
              </div>
            </div>

            {/* Right: preview */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <div className="bg-surface-container-low border-2 border-surface-container-highest rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="p-xl border-b border-surface-container-highest bg-surface-container-low flex justify-between items-center">
                  <div>
                    <h2 className="font-headline text-on-surface tracking-tight">Your Exam Analysis Preview</h2>
                    <p className="font-body-sm text-secondary">Real-time analysis for Computer Science Core</p>
                  </div>
                  <div className="flex gap-sm">
                    <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                    <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
                  </div>
                </div>
                <div className="p-xl space-y-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                    {[
                      { label:'Data Structures', value:'94%', sub:'Priority Score', highlight:true },
                      { label:'Analysis', value:'124', sub:'Questions Scoped', highlight:false },
                      { label:'Recommendation', value:'Focus on Unit III first', sub:'', highlight:true, small:true },
                    ].map(c => (
                      <div key={c.label} className={`bg-surface-container p-lg border rounded-xl ${c.highlight ? 'border-primary-container/30' : 'border-surface-container-highest'}`}>
                        <p className="font-data-label text-[10px] uppercase tracking-widest mb-base text-secondary">{c.label}</p>
                        <p className={`font-headline text-on-surface ${c.small ? 'text-lg leading-tight' : 'text-3xl'} ${c.highlight ? 'text-primary-container' : ''}`}>{c.value}</p>
                        {c.sub && <p className="font-body-sm text-secondary mt-xs">{c.sub}</p>}
                      </div>
                    ))}
                  </div>
                  <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-xl space-y-lg">
                    <div className="flex justify-between items-center mb-base">
                      <h3 className="font-headline text-on-surface text-base">Concept Breakdown</h3>
                      <span className="font-data-label text-primary-container text-[11px] bg-primary-container/10 px-md py-xs rounded-full">ACTIVE ANALYTICS</span>
                    </div>
                    {[{label:'DBMS',pct:88},{label:'Operating Systems',pct:72},{label:'Computer Networks',pct:64},{label:'Python Programming',pct:45}].map(r => (
                      <div key={r.label} className="grid grid-cols-12 items-center gap-base">
                        <div className="col-span-4 font-body-md text-on-surface">{r.label}</div>
                        <div className="col-span-6 h-2 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="bg-primary-container h-full" style={{width:`${r.pct}%`, opacity: r.pct > 70 ? 1 : r.pct > 50 ? 0.6 : 0.4}} />
                        </div>
                        <div className="col-span-2 text-right font-headline text-on-surface">{r.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col font-body"
      style={{backgroundImage:'radial-gradient(at 0% 0%, rgba(249,115,22,0.05) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(157,67,0,0.05) 0, transparent 50%)'}}>
      <nav className="fixed top-0 w-full z-50 h-20 flex justify-between items-center px-base md:px-xl max-w-[1200px] mx-auto left-0 right-0">
        <Link 
          to="/" 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Logo clicked - navigating to landing');
          }}
          className="font-headline text-headline-md font-bold text-on-surface hover:opacity-80 transition-opacity cursor-pointer"
        >
          Paper<span className="text-primary-container">IQ</span>
        </Link>
        <div className="flex items-center gap-base">
          <a href="#" className="text-on-surface-variant text-body-sm hover:text-on-surface transition-colors">Academic Integrity</a>
          <button
            onClick={() => navigate('/auth?mode=signup')}
            className="bg-primary-container text-on-primary-container px-md py-xs rounded-xl font-bold hover:scale-95 transition-transform"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center px-base pt-20 pb-base">
        <div className="w-full max-w-[480px]">
          <div className="bg-surface-container-low border border-white/[0.08] p-xxl rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <header className="text-center mb-xl">
                <h1 className="font-headline text-headline-lg mb-sm tracking-tight">Welcome Back to Your Insights</h1>
                <p className="font-body-md text-body-md text-white/60">Pick up where you left off</p>
              </header>

              {/* Google */}
              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full h-12 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-base hover:bg-neutral-200 transition-colors mb-lg group disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-base mb-lg text-on-surface-variant/40">
                <div className="h-[1px] flex-grow bg-outline-variant/30" />
                <span className="font-data-label text-data-label uppercase">or use email</span>
                <div className="h-[1px] flex-grow bg-outline-variant/30" />
              </div>

              {/* Email/password form */}
              <form onSubmit={handleEmailAuth} className="space-y-base">
                <div>
                  <label className="block font-data-label text-data-label text-white/50 mb-xs" htmlFor="email">EMAIL ADDRESS</label>
                  <input
                    id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="name@scholar.edu"
                    className="w-full bg-[#0f0f0f] border border-white/[0.08] rounded-xl px-base py-md text-on-surface font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-xs">
                    <label className="block font-data-label text-data-label text-white/50" htmlFor="password">PASSWORD</label>
                    <button
                      type="button"
                      onClick={() => navigate('/auth?mode=forgot')}
                      className="text-primary text-body-sm hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password" type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0f0f0f] border border-white/[0.08] rounded-xl px-base py-md text-on-surface font-body-md focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
                    />
                    <button
                      type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-base top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                {error && <p className="text-error text-body-sm">{error}</p>}
                <button
                  type="submit" disabled={submitting}
                  className="w-full h-12 bg-primary-container text-on-primary-container font-bold rounded-xl hover:brightness-110 transition-all active:scale-[0.98] mt-lg disabled:opacity-50"
                >
                  {submitting ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            </div>

            {/* Atmospheric glares */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
          </div>

          <p className="text-center mt-xl font-body-md text-body-md text-white/40">
            Don't have an account?{' '}
            <button onClick={() => navigate('/auth?mode=signup')} className="text-primary font-semibold hover:underline">
              Sign Up
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}
