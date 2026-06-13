'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index)
  }

  const faqs = [
    {
      q: "How do teachers share notes with students?",
      a: "Teachers can upload study notes, files, or reference links directly from their Teacher Portal. These materials are instantly published and become visible to all students in their dashboard under the 'Shared Notes' section."
    },
    {
      q: "Can parents monitor their children's progress?",
      a: "Yes. When a parent registers, they link their account to their child's enrollment number. Parents get a dedicated dashboard displaying their children's study hours, focus attendance, and a chronological log of remarks and observations posted by school teachers."
    },
    {
      q: "What is the custom login identifier?",
      a: "To make access simple for schools, students log in using their official school Enrollment Number, and teachers log in using their Teacher ID. Parents log in with their email, which automatically links to their child's account."
    },
    {
      q: "Is there an AI tutor in the student dashboard?",
      a: "Absolutely! Students have access to an AI Doubt Solver for step-by-step math and science resolutions, an AI Study Planner to generate custom schedules, and an adaptive AI Quiz Engine."
    }
  ]

  const features = [
    { icon: '📝', title: 'Teacher Study Notes', desc: 'Teachers can upload lectures, PDFs, or notes. Students access them in a single click.' },
    { icon: '📋', title: 'Student Progress Logs', desc: 'Official remarks logged by teachers regarding academic, behavior, and attendance metrics.' },
    { icon: '🤖', title: 'AI Doubt Solver', desc: 'Instant step-by-step textbook explanations and doubt resolutions powered by LLMs.' },
    { icon: '⏱️', title: 'Gamified Focus Timer', desc: 'Pomodoro-style timers with streaks, XP levels, and multiplier rewards to make learning fun.' },
    { icon: '📅', title: 'AI Study Planner', desc: 'Schedules generated automatically based on difficulty, exam calendar, and syllabus.' },
    { icon: '🏆', title: 'Unified Achievements', desc: 'XP points, leaderboards, and badges to motivate continuous learning habits.' }
  ]

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* GLOW EFFECTS */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />

      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_75%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* HEADER NAVBAR */}
      <header className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-550/20">
            <span className="text-white font-black text-sm">E</span>
          </div>
          <span className="font-extrabold text-white text-lg tracking-tight">EduAI</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-slate-450 hover:text-white transition-all">
            Login
          </Link>
          <Link href="/auth/signup" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-650/15 hover:shadow-indigo-650/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
            Get Started
          </Link>
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
        >
          <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
        </button>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-slate-900 border-b border-slate-800 p-6 z-40 space-y-4 animate-in slide-in-from-top duration-200">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-slate-350 hover:text-white font-medium">Features</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-slate-350 hover:text-white font-medium">Pricing</a>
          <a href="#faqs" onClick={() => setMobileMenuOpen(false)} className="block text-slate-350 hover:text-white font-medium">FAQs</a>
          <div className="h-px bg-slate-800 my-4" />
          <div className="flex flex-col gap-3">
            <Link href="/auth/login" className="text-center py-2.5 text-sm font-semibold text-slate-350 border border-slate-700 rounded-xl hover:text-white">
              Login
            </Link>
            <Link href="/auth/signup" className="text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-md">
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center relative z-10 space-y-6">
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-900/40 text-indigo-300 border border-indigo-500/20 inline-block shadow-inner">
          🚀 Version 2.0: Now with School & Parent Portals
        </span>
        
        <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.15] tracking-tight max-w-4xl mx-auto">
          AI-Powered Learning, <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Engineered for Indian Classrooms
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Unified portal linking Students, Teachers, and Parents. Share notes, track observation logs, plan with AI, and master topics dynamically.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/auth/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-base font-extrabold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            Start Learning Free →
          </Link>
          <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-350 hover:text-white text-base font-bold rounded-2xl transition-all">
            Explore Features
          </a>
        </div>
      </section>

      {/* VISUAL DASHBOARD MOCKUP PREVIEW */}
      <section className="max-w-5xl mx-auto px-6 pb-20 relative z-10">
        <div className="p-3 bg-slate-900/60 rounded-[2.5rem] border border-slate-800/40 shadow-2xl relative">
          <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] blur-xl pointer-events-none" />
          
          <div className="bg-slate-950 rounded-[2rem] border border-slate-800/60 overflow-hidden shadow-inner flex flex-col md:flex-row h-[420px] text-xs text-slate-400 font-medium">
            
            {/* Sidebar Mockup */}
            <div className="w-48 bg-slate-900/60 border-r border-slate-800/80 p-4 space-y-4 hidden md:block">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <div className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black text-white">E</div>
                <span className="font-bold text-white text-[11px]">EduAI Portal</span>
              </div>
              <div className="space-y-1">
                <div className="bg-indigo-950/60 text-indigo-400 font-bold px-2 py-1.5 rounded-lg flex items-center gap-2"><span>🏠</span> Dashboard</div>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-800/40 flex items-center gap-2"><span>📚</span> Shared Notes</div>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-800/40 flex items-center gap-2"><span>📋</span> Progress Logs</div>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-800/40 flex items-center gap-2"><span>🤖</span> AI Tutor</div>
                <div className="px-2 py-1.5 rounded-lg hover:bg-slate-800/40 flex items-center gap-2"><span>⚙️</span> Settings</div>
              </div>
            </div>

            {/* Dashboard Content Mockup */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Welcome Back, Arjun! 👋</h3>
                  <p className="text-[10px] text-slate-500">Roll No: STU1024 · Standard 10</p>
                </div>
                <div className="flex items-center gap-1.5 bg-indigo-950/50 border border-indigo-900/40 px-2.5 py-1 rounded-full text-indigo-300 font-bold">
                  <span>⚡</span> Level 4 · 1,840 XP
                </div>
              </div>

              {/* Stats Card Grid Mockup */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 block">Focus Hours</span>
                  <span className="text-white font-extrabold text-sm block mt-0.5">8.4h</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 block">Study Streak</span>
                  <span className="text-white font-extrabold text-sm block mt-0.5">14 Days</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl">
                  <span className="text-slate-500 block">Teacher Notes</span>
                  <span className="text-white font-extrabold text-sm block mt-0.5">12 Shared</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-xl col-span-2 md:col-span-1">
                  <span className="text-slate-500 block">Teacher Remarks</span>
                  <span className="text-indigo-400 font-extrabold text-sm block mt-0.5">4 New Logs</span>
                </div>
              </div>

              {/* Remarks/Notes preview mockup */}
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Notes Widget */}
                <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-350">Recent Notes from Teacher</span>
                    <span className="text-indigo-400 text-[9px] font-bold">View all</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-850/60">
                      <span>📐 Trigonometry Formulas Sheet.pdf</span>
                      <span className="text-slate-500">2h ago</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-lg border border-slate-850/60">
                      <span>🧬 Periodic Table Trend Lecture.txt</span>
                      <span className="text-slate-500">Yesterday</span>
                    </div>
                  </div>
                </div>

                {/* Remarks Widget */}
                <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-350">Teacher Log & Comments</span>
                    <span className="text-[10px] text-green-400 font-bold">● Active</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850/60 space-y-1">
                      <div className="flex justify-between font-bold text-slate-350">
                        <span>Remarks by Mrs. Verma</span>
                        <span className="text-[9px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded-full">Academic</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed">"Arjun scored 90% in class test. Excellent participation in equations discussion."</p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* TRUST BANNER SECTION */}
      <section className="max-w-6xl mx-auto px-6 pb-20 text-center relative z-10 space-y-4">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Compatible with leading school boards</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-sm font-extrabold text-slate-550 opacity-60">
          <span className="px-3 py-1 bg-slate-900/60 border border-slate-800/40 rounded-lg">CBSE</span>
          <span className="px-3 py-1 bg-slate-900/60 border border-slate-800/40 rounded-lg">ICSE</span>
          <span className="px-3 py-1 bg-slate-900/60 border border-slate-800/40 rounded-lg">State Board</span>
          <span className="px-3 py-1 bg-slate-900/60 border border-slate-800/40 rounded-lg">IGCSE</span>
        </div>
      </section>

      {/* CORE FEATURES SECTION */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/40 relative z-10 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Everything You Need In One Ecosystem</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Consolidating classroom communication, study tools, and teacher logs into a single modern dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div 
              key={f.title} 
              className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/30 hover:border-slate-700/50 shadow-lg hover:shadow-indigo-950/20 hover:-translate-y-1 transition-all duration-300 group space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl group-hover:scale-105 group-hover:bg-indigo-950/40 group-hover:border-indigo-550/30 transition-all">
                {f.icon}
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-white text-base tracking-tight">{f.title}</h3>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/40 relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">Choose the tier that fits your studies or classroom.</p>
          
          {/* Toggle Button */}
          <div className="inline-flex items-center gap-3 bg-slate-900 border border-slate-800/80 p-1 rounded-xl">
            <button 
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isAnnual ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-450 hover:text-white'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isAnnual ? 'bg-indigo-650 text-white shadow-md' : 'text-slate-450 hover:text-white'}`}
            >
              Annually (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Basic tier */}
          <div className="p-8 rounded-3xl bg-slate-900/30 border border-slate-800/40 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest block">Student Starter</span>
              <div className="flex items-baseline text-white">
                <span className="text-3xl font-black">₹0</span>
                <span className="text-xs text-slate-500 ml-1">/ forever</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Essential AI tools and notes access for students just starting out.</p>
              <div className="h-px bg-slate-800/60" />
              <ul className="text-xs text-slate-350 space-y-2.5">
                <li className="flex items-center gap-2">✓ Access shared teacher notes</li>
                <li className="flex items-center gap-2">✓ Student performance logs</li>
                <li className="flex items-center gap-2">✓ 10 AI Doubt Solves / day</li>
                <li className="flex items-center gap-2">✓ Basic Pomodoro Timer</li>
              </ul>
            </div>
            <Link href="/auth/signup" className="w-full text-center py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-colors">
              Get Started Free
            </Link>
          </div>

          {/* Pro tier */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-indigo-500/25 relative flex flex-col justify-between space-y-6 shadow-xl shadow-indigo-950/10">
            <span className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white">Popular</span>
            <div className="space-y-4">
              <span className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest block">Student Pro</span>
              <div className="flex items-baseline text-white">
                <span className="text-3xl font-black">{isAnnual ? '₹199' : '₹249'}</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Full access to personalized AI generators, planners, and doubt solvers.</p>
              <div className="h-px bg-indigo-900/20" />
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-center gap-2 text-indigo-200">✓ Unlimited AI Doubt Solver</li>
                <li className="flex items-center gap-2">✓ Unlimited AI Study Planner</li>
                <li className="flex items-center gap-2">✓ Unlimited AI Quiz Engines</li>
                <li className="flex items-center gap-2">✓ Parent Linking Dashboard</li>
                <li className="flex items-center gap-2">✓ Streaks & Leaderboard multiplier</li>
              </ul>
            </div>
            <Link href="/auth/signup" className="w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-650/10 hover:shadow-indigo-550/30">
              Upgrade to Pro
            </Link>
          </div>

          {/* School License */}
          <div className="p-8 rounded-3xl bg-slate-900/30 border border-slate-800/40 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest block">School & Teachers</span>
              <div className="flex items-baseline text-white">
                <span className="text-3xl font-black">Custom</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">Deploy EduAI across classrooms. Allow teachers to upload notes and remark logs.</p>
              <div className="h-px bg-slate-800/60" />
              <ul className="text-xs text-slate-350 space-y-2.5">
                <li className="flex items-center gap-2">✓ Unlimited Teacher note uploads</li>
                <li className="flex items-center gap-2">✓ Child logging and parent notification portal</li>
                <li className="flex items-center gap-2">✓ Unified classroom reports</li>
                <li className="flex items-center gap-2">✓ Dedicated school domain integrations</li>
              </ul>
            </div>
            <a href="mailto:schools@eduai.in" className="w-full text-center py-2.5 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-bold transition-colors">
              Contact Sales
            </a>
          </div>

        </div>
      </section>

      {/* FAQS SECTION */}
      <section id="faqs" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-800/40 relative z-10 space-y-10">
        <h2 className="text-3xl font-extrabold text-center text-white tracking-tight">Frequently Asked Questions</h2>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-slate-800/60 rounded-2xl bg-slate-900/30 overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-slate-200 hover:bg-slate-800/30 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-lg text-slate-500">{activeFaq === index ? '−' : '+'}</span>
              </button>
              {activeFaq === index && (
                <div className="p-5 pt-0 text-xs text-slate-400 leading-relaxed border-t border-slate-850 bg-slate-950/20">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/40 relative z-10 space-y-12">
        <h2 className="text-3xl font-extrabold text-center text-white tracking-tight">What Educators & Parents Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/40 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              "Being able to upload physics notes once and know that my entire class can instantly retrieve them from their dashboard is amazing. Writing remarks directly to their parent portals saves hours of calls."
            </p>
            <div>
              <p className="text-xs font-bold text-white">Mrs. Shalini Sen</p>
              <p className="text-[10px] text-slate-500">PGT Physics Teacher, DPS</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/40 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              "Before EduAI, I had to keep calling my son's teacher to know how he was doing. Now I just open my Parent View on Settings to see the teacher's remarks, focus hours, and notes assigned. Highly recommended!"
            </p>
            <div>
              <p className="text-xs font-bold text-white">Ramesh Chandra</p>
              <p className="text-[10px] text-slate-500">Parent of Class 10 Student</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/40 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              "The AI planner created a physics and chemistry revision schedule aligned exactly with my board prep calendar. XP points and focus timer achievements kept me studying every single day."
            </p>
            <div>
              <p className="text-xs font-bold text-white">Kunal Sharma</p>
              <p className="text-[10px] text-slate-500">Class 10 Student, CBSE Board</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION (CTA) */}
      <section className="max-w-5xl mx-auto px-6 pb-24 relative z-10">
        <div className="p-10 md:p-14 rounded-[2.5rem] bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 border border-indigo-500/20 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Ready to transform your classroom?</h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-medium leading-relaxed">
            Create your personalized account in minutes. Log in with your Enrollment No, Teacher ID, or Email.
          </p>
          <div className="pt-2">
            <Link href="/auth/signup" className="px-8 py-4 bg-white text-indigo-950 text-sm font-extrabold rounded-2xl shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-transform inline-block">
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* RICH FOOTER */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-slate-800/40 relative z-10 text-xs text-slate-500">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12">
          
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-indigo-650 rounded-lg flex items-center justify-center text-[10px] font-black text-white">E</div>
              <span className="font-extrabold text-white text-sm">EduAI</span>
            </div>
            <p className="max-w-xs leading-relaxed">
              An AI-powered academic productivity portal built to bridge students, parents, and teachers for unified edtech support.
            </p>
          </div>

          <div className="space-y-3.5">
            <span className="font-bold text-slate-300 uppercase tracking-widest text-[10px] block">Product</span>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-slate-350 transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-slate-350 transition-colors">Pricing</a></li>
              <li><a href="#faqs" className="hover:text-slate-350 transition-colors">FAQs</a></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <span className="font-bold text-slate-300 uppercase tracking-widest text-[10px] block">Portals</span>
            <ul className="space-y-2">
              <li><Link href="/auth/login" className="hover:text-slate-350 transition-colors">Student Log</Link></li>
              <li><Link href="/auth/login" className="hover:text-slate-350 transition-colors">Teacher Portal</Link></li>
              <li><Link href="/auth/login" className="hover:text-slate-350 transition-colors">Parent View</Link></li>
            </ul>
          </div>

          <div className="space-y-3.5">
            <span className="font-bold text-slate-300 uppercase tracking-widest text-[10px] block">Legal</span>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-slate-350 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-slate-350 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-slate-350 transition-colors">Cookies Policy</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-900/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} EduAI Tech Solutions Private Limited. All rights reserved.</p>
          <p className="text-[10px] text-slate-600">Built for Indian educational institutions.</p>
        </div>
      </footer>

    </main>
  )
}
