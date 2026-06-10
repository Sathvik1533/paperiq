import { useEffect } from 'react'
import { VoteButton } from '../components/VoteButton';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer'
import { PageTransition } from '../components/ui/PageTransition'
import { useNavigate } from 'react-router-dom'

export function Vision() {
  const navigate = useNavigate()

  useEffect(() => {
    // Intersection Observer for scroll-triggered reveals
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Add staggered entry to children if it's a grid
                if (entry.target.classList.contains('grid')) {
                    const cards = entry.target.querySelectorAll('.glass');
                    cards.forEach((card, i) => {
                        setTimeout(() => {
                            card.classList.add('pop-in');
                        }, i * 50);
                    });
                }
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Background Drift Effect (Parallax-ish on scroll)
    const handleScroll = () => {
        const scrolled = window.pageYOffset;
        const gridBg = document.querySelector('.grid-bg') as HTMLElement;
        if (gridBg) {
            gridBg.style.transform = `translateY(${scrolled * 0.05}px)`;
        }
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      revealObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Interactive Glass Cards Mouse Move (Glow position) is handled in CSS mostly, but JS was setting CSS vars
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }

    const cards = document.querySelectorAll('.glass')
    cards.forEach(card => card.addEventListener('mousemove', handleMouseMove as EventListener))

    return () => {
      cards.forEach(card => card.removeEventListener('mousemove', handleMouseMove as EventListener))
    }
  }, [])

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#050507] text-on-background font-body-md selection:bg-primary-container selection:text-white">
        <style dangerouslySetInnerHTML={{__html: `
          .glass {
              background: rgba(255, 255, 255, 0.03);
              backdrop-filter: blur(12px);
              -webkit-backdrop-filter: blur(12px);
              border: 1px solid rgba(255, 255, 255, 0.05);
              transition: transform 0.4s cubic-bezier(0.2, 0, 0, 1), border-color 0.4s ease, box-shadow 0.4s ease;
          }

          .glass:hover {
              transform: scale(1.02);
              border-color: rgba(249, 115, 22, 0.4);
              box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(249, 115, 22, 0.15);
              z-index: 10;
          }

          .grid-bg {
              background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
              background-size: 40px 40px;
              animation: grid-drift 60s linear infinite;
          }

          @keyframes grid-drift {
              from { background-position: 0 0; }
              to { background-position: 40px 40px; }
          }

          @keyframes pulse-soft {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.05); }
          }

          .animate-pulse-soft {
              animation: pulse-soft 3s ease-in-out infinite;
          }

          @keyframes breathing {
              0%, 100% { filter: brightness(1); }
              50% { filter: brightness(1.2); }
          }

          .animate-breathing {
              animation: breathing 4s ease-in-out infinite;
          }

          @keyframes reveal-up {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }

          .reveal {
              opacity: 0;
              transform: translateY(30px);
              transition: opacity 0.8s cubic-bezier(0.2, 0, 0, 1), transform 0.8s cubic-bezier(0.2, 0, 0, 1);
          }

          .reveal.active {
              opacity: 1;
              transform: translateY(0);
          }

          .timeline-gradient {
              background: linear-gradient(90deg, #f97316 0%, #8b5cf6 50%, #3b82f6 100%);
          }

          .section-separator {
              height: 1px;
              width: 100%;
              background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.2), transparent);
              margin-top: 2rem;
          }

          .pop-in {
              animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          @keyframes pop-in {
              from { transform: scale(0.5); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
              .reveal, .glass, .grid-bg, .animate-pulse-soft, .animate-breathing, .pop-in {
                  animation: none !important;
                  transition: none !important;
                  transform: none !important;
                  opacity: 1 !important;
              }
          }

          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
        <div className="fixed inset-0 grid-bg pointer-events-none z-0"></div>
        
        <NavBar activeTab="vision" />

        <main className="relative z-10 max-w-[1200px] mx-auto px-lg pt-16">
          {/* Hero Section */}
          <section className="py-huge text-center flex flex-col items-center">
            <h1 className="font-display-hero text-[36px] md:text-display-hero max-w-4xl mx-auto mb-base opacity-0 translate-y-4 font-bold" style={{ animation: 'reveal-up 1s forwards' }}>
              From Exam Tool <span className="text-primary-container">→</span> Student Operating System
            </h1>
            <p className="text-on-surface-variant font-body-lg max-w-2xl mb-xxl opacity-0 translate-y-4" style={{ animation: 'reveal-up 1s 0.2s forwards' }}>
              We're not just parsing PDFs. We're building the intelligence layer that powers every academic decision a student makes.
            </p>
            {/* Timeline */}
            <div className="w-full max-w-3xl relative mt-xl opacity-0 translate-y-4 overflow-x-auto pb-10 hide-scrollbar" style={{ animation: 'reveal-up 1s 0.4s forwards' }}>
              <div className="min-w-[600px] md:min-w-0 relative pt-16 md:pt-12">
                <div className="h-1 timeline-gradient w-full rounded-full opacity-30"></div>
                <div className="absolute top-[64px] md:top-[48px] left-0 -translate-y-1/2 w-full flex justify-between px-2">
                {/* Layer 1 */}
                <div className="relative group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-primary-container shadow-[0_0_15px_#f97316] animate-pulse-soft transition-transform group-hover:scale-125"></div>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-100 group-hover:opacity-100 transition-opacity">
                    <span className="text-primary-container font-data-label flex items-center gap-1">You are here <span className="material-symbols-outlined text-[14px]">arrow_right_alt</span></span>
                  </div>
                  <div className="mt-4 text-primary-container font-bold text-sm">Exam Intelligence</div>
                  <VoteButton featureId="exam_intelligence" />
                </div>
                {/* Layer 2 */}
                <div className="relative group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-purple-500/40 transition-transform group-hover:scale-125 group-hover:bg-purple-500"></div>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-purple-400 font-data-label">Coming Soon</span>
                  </div>
                  <div className="mt-4 text-on-surface-variant/60 font-medium group-hover:text-purple-400 text-sm">Exam Mentor</div>
                  <VoteButton featureId="exam_mentor" />
                </div>
                {/* Layer 3 */}
                <div className="relative group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-blue-500/40 transition-transform group-hover:scale-125 group-hover:bg-blue-500"></div>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-400 font-data-label">The Vision</span>
                  </div>
                  <div className="mt-4 text-on-surface-variant/60 font-medium group-hover:text-blue-400 text-sm">Academic OS</div>
                  <VoteButton featureId="academic_os" />
                </div>
                {/* Layer 4 */}
                <div className="relative group cursor-pointer">
                  <div className="w-5 h-5 rounded-full bg-gray-500 transition-transform group-hover:scale-125 group-hover:bg-white"></div>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-on-surface-variant font-data-label">The Future</span>
                  <VoteButton featureId="the_future" />
                  </div>
                  <div className="mt-4 text-on-surface-variant/40 font-medium group-hover:text-on-surface text-sm">Platform</div>
                </div>
              </div>
            </div>
            </div>
          </section>
          
          <div className="section-separator"></div>

          {/* Section 1: Layer 1 - Exam Intelligence */}
          <section className="py-xxl reveal">
            <div className="flex items-center gap-md mb-xl">
              <span className="bg-green-500/10 text-green-500 text-data-label px-sm py-1 rounded-full flex items-center gap-2 border border-green-500/20 animate-pulse-soft text-[10px]">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                LIVE NOW
              </span>
              <h2 className="font-headline-lg text-headline-lg font-bold">Layer 1 — Exam Intelligence</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-base mb-xxl">
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">key</span>
                <h3 className="font-headline-md text-body-md font-bold">Authentication</h3>
                <p className="text-body-sm text-on-surface-variant">Secure student access portal.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">find_in_page</span>
                <h3 className="font-headline-md text-body-md font-bold">Paper Discovery</h3>
                <p className="text-body-sm text-on-surface-variant">Intelligent PYQ sourcing engine.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">database</span>
                <h3 className="font-headline-md text-body-md font-bold">Repository</h3>
                <p className="text-body-sm text-on-surface-variant">Infinite cloud storage for materials.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">data_object</span>
                <h3 className="font-headline-md text-body-md font-bold">Parsing</h3>
                <p className="text-body-sm text-on-surface-variant">Neural structure extraction.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">map</span>
                <h3 className="font-headline-md text-body-md font-bold">Syllabus Mapping</h3>
                <p className="text-body-sm text-on-surface-variant">Align papers to course outcomes.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">analytics</span>
                <h3 className="font-headline-md text-body-md font-bold">Pattern Analysis</h3>
                <p className="text-body-sm text-on-surface-variant">Predict high-probability topics.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">event_note</span>
                <h3 className="font-headline-md text-body-md font-bold">Study Planner</h3>
                <p className="text-body-sm text-on-surface-variant">Automated exam countdowns.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">bolt</span>
                <h3 className="font-headline-md text-body-md font-bold">Readiness Score</h3>
                <p className="text-body-sm text-on-surface-variant">Real-time performance metric.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">forum</span>
                <h3 className="font-headline-md text-body-md font-bold">Evidence Chat</h3>
                <p className="text-body-sm text-on-surface-variant">Query documents with sources.</p>
              </div>
              <div className="glass p-base rounded-xl">
                <span className="material-symbols-outlined text-primary-container mb-2">content_copy</span>
                <h3 className="font-headline-md text-body-md font-bold">PYQ Replica</h3>
                <p className="text-body-sm text-on-surface-variant">Generate mock papers from trends.</p>
              </div>
            </div>
            
            {/* Pipeline Diagram */}
            <div className="glass p-xl rounded-2xl flex flex-col md:flex-row justify-between items-center gap-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-container/5 pointer-events-none transition-opacity group-hover:opacity-100"></div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-12 h-12 rounded-full border border-primary-container flex items-center justify-center text-primary-container bg-primary-container/10">Find</div>
                <span className="material-symbols-outlined text-on-surface-variant animate-pulse-soft transform rotate-90 md:rotate-0">arrow_forward</span>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-12 h-12 rounded-full border border-primary-container flex items-center justify-center text-primary-container bg-primary-container/10">Understand</div>
                <span className="material-symbols-outlined text-on-surface-variant animate-pulse-soft transform rotate-90 md:rotate-0">arrow_forward</span>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-12 h-12 rounded-full border border-primary-container flex items-center justify-center text-primary-container bg-primary-container/10">Study</div>
                <span className="material-symbols-outlined text-on-surface-variant animate-pulse-soft transform rotate-90 md:rotate-0">arrow_forward</span>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="w-12 h-12 rounded-full border border-primary-container flex items-center justify-center text-primary-container bg-primary-container/10">Practice</div>
                <span className="material-symbols-outlined text-on-surface-variant animate-pulse-soft transform rotate-90 md:rotate-0">arrow_forward</span>
              </div>
              <div className="flex flex-col items-center gap-sm">
                <div className="px-8 py-3 rounded-full bg-primary-container text-white font-bold shadow-[0_0_20px_#f97316] animate-breathing transform group-hover:scale-110 transition-transform">READY</div>
              </div>
            </div>
          </section>

          <div className="section-separator"></div>

          {/* Section 2: Layer 2 - Exam Mentor */}
          <section className="py-xxl reveal">
            <div className="flex items-center gap-md mb-xl">
              <span className="bg-purple-500/10 text-purple-400 text-data-label px-sm py-1 rounded-full border border-purple-500/20 text-[10px]">COMING SOON</span>
              <h2 className="font-headline-lg text-headline-lg font-bold">Layer 2 — Exam Mentor</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-base">
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">AI Mentor</h3>
                <p className="text-body-sm text-on-surface-variant">Proactive study coaching.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Study Missions</h3>
                <p className="text-body-sm text-on-surface-variant">Gamified daily challenges.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Check-ins</h3>
                <p className="text-body-sm text-on-surface-variant">Weekly progress alignment.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Countdown</h3>
                <p className="text-body-sm text-on-surface-variant">Dynamic priority sorting.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Mastery</h3>
                <p className="text-body-sm text-on-surface-variant">Topic confidence tracking.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Memory</h3>
                <p className="text-body-sm text-on-surface-variant">Spaced repetition engine.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Mock Generator</h3>
                <p className="text-body-sm text-on-surface-variant">Timed full-length tests.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Evaluation</h3>
                <p className="text-body-sm text-on-surface-variant">Automatic grading &amp; feedback.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Revision</h3>
                <p className="text-body-sm text-on-surface-variant">Personalized summary sheets.</p>
              </div>
              <div className="glass p-base rounded-xl border-purple-500/10 relative overflow-hidden group">
                <span className="material-symbols-outlined text-purple-400 mb-2 group-hover:rotate-12 transition-transform">lock</span>
                <h3 className="font-headline-md text-body-md font-bold">Dashboard</h3>
                <p className="text-body-sm text-on-surface-variant">Central mentor control room.</p>
              </div>
            </div>
          </section>

          <div className="section-separator opacity-10"></div>

          {/* Section 3: Layer 3 - Academic OS */}
          <section className="py-xxl reveal">
            <div className="flex items-center gap-md mb-xl">
              <span className="bg-blue-500/10 text-blue-400 text-data-label px-sm py-1 rounded-full border border-blue-500/20 text-[10px]">THE VISION</span>
              <h2 className="font-headline-lg text-headline-lg font-bold">Layer 3 — Academic OS</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-base">
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Academic Copilot</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">trending_up</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">CGPA Engine</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Difficulty Analysis</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">timeline</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Forecasting</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Viva Trainer</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">school</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Multi-Subject</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">strategy</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Strategy Engine</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">speed</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Progress Monitor</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">priority_high</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Weakness Radar</span>
              </div>
              <div className="glass p-sm rounded-lg border-l-2 border-blue-500 flex items-center gap-sm group">
                <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-110">
                  <span className="material-symbols-outlined text-[18px]">memory</span>
                </div>
                <span className="font-data-label text-[11px] uppercase tracking-wider">Long-term Memory</span>
              </div>
            </div>
          </section>

          <div className="section-separator opacity-10"></div>

          {/* Section 4: Layer 4 - Platform */}
          <section className="py-xxl reveal opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <div className="flex items-center gap-md mb-xl">
              <span className="bg-secondary-container/20 text-on-surface-variant text-data-label px-sm py-1 rounded-full border border-outline-variant text-[10px]">MUCH LATER</span>
              <h2 className="font-headline-lg text-headline-lg font-bold">Layer 4 — Platform</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
              <div className="glass p-base rounded-xl border-dashed border-outline-variant group">
                <h3 className="font-data-label text-on-surface mb-2 group-hover:text-primary-container transition-colors">Multi-College Ecosystem</h3>
                <p className="text-body-sm text-on-surface-variant">Inter-varsity resource sharing.</p>
              </div>
              <div className="glass p-base rounded-xl border-dashed border-outline-variant group">
                <h3 className="font-data-label text-on-surface mb-2 group-hover:text-primary-container transition-colors">Faculty Integration</h3>
                <p className="text-body-sm text-on-surface-variant">Direct content supply chains.</p>
              </div>
              <div className="glass p-base rounded-xl border-dashed border-outline-variant group">
                <h3 className="font-data-label text-on-surface mb-2 group-hover:text-primary-container transition-colors">Unified Question Bank</h3>
                <p className="text-body-sm text-on-surface-variant">Global standard of assessment.</p>
              </div>
              <div className="glass p-base rounded-xl border-dashed border-outline-variant group">
                <h3 className="font-data-label text-on-surface mb-2 group-hover:text-primary-container transition-colors">Enterprise Analytics</h3>
                <p className="text-body-sm text-on-surface-variant">Large-scale academic trends.</p>
              </div>
              <div className="glass p-base rounded-xl border-dashed border-outline-variant group">
                <h3 className="font-data-label text-on-surface mb-2 group-hover:text-primary-container transition-colors">Government Reports</h3>
                <p className="text-body-sm text-on-surface-variant">Education policy insights.</p>
              </div>
              <div className="glass p-base rounded-xl border-dashed border-outline-variant group">
                <h3 className="font-data-label text-on-surface mb-2 group-hover:text-primary-container transition-colors">Global Dashboards</h3>
                <p className="text-body-sm text-on-surface-variant">World-wide student mastery.</p>
              </div>
            </div>
          </section>

          {/* Section 6: North Star Metric */}
          <section className="py-section reveal mt-12">
            <div className="max-w-4xl mx-auto glass p-xxl rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-lg opacity-20 transform group-hover:rotate-12 transition-transform duration-700">
                <span className="material-symbols-outlined text-[120px] text-primary-container">speed</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg mb-base font-bold">Our North Star Metric</h2>
              <div className="text-[48px] md:text-[64px] font-bold text-primary-container drop-shadow-[0_0_30px_rgba(249,115,22,0.4)] mb-huge leading-tight group-hover:tracking-wider transition-all duration-700">Student Readiness</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-xl">
                <div className="flex flex-col gap-sm">
                  <span className="text-green-400 font-bold">Spotify</span>
                  <span className="text-on-surface-variant text-body-sm">Time Spent Listening</span>
                </div>
                <div className="flex flex-col gap-sm">
                  <span className="text-orange-400 font-bold">Duolingo</span>
                  <span className="text-on-surface-variant text-body-sm">Daily Streaks</span>
                </div>
                <div className="flex flex-col gap-sm">
                  <span className="text-white font-bold">GitHub</span>
                  <span className="text-on-surface-variant text-body-sm">Contributions</span>
                </div>
                <div className="flex flex-col gap-sm p-base bg-primary-container/10 border border-primary-container/20 rounded-xl animate-pulse-soft">
                  <span className="text-primary-container font-bold">PaperIQ</span>
                  <span className="text-on-surface font-body-sm">Exam Readiness %</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: CTA */}
          <section className="py-section pb-huge reveal mt-12 mb-24">
            <div className="bg-gradient-to-br from-primary-container to-orange-700 p-huge rounded-[40px] text-center flex flex-col items-center shadow-[0_20px_60px_-15px_rgba(249,115,22,0.4)] animate-breathing hover:shadow-[0_30px_80px_-10px_rgba(249,115,22,0.6)] transition-shadow">
              <h2 className="font-display-hero-mobile text-white mb-base reveal font-bold text-3xl md:text-4xl">We're Building Layer 1 Right Now</h2>
              <p className="text-white/80 font-body-lg max-w-xl mb-xl">Join thousands of students who are already using PaperIQ to dominate their exams with zero stress.</p>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-white text-primary-container px-huge py-lg rounded-full font-bold text-lg hover:scale-105 hover:-translate-y-1 hover:shadow-2xl transition-all active:scale-95 shadow-xl"
              >
                Start Using PaperIQ
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  )
}
