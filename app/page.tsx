"use client";

import Link from "next/link";
import {
  Brain,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Building2,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    // Universal Redirection Fallback (Client-side)
    const checkUser = async () => {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        const r = profile?.role || session.user.user_metadata?.role || 'candidate';
        if (r === 'recruiter') window.location.href = '/recruiter/dashboard';
        else if (r === 'tpo') window.location.href = '/campus/dashboard';
        else window.location.href = '/dashboard';
      }
    };
    checkUser();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-bg-primary/80 backdrop-blur-md border-b border-border-color py-4" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center">
              <Brain className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold font-sora">Interview<span className="text-accent-blue">IQ</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
            <a href="#how-it-works" className="hover:text-accent-blue transition-colors">How It Works</a>
            <a href="#for-recruiters" className="hover:text-accent-blue transition-colors">For Recruiters</a>
            <a href="#for-colleges" className="hover:text-accent-blue transition-colors">For Colleges</a>
            <Link href="/login" className="hover:text-accent-blue transition-colors">Login</Link>
          </div>

          <div className="hidden md:block">
            <Link href="/signup" className="bg-accent-blue hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg shadow-accent-blue/20">
              Start Free
            </Link>
          </div>

          <button className="md:hidden text-text-primary" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-0 z-40 bg-bg-primary pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6 text-xl font-bold font-sora">
              <Link href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How It Works</Link>
              <Link href="#for-recruiters" onClick={() => setIsMenuOpen(false)}>For Recruiters</Link>
              <Link href="#for-colleges" onClick={() => setIsMenuOpen(false)}>For Colleges</Link>
              <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link href="/signup" className="bg-accent-blue text-center py-4 rounded-2xl" onClick={() => setIsMenuOpen(false)}>Start Free</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent-blue font-bold tracking-[0.2em] text-xs uppercase mb-4 block">AI-Powered Interview Platform</span>
            <h1 className="text-5xl md:text-7xl font-bold font-sora leading-tight mb-6">
              Know If You're Ready <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple">Before The Interview</span> <br />
              Even Starts.
            </h1>
            <p className="text-text-secondary text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
              Upload your resume. Go through real AI-generated interview rounds.
              Get an honest verdict — and a skill report your recruiter will actually trust.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto bg-accent-blue hover:bg-blue-600 text-white text-lg font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-accent-blue/20">
                Start Your Free Mock Interview
              </Link>
              <Link href="/login?portal=recruiter" className="w-full sm:w-auto border border-border-color hover:border-white px-8 py-4 rounded-2xl font-bold transition-all">
                I'm a Recruiter →
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-8">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-xl">🎓</span> Used by 500+ students
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-xl">🏢</span> Trusted by campus TPOs
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="text-xl">⚡</span> Results in under 30 mins
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 bg-bg-card border border-border-color p-8 rounded-[2.5rem] shadow-2xl overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <span className="bg-accent-purple/10 text-accent-purple text-xs font-bold px-3 py-1 rounded-full border border-accent-purple/20">Round 2 — Technical</span>
                <span className="text-accent-yellow font-bold text-sm">⏱ 18:42</span>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-sora leading-snug">
                  "How would you optimize the rendering performance of a list with 10,000 items in React?"
                </h3>
                <div className="h-40 bg-bg-primary/50 rounded-2xl border border-border-color/50 relative overflow-hidden">
                  <div className="absolute top-4 left-4 right-4 h-4 bg-white/5 rounded-full blur-[2px]"></div>
                  <div className="absolute top-12 left-4 right-10 h-4 bg-white/5 rounded-full blur-[2px]"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-2 w-full bg-accent-green rounded-full"></div>
                  <div className="h-2 w-full bg-accent-blue rounded-full animate-pulse"></div>
                  <div className="h-2 w-full bg-bg-primary rounded-full"></div>
                </div>
              </div>
            </div>
            {/* Background Orbs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent-blue/10 rounded-full blur-3xl pointer-events-none"></div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-bg-secondary/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-sora mb-4">One Platform. Five Rounds. Real Results.</h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-lg italic">Each round only unlocks if you pass the previous one — just like real interviews.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <RoundCard step="1" title="Aptitude" desc="10 numerical & logical MCQ questions" icon="🧮" />
            <RoundCard step="2" title="Technical" desc="10 skill-based MCQs + short answers" icon="💻" />
            <RoundCard step="3" title="Resume" desc="10 deep-dive questions from YOUR resume" icon="📄" />
            <RoundCard step="4" title="Coding" desc="1-2 LeetCode style problems (tech roles)" icon="👨‍💻" />
            <RoundCard step="5" title="Writing" desc="5 written tasks based on your experience" icon="✍️" />
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <ForWhoCard
            icon={<GraduationCap className="w-10 h-10 text-accent-blue" />}
            title="For Job Seekers"
            desc="Get a mock interview tailored to your resume and target role. Know your weak spots before it counts."
            cta="Start Free Interview"
            link="/signup"
          />
          <ForWhoCard
            icon={<Briefcase className="w-10 h-10 text-accent-purple" />}
            title="For Recruiters"
            desc="Create openings, share a link, and get detailed skill reports for every candidate in minutes."
            cta="Login as Recruiter"
            link="/login?portal=recruiter"
          />
          <ForWhoCard
            icon={<Building2 className="w-10 h-10 text-accent-green" />}
            title="For College TPOs"
            desc="Run placement drives for your batch. See which students are ready for top companies in one report."
            cta="Login as TPO"
            link="/login?portal=tpo"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-color bg-bg-secondary/20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center font-bold">I</div>
              <span className="text-xl font-bold font-sora">InterviewIQ</span>
            </div>
            <p className="text-text-secondary text-sm">Built to help India get hired.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <a href="#" className="hover:text-white">Features</a>
              <a href="#" className="hover:text-white">Pricing (Free)</a>
              <a href="#" className="hover:text-white">API</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">For Recruiters</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <a href="#" className="hover:text-white">How to Screen</a>
              <a href="#" className="hover:text-white">Verification Engine</a>
              <a href="#" className="hover:text-white">Bulk Hiring</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <a href="#" className="hover:text-white">Support</a>
              <a href="#" className="hover:text-white">Twitter</a>
              <a href="#" className="hover:text-white">LinkedIn</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-border-color text-center text-xs text-text-secondary">
          © 2025 InterviewIQ AI — Free forever for candidates.
        </div>
      </footer>
    </div>
  );
}

function RoundCard({ step, title, desc, icon }: any) {
  return (
    <div className="p-6 bg-bg-card border border-border-color rounded-3xl hover:border-accent-blue transition-all group">
      <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{icon}</div>
      <div className="text-[10px] font-bold text-accent-blue uppercase tracking-widest mb-2 font-sora">Round {step}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-text-secondary text-xs leading-relaxed">{desc}</p>
    </div>
  );
}

function ForWhoCard({ icon, title, desc, cta, link }: any) {
  return (
    <div className="p-10 bg-bg-secondary/40 border border-border-color rounded-[2.5rem] flex flex-col items-center text-center group hover:bg-bg-secondary transition-all">
      <div className="mb-6 p-4 rounded-3xl bg-bg-card border border-border-color group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold font-sora mb-4">{title}</h3>
      <p className="text-text-secondary mb-8 text-sm line-clamp-3">{desc}</p>
      <Link href={link || "/signup"} className="mt-auto flex items-center gap-2 font-bold text-accent-blue group-hover:underline">
        {cta} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
