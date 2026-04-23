'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Play, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

// SVG Wave Divider Component
function WaveDivider({ color = '#FFFFFF' }) {
  return (
    <svg
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      className="w-full h-24"
      style={{ display: 'block' }}
    >
      <path
        d="M0,50 Q300,100 600,50 T1200,50 L1200,120 L0,120 Z"
        fill={color}
      />
    </svg>
  );
}

// Scroll-triggered fade-in section
function ScrollSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        window.location.href = '/dashboard';
      }
      setMounted(true);
    };
    checkUser();
  }, []);

  if (!mounted) return null; // prevent flash while checking auth

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                <path
                  d="M8 4L16 14L8 24M16 4L24 14L16 24"
                  stroke="#4F46E5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">VendFlow</span>
          </div>

          {/* Nav */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Sign In
            </a>
            <a
              href="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-5 text-sm font-medium rounded-lg inline-flex items-center justify-center transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white pt-20 pb-24 lg:pt-32 lg:pb-40 overflow-hidden">
        {/* Background gradient orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -mr-48 -mt-24 blur-3xl opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column */}
            <ScrollSection>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Turn vendor reconciliation into <span className="text-indigo-600">minutes</span>
                  </h1>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    VendFlow reads your Amazon, Staples, or any vendor PDF and matches each line item to open bills in
                    QuickBooks or Xero – automatically.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <a
                    href="/login"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-600/30 inline-flex items-center justify-center"
                  >
                    Start Free Trial
                  </a>
                  <button className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                    <Play className="w-5 h-5" />
                    Watch demo
                  </button>
                </div>
              </div>
            </ScrollSection>

            {/* Right Column - Illustration */}
            <ScrollSection className="delay-200">
              <div className="relative h-96 lg:h-full min-h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-100 to-blue-100 shadow-2xl border border-indigo-200/50">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                  alt="Dashboard illustration showing PDF transforming into organized vendor statement matching"
                  className="w-full h-full object-cover"
                />
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-gradient-to-b from-white to-gray-50/50 py-16 border-t border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <p className="text-center text-sm font-semibold text-gray-600 mb-10 uppercase tracking-wide">
              Trusted by hundreds of accounting teams
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {['QuickBooks', 'Xero', 'Amazon Business', 'Staples', 'Stripe'].map((name) => (
                <div
                  key={name}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
                >
                  {name}
                </div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Simple. Fast. Automatic.
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Three simple steps to automate your entire reconciliation process
              </p>
            </div>
          </ScrollSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect Your Accounting Software',
                description:
                  'Link your QuickBooks or Xero account securely. VendFlow reads your open bills.',
              },
              {
                step: '2',
                title: 'Upload Vendor Statement PDF',
                description:
                  'Drop any vendor PDF into VendFlow. Our AI instantly recognizes line items.',
              },
              {
                step: '3',
                title: 'Review & Approve in Seconds',
                description:
                  'Review the matches, approve with one click, and your bills are reconciled.',
              },
            ].map((item) => (
              <ScrollSection key={item.step} className="delay-100">
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-300 group-hover:shadow-lg">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold mb-6">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="relative bg-gray-50 py-24 lg:py-32 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">See the difference</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From chaos to clarity in minutes
              </p>
            </div>
          </ScrollSection>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Before */}
            <ScrollSection>
              <div className="space-y-4 h-full flex flex-col">
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-gray-900">Before VendFlow</h3>
                  <p className="text-gray-600 font-medium">Manual matching, errors, wasted time</p>
                </div>

                <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-200 flex flex-col bg-white">
                  {/* Browser header */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden bg-gray-50">
                    <img
                      src="https://images.unsplash.com/photo-1586339949916-3e9457bef35e?auto=format&fit=crop&w=800&q=80"
                      alt="Messy desk with scattered receipts and cluttered spreadsheet"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200/50">
                  <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
                  <p className="text-sm font-medium text-red-700">Hours of manual work</p>
                </div>
              </div>
            </ScrollSection>

            {/* Arrow divider - Mobile */}
            <div className="flex lg:hidden justify-center items-center py-4">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-xl opacity-20 rounded-full"></div>
                <ArrowRight className="w-10 h-10 text-indigo-600 relative" />
              </div>
            </div>

            {/* After */}
            <ScrollSection>
              <div className="space-y-4 h-full flex flex-col">
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-gray-900">After VendFlow</h3>
                  <p className="text-gray-600 font-medium">
                    Automated matching, 100% accuracy verified
                  </p>
                </div>

                <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-gray-200 flex flex-col bg-white">
                  {/* Browser header */}
                  <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50">
                    <img
                      src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
                      alt="Clean financial dashboard with organized vendor statements and green checkmarks"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200/50">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-700">Done in minutes</p>
                </div>
              </div>
            </ScrollSection>
          </div>

          {/* Arrow divider - Desktop */}
          <div className="hidden lg:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600 blur-2xl opacity-30 rounded-full w-20 h-20"></div>
              <ArrowRight className="w-12 h-12 text-indigo-600 relative" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white py-24 lg:py-32 border-t border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-gray-600">No hidden fees. Cancel anytime.</p>
            </div>
          </ScrollSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: '$49',
                description: 'Perfect for small teams',
                features: [
                  'Up to 50 invoices/month',
                  'Basic dashboard',
                  'Email support',
                  'QuickBooks & Xero',
                ],
              },
              {
                name: 'Pro',
                price: '$99',
                description: 'For growing businesses',
                features: [
                  'Up to 500 invoices/month',
                  'Advanced analytics',
                  'Priority support',
                  'Custom integrations',
                  'Team collaboration',
                ],
                popular: true,
              },
              {
                name: 'Business',
                price: '$249',
                description: 'For enterprises',
                features: [
                  'Unlimited invoices',
                  'White-label dashboard',
                  '24/7 dedicated support',
                  'Custom integrations',
                  'Advanced security',
                ],
              },
            ].map((plan) => (
              <ScrollSection key={plan.name} className="delay-100">
                <div
                  className={`relative rounded-2xl border transition-all duration-300 h-full flex flex-col ${
                    plan.popular
                      ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-white shadow-lg md:scale-105'
                      : 'border-gray-200 bg-white hover:shadow-lg'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="p-8 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-5xl font-bold text-gray-900">{plan.price}</div>
                      <p className="text-gray-600 text-sm">/month, billed monthly</p>
                    </div>

                    <button
                      className={`w-full h-11 font-semibold rounded-lg transition-all ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Start Free Trial
                    </button>

                    <div className="space-y-3 pt-4 border-t border-gray-200/50">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24 lg:py-32 border-t border-gray-200/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollSection>
            <div className="text-center space-y-8">
              <div className="flex justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-2xl">★</span>
                ))}
              </div>

              <blockquote className="space-y-6">
                <p className="text-2xl lg:text-3xl font-light text-gray-900 italic leading-relaxed">
                  "VendFlow cut my month-end reconciliation from 3 hours to 10 minutes. My bookkeeper actually smiled."
                </p>
              </blockquote>

              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-blue-400 flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Jennifer Martinez</p>
                  <p className="text-sm text-gray-600">Finance Lead, TechFlow SaaS</p>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollSection>
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold text-white">
                  Ready to simplify reconciliation?
                </h2>
                <p className="text-xl text-indigo-100">
                  Join hundreds of accounting teams already using VendFlow
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/login"
                  className="bg-white hover:bg-gray-100 text-indigo-600 h-12 px-8 text-base font-semibold rounded-lg transition-all inline-flex items-center justify-center"
                >
                  Start Free Trial
                </a>
                <button className="text-white hover:text-indigo-100 font-semibold transition-colors border border-white/30 hover:border-white/50 rounded-lg px-8 h-12">
                  Schedule Demo
                </button>
              </div>

              <p className="text-sm text-indigo-100">
                No credit card required. 14-day free trial included.
              </p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                <svg viewBox="0 0 32 32" className="w-full h-full" fill="none">
                  <path
                    d="M8 4L16 14L8 24M16 4L24 14L16 24"
                    stroke="#4F46E5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="font-semibold text-white">VendFlow</span>
            </div>

            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>

            <p className="text-sm">© VendFlow 2026. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}