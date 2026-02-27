/**
 * Compañon Landing Page
 * 
 * Public-facing landing page for Compañon Brand Activation Dashboard.
 * Inspired by Concierto's clean, focused design.
 * 
 * Route: /companon
 * 
 * Features:
 * - Hero section with value proposition
 * - Key features showcase (DNA Targeting, Campaign Types, Analytics)
 * - How It Works flow
 * - CTA to Dashboard (if authenticated) or Sign Up
 * 
 * Design:
 * - Dark theme (#121212) with blue accents (#3B82F6)
 * - Framer Motion animations
 * - Mobile-responsive
 * - Bilingual support (EN/ES)
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function CompanonLanding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">🎯</span>
              </div>
              <div>
                <h1 className="text-2xl font-black">Compañon</h1>
                <p className="text-xs text-gray-400">Brand Activation Dashboard</p>
              </div>
            </motion.div>

            {/* Auth Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>

              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Signed in as</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                  <button
                    onClick={() => navigate('/companon/dashboard')}
                    className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2563EB] transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/auth/login?redirect=/companon/dashboard')}
                  className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#2563EB] transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <motion.h2
            className="text-6xl font-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-[#3B82F6] via-white to-[#60A5FA] bg-clip-text text-transparent">
              Activate Your Audience
            </span>
          </motion.h2>

          <motion.p
            className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Discover audiences with MediaID DNA, launch targeted campaigns in minutes,
            and measure real-time cultural impact—all with privacy-first CRM and AI-powered insights.
          </motion.p>

          {user ? (
            <motion.button
              onClick={() => navigate('/companon/dashboard')}
              className="bg-[#3B82F6] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#2563EB] transition-all duration-200 shadow-lg shadow-blue-500/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Open Dashboard →
            </motion.button>
          ) : (
            <motion.button
              onClick={() => navigate('/auth/login?redirect=/companon/dashboard')}
              className="bg-[#3B82F6] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#2563EB] transition-all duration-200 shadow-lg shadow-blue-500/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <FeatureCard
            icon="🧬"
            title="DNA-Powered Targeting"
            description="Query MediaID DNA for precise audience segments with culture, behavior, economics, and location filters."
            delay={0.5}
          />
          <FeatureCard
            icon="🚀"
            title="3 Campaign Types"
            description="Launch Locker Drops, Event Partnerships, or QR activations with built-in anti-fraud protection."
            delay={0.6}
          />
          <FeatureCard
            icon="📊"
            title="Real-Time Analytics"
            description="AI-powered insights, sentiment analysis, and live metrics from Coliseum—updated in milliseconds."
            delay={0.7}
          />
        </div>

        {/* How It Works */}
        <motion.div
          className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-2xl p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-4xl font-bold text-center mb-12">How It Works</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StepCard
              number="1"
              title="Build Audience"
              description="Use DNA Query Builder to segment by culture, behavior, and location"
            />
            <StepCard
              number="2"
              title="Create Campaign"
              description="Choose Locker Drop, Event, or QR activation in a 5-minute wizard"
            />
            <StepCard
              number="3"
              title="Launch & Monitor"
              description="Go live with anti-fraud protection and real-time Coliseum metrics"
            />
            <StepCard
              number="4"
              title="Measure Impact"
              description="Track ROI, engagement, and DNA-enriched insights with AI analysis"
            />
          </div>
        </motion.div>

        {/* Campaign Types Showcase */}
        <div className="mt-20">
          <h3 className="text-4xl font-bold text-center mb-12">Campaign Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CampaignTypeCard
              icon="🎁"
              title="Locker Drops"
              description="Deliver exclusive content to user vaults"
              features={['DNA-based unlock triggers', 'Expiration & claim limits', 'Content analytics']}
              delay={0.9}
            />
            <CampaignTypeCard
              icon="🎟️"
              title="Event Partnerships"
              description="Sponsor Concierto events with brand presence"
              features={['Booth geofencing', 'Pre/post messaging', 'Attendee CRM']}
              delay={1.0}
            />
            <CampaignTypeCard
              icon="📱"
              title="QR Activations"
              description="Physical-world engagement with mobile surveys"
              features={['Device fingerprinting', 'Geofence enforcement', 'Fraud detection']}
              delay={1.1}
            />
          </div>
        </div>

        {/* Privacy & Trust Section */}
        <motion.div
          className="mt-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded-2xl p-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h3 className="text-3xl font-bold mb-4">Privacy-First by Design</h3>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-6">
            Every query logged to Passport. Aggregated data by default. Explicit consent for detailed views.
            GDPR/CCPA compliant. Your audience's trust, protected.
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-500">
            <span>✓ Row-Level Security</span>
            <span>✓ Tiered Consent</span>
            <span>✓ Immutable Audit Logs</span>
            <span>✓ AES-256 Encryption</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center hover:border-gray-700 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-[#3B82F6]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3B82F6]/30">
        <span className="text-2xl font-bold text-[#3B82F6]">{number}</span>
      </div>
      <h4 className="text-lg font-bold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

interface CampaignTypeCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  delay: number;
}

function CampaignTypeCard({ icon, title, description, features, delay }: CampaignTypeCardProps) {
  return (
    <motion.div
      className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 hover:border-[#3B82F6]/50 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-xl font-bold mb-2">{title}</h4>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="text-gray-500 text-xs flex items-center">
            <span className="text-[#3B82F6] mr-2">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. Routing Setup:
 *    - This component lives at /companon
 *    - If authenticated, CTA goes to /companon/dashboard
 *    - If not authenticated, CTA goes to /auth/login?redirect=/companon/dashboard
 * 
 * 2. Design System Alignment:
 *    - Uses Buckets dark theme (#121212)
 *    - Primary blue (#3B82F6) for Compañon branding
 *    - Matches Concierto's clean, focused layout
 *    - Reuses Framer Motion patterns
 * 
 * 3. Authentication Flow:
 *    - Uses useUser() hook from Supabase client
 *    - Conditional rendering based on auth state
 *    - No sidebar navigation (landing page only)
 * 
 * 4. Content Strategy:
 *    - Clear value proposition in hero
 *    - 3 key features (DNA, Campaigns, Analytics)
 *    - 4-step "How It Works" flow
 *    - Campaign types showcase
 *    - Privacy trust section (GDPR/CCPA)
 * 
 * 5. Next Steps:
 *    - Create CompanonRoutes.tsx to handle routing
 *    - Build /companon/dashboard (uses BrandDashboardTemplateUI)
 *    - Add sidebar navigation for authenticated app
 *    - Connect to real Supabase auth
 */

