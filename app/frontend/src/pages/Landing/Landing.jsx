import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, ArrowRight, Eye, MessageSquare, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0E1420] text-[#E7ECF5] font-sans">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold tracking-tight">AEGIS</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link to="/signin" className="text-[#A8B3C7] hover:text-white transition-colors px-3 py-2">Sign in</Link>
          <Link to="/signup" className="px-4 py-2 rounded-full bg-[#3FD9C7] text-[#0E1420] font-semibold hover:brightness-105 transition-all">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-7">
          <h1 className="font-serif text-4xl sm:text-5xl leading-[1.1] tracking-tight text-white max-w-xl">
            Know the moment something happens on your website.
          </h1>
          <p className="mt-6 text-[#A8B3C7] text-base leading-relaxed max-w-md">
            AEGIS watches the traffic behind your site and tells you, in plain language, when something
            looks off — a break-in attempt, a flood of traffic, someone poking around for weaknesses.
            No dashboards to babysit, no jargon to decode.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/signup"
              className="px-6 py-3.5 rounded-full bg-[#3FD9C7] text-[#0E1420] font-semibold text-sm hover:brightness-105 transition-all inline-flex items-center gap-2"
            >
              Start monitoring your site
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/signin" className="text-sm text-[#A8B3C7] hover:text-white transition-colors">
              I already have an account
            </Link>
          </div>
        </div>

        {/* Right: the actual artifact of value — a plain-language alert */}
        <div className="lg:col-span-5">
          <div className="bg-[#F6F4EF] text-[#1a1a1a] rounded-2xl p-6 shadow-2xl shadow-black/40 max-w-sm mx-auto">
            <div className="flex items-center gap-2 text-xs text-[#6b6b6b] mb-4">
              <Mail className="w-3.5 h-3.5" />
              <span>New alert from AEGIS</span>
            </div>
            <p className="text-sm leading-relaxed">
              <span className="inline-block w-2 h-2 rounded-full bg-[#FF8A3D] mr-2 align-middle" />
              <strong>Someone is scanning your site</strong>, looking for weak points. We noticed repeated
              probes from one visitor across many different pages in the last few minutes.
            </p>
            <p className="text-xs text-[#8a8a8a] mt-4 pt-4 border-t border-black/10">
              Detected 2 minutes ago · yourwebsite.com
            </p>
          </div>
        </div>
      </section>

      {/* Benefits strip — not numbered, not sequential */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <Eye className="w-5 h-5 text-[#3FD9C7] mb-3" />
            <h3 className="font-semibold text-white mb-1.5">Always watching</h3>
            <p className="text-sm text-[#A8B3C7] leading-relaxed">
              Traffic to your site is checked continuously, not on a schedule you have to remember.
            </p>
          </div>
          <div>
            <MessageSquare className="w-5 h-5 text-[#3FD9C7] mb-3" />
            <h3 className="font-semibold text-white mb-1.5">No jargon</h3>
            <p className="text-sm text-[#A8B3C7] leading-relaxed">
              You get a plain sentence about what happened, not a spreadsheet of technical fields.
            </p>
          </div>
          <div>
            <Users className="w-5 h-5 text-[#3FD9C7] mb-3" />
            <h3 className="font-semibold text-white mb-1.5">You decide what to do</h3>
            <p className="text-sm text-[#A8B3C7] leading-relaxed">
              AEGIS tells you what it sees — it doesn't take action on your site without you.
            </p>
          </div>
        </div>
      </section>

      {/* How it works — genuinely sequential, numbered */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-white/5">
        <h2 className="font-serif text-2xl text-white mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {[
            { n: '1', title: 'Point it at your site', body: 'Tell us your website address once you sign in.' },
            { n: '2', title: 'It watches quietly', body: 'Traffic is checked in the background — nothing to configure day to day.' },
            { n: '3', title: 'You get told what matters', body: 'When something unusual happens, you see it explained simply.' },
          ].map((step) => (
            <div key={step.n}>
              <span className="font-serif text-3xl text-[#3FD9C7]">{step.n}</span>
              <h3 className="font-semibold text-white mt-2 mb-1.5">{step.title}</h3>
              <p className="text-sm text-[#A8B3C7] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5 text-center">
        <h2 className="font-serif text-3xl text-white max-w-lg mx-auto leading-snug">
          Stop wondering what's happening on your site.
        </h2>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#3FD9C7] text-[#0E1420] font-semibold text-sm hover:brightness-105 transition-all"
        >
          Create your account
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 border-t border-white/5 text-xs text-[#6b7385] flex items-center justify-between">
        <span>AEGIS</span>
        <span>Built to watch, not to promise what it can't do.</span>
      </footer>
    </div>
  );
}
