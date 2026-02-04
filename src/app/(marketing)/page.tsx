'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import {
  Briefcase,
  Mic,
  FileText,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation - Sticky & Glass */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between relative">
            <Logo size="md" variant="full" />

            {/* Center Logo */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
              <img
                src="https://i.postimg.cc/tJHyDTnJ/Deploy-by-(1).png"
                alt="Deployed by"
                className="h-40 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Tall & Premium */}
      <section className="relative overflow-hidden min-h-[85vh] flex items-center bg-slate-900">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/construction-site-hero.png"
            alt="Construction site"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10 w-full">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium mb-6 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Now available for Early Access
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight tracking-tight">
              The Intelligent Choice for <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Construction Teams</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto font-light">
              Replace paperwork with AI. Streamline your job sites, automate reporting,
              and collaborate in real-time with the platform built for modern builders.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-semibold text-lg shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1"
              >
                Start Free Trial
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-semibold text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Stats - Floating Glass Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl hover:bg-white/10 transition-colors">
              <div className="text-4xl font-bold text-blue-400 mb-2">10x</div>
              <div className="text-slate-300 font-medium">Faster Job Tracking</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl hover:bg-white/10 transition-colors">
              <div className="text-4xl font-bold text-blue-400 mb-2">50%</div>
              <div className="text-slate-300 font-medium">Less Paperwork</div>
            </div>
            <div className="text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl hover:bg-white/10 transition-colors">
              <div className="text-4xl font-bold text-blue-400 mb-2">100%</div>
              <div className="text-slate-300 font-medium">Real-time Visibility</div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Site Buddy - Floating Image */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-4">
                Why Site Buddy?
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
                Smart tools that keep <br /> your sites moving.
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Site Buddy combines AI-powered automation with intuitive job management.
                It's not just a tool; it's your digital foreman that helps you track progress,
                eliminate bottlenecks, and get everyone on the same page instantly.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <CheckCircle2 className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Field-First Design</h3>
                    <p className="text-slate-600">Capture details with voice notes and photos. No typing required.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <CheckCircle2 className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Automated Workflows</h3>
                    <p className="text-slate-600">Smart state management keeps jobs moving to the next stage automatically.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="order-1 lg:order-2 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform group-hover:-translate-y-1 transition-transform duration-500">
                <img
                  src="/construction-team.png"
                  alt="Construction team collaborating"
                  className="w-full h-auto object-cover"
                />
                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-slate-100 max-w-xs hidden sm:block">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-slate-900">Job Complete</span>
                  </div>
                  <p className="text-xs text-slate-500">Site inspections uploaded and verified instantly.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Clean Cards */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Everything you need to build better</h2>
            <p className="text-xl text-slate-600">Powerful features designed to replace fragmented tools and spreadsheets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Feature Cards */}
            {[
              {
                icon: Briefcase,
                title: "Job Management",
                desc: "Full lifecycle tracking from initiation to completion with automated smart states."
              },
              {
                icon: Mic,
                title: "Voice AI",
                desc: "Speak your updates. We transcribe, tag, and organize them automatically."
              },
              {
                icon: FileText,
                title: "Smart Docs",
                desc: "Instant document processing and categorization. Never lose a receipt or plan again."
              },
              {
                icon: MapPin,
                title: "GPS Tracking",
                desc: "Precision location data for every update, photo, and clock-in event."
              },
              {
                icon: Users,
                title: "Team Sync",
                desc: "Real-time visibility means the office knows what the field is doing, instantly."
              },
              {
                icon: TrendingUp,
                title: "Deep Analytics",
                desc: "Uncover bottlenecks and optimize crew performance with detailed insights."
              }
            ].map((feature, i) => (
              <div key={i} className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <feature.icon className="text-blue-600 group-hover:text-white transition-colors duration-300" size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Dark & Bold */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600 rounded-full blur-[100px] opacity-20"></div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to transform your workflow?</h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Join the construction teams that are building faster and smarter with Site Buddy.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all font-semibold text-lg shadow-lg hover:shadow-blue-500/25"
            >
              Get Started Today
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Clean */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <Logo size="sm" variant="full" className="mb-6 brightness-0 invert opacity-90" />
              <p className="text-sm leading-relaxed text-slate-500">
                The intelligent operating system for modern field service and construction teams.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-600">
            <p>&copy; {new Date().getFullYear()} Site Buddy. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              {/* Social placeholders */}
              <span className="hover:text-white cursor-pointer transition-colors">Twitter</span>
              <span className="hover:text-white cursor-pointer transition-colors">LinkedIn</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
