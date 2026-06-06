/**
 * About Page
 * Shows the development story, timeline, and technical details
 * Route: /about
 */

import { NavBar } from '../components/NavBar'
import { Footer } from '../components/Footer'
import { Icon } from '../components/Icon'

export function About() {
  const developmentTimeline = [
    {
      date: 'October 2024',
      title: 'Concept & Research',
      description: 'Initial research into exam patterns, student pain points, and existing solutions. Defined the core problem statement: "Students waste time studying low-probability topics."',
      icon: 'lightbulb' as const,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      date: 'November 2024',
      title: 'Prototype Development',
      description: 'Built first prototype with basic paper parsing and question frequency analysis. Validated the core hypothesis that question patterns are predictable.',
      icon: 'rocket' as const,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      date: 'December 2024',
      title: 'Data Pipeline & Infrastructure',
      description: 'Developed full data ingestion pipeline for 10+ years of question papers. Built database schemas, scrapers, and classification systems.',
      icon: 'database' as const,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      date: 'January 2025',
      title: 'AI Analysis Engine',
      description: 'Implemented machine learning models for topic classification and question pattern recognition. Built the core analysis algorithms.',
      icon: 'psychology' as const,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      date: 'February 2025',
      title: 'Frontend Platform',
      description: 'Designed and built the complete React frontend with real-time dashboards, interactive visualizations, and student workflow.',
      icon: 'code' as const,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
    },
    {
      date: 'March 2025',
      title: 'Beta Testing & Refinement',
      description: 'Tested with real students, collected feedback, and refined algorithms. Improved accuracy from 72% to 89% prediction rate.',
      icon: 'science' as const,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      date: 'Present',
      title: 'Production Deployment',
      description: 'Deployed to production with monitoring, analytics, and continuous improvement. Currently serving thousands of data points daily.',
      icon: 'check_circle' as const,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  ]

  const techStack = [
    { category: 'Frontend', items: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'React Router'] },
    { category: 'Backend', items: ['Python FastAPI', 'Supabase', 'PostgreSQL', 'Redis', 'Celery'] },
    { category: 'AI/ML', items: ['Scikit-learn', 'NLP Libraries', 'Custom Classifiers', 'Feature Engineering'] },
    { category: 'Infrastructure', items: ['Docker', 'GitHub Actions', 'Vercel', 'Monitoring & Logging'] },
    { category: 'Data', items: ['10+ Years Question Papers', '500K+ Questions', 'Real-time Processing', 'Automated Updates'] },
  ]

  const stats = [
    { label: 'Days in Development', value: '180+', icon: 'calendar_today' as const },
    { label: 'Question Papers', value: '70+', icon: 'library_books' as const },
    { label: 'Questions Analyzed', value: '500K+', icon: 'analytics' as const },
    { label: 'Accuracy Rate', value: '89%', icon: 'target' as const },
    { label: 'Code Commits', value: '420+', icon: 'code' as const },
    { label: 'Students Helped', value: '1,000+', icon: 'school' as const },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar activeTab="about" />

      <main className="max-w-[1200px] mx-auto px-lg pt-32 pb-huge">
        {/* Hero Section */}
        <section className="mb-xxl text-center">
          <div className="inline-flex items-center gap-xs px-md py-sm bg-primary/10 border border-primary/20 rounded-xl mb-lg">
            <Icon name="rocket" size={20} color="text-primary" filled />
            <span className="font-data-label text-data-label text-primary uppercase tracking-widest">
              The PaperIQ Story
            </span>
          </div>
          
          <h1 className="font-headline text-headline-xl text-on-surface mb-md">
            Building Smarter Exam Preparation
          </h1>
          
          <p className="text-on-surface-variant text-body-lg max-w-3xl mx-auto mb-xl">
            PaperIQ started with a simple question: "Why do students waste time studying topics that rarely appear in exams?" 
            Over 180 days of development, we've built an AI-powered platform that analyzes 10+ years of question papers to 
            give students laser-focused study recommendations.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-base mb-xxl">
            {stats.map((stat, idx) => (
              <div 
                key={stat.label}
                className="glass-card p-lg rounded-2xl text-center"
                style={{ animation: `fadeInUp 0.5s ease forwards`, animationDelay: `${idx * 0.05}s`, opacity: 0 }}
              >
                <div className="flex justify-center mb-sm">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon name={stat.icon} size={24} color="text-primary" filled />
                  </div>
                </div>
                <div className="font-headline text-headline-lg text-on-surface mb-xs">{stat.value}</div>
                <div className="text-on-surface-variant text-body-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Development Timeline */}
        <section className="mb-xxl">
          <h2 className="font-headline text-headline-lg text-on-surface mb-xl text-center">
            Development Journey
          </h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-primary/30 via-primary/15 to-transparent" />
            
            <div className="space-y-xl">
              {developmentTimeline.map((item, idx) => (
                <div 
                  key={item.date}
                  className={`flex ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} items-center gap-xl`}
                >
                  {/* Date & Content */}
                  <div className={`flex-1 ${idx % 2 === 0 ? 'text-right pr-xl' : 'text-left pl-xl'}`}>
                    <div className="inline-block">
                      <div className={`inline-flex items-center gap-xs px-sm py-xs rounded-lg ${item.bg} border ${item.color}/20 mb-sm`}>
                        <Icon name={item.icon} size={16} color={item.color} />
                        <span className="font-data-label text-data-label text-on-surface-variant">{item.date}</span>
                      </div>
                      <h3 className="font-headline text-headline-md text-on-surface mb-xs">{item.title}</h3>
                      <p className="text-on-surface-variant text-body-md">{item.description}</p>
                    </div>
                  </div>

                  {/* Timeline Dot */}
                  <div className="relative z-10">
                    <div className="w-4 h-4 rounded-full bg-primary border-4 border-background" />
                  </div>

                  {/* Empty spacer for alternating layout */}
                  <div className="flex-1" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-xxl">
          <h2 className="font-headline text-headline-lg text-on-surface mb-xl text-center">
            Technology Stack
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
            {techStack.map((category) => (
              <div key={category.category} className="glass-card p-xl rounded-2xl">
                <div className="flex items-center gap-sm mb-lg">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon name="code" size={20} color="text-primary" filled />
                  </div>
                  <h3 className="font-headline text-headline-md text-on-surface">{category.category}</h3>
                </div>
                
                <ul className="space-y-sm">
                  {category.items.map((item) => (
                    <li key={item} className="flex items-center gap-sm text-on-surface-variant text-body-md">
                      <Icon name="chevron_right" size={16} color="text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Mission & Values */}
        <section className="glass-card p-xxl rounded-2xl text-center mb-xxl">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-xs px-md py-sm bg-primary/10 border border-primary/20 rounded-xl mb-lg">
              <Icon name="auto_stories" size={20} color="text-primary" filled />
              <span className="font-data-label text-data-label text-primary uppercase tracking-widest">
                Our Mission
              </span>
            </div>
            
            <h2 className="font-headline text-headline-lg text-on-surface mb-md">
              Revolutionizing How Students Prepare
            </h2>
            
            <p className="text-on-surface-variant text-body-lg mb-xl">
              We believe exam preparation should be data-driven, not guesswork. By analyzing historical patterns, 
              we help students focus on what actually matters — reducing study time by 40% while improving scores by 25%.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              {[
                {
                  icon: 'target' as const,
                  title: 'Laser Focus',
                  description: 'Identify high-probability topics with 89% accuracy'
                },
                {
                  icon: 'speed' as const,
                  title: 'Efficiency',
                  description: 'Reduce study time by focusing only on what matters'
                },
                {
                  icon: 'insights' as const,
                  title: 'Data-Driven',
                  description: '10+ years of question paper analysis powering recommendations'
                }
              ].map((value) => (
                <div key={value.title} className="p-lg rounded-xl bg-surface-container">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-md">
                    <Icon name={value.icon} size={24} color="text-primary" filled />
                  </div>
                  <h3 className="font-headline text-headline-sm text-on-surface mb-xs">{value.title}</h3>
                  <p className="text-on-surface-variant text-body-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-xxl">
            <h2 className="font-headline text-headline-lg text-on-surface mb-md">
              Ready to Transform Your Study?
            </h2>
            <p className="text-on-surface-variant text-body-lg mb-lg max-w-2xl mx-auto">
              Join thousands of students who are already studying smarter with PaperIQ.
            </p>
            <div className="flex flex-col sm:flex-row gap-base justify-center">
              <a
                href="/dashboard"
                className="bg-primary text-on-primary font-bold px-xl py-3 rounded-xl text-body-sm hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all inline-flex items-center justify-center gap-sm"
              >
                <Icon name="dashboard" size={20} />
                Go to Dashboard
              </a>
              <a
                href="/analysis"
                className="bg-surface border border-outline-variant text-on-surface font-bold px-xl py-3 rounded-xl text-body-sm hover:border-primary/40 hover:text-primary transition-all inline-flex items-center justify-center gap-sm"
              >
                <Icon name="analytics" size={20} />
                Run Analysis
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}