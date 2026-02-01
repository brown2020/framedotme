"use client";

import type { ReactElement } from "react";
import { ZapIcon, CloudIcon, ShieldCheckIcon } from "lucide-react";

/**
 * Hero section marketing content (left side of hero)
 */
export function HeroContent(): ReactElement {
  return (
    <div className="text-center lg:text-left">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
        Screen Recording
        <br />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
          Made Simple
        </span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-600 mb-8">
        Capture, save, and share your screen recordings effortlessly. Perfect
        for tutorials, demos, and presentations.
      </p>

      {/* Feature Highlights */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ZapIcon size={24} className="text-blue-600" />
          </div>
          <span className="text-lg text-gray-700">Start recording in seconds</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CloudIcon size={24} className="text-green-600" />
          </div>
          <span className="text-lg text-gray-700">Automatic cloud storage</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ShieldCheckIcon size={24} className="text-purple-600" />
          </div>
          <span className="text-lg text-gray-700">Secure and private</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Features grid section - "Why Choose Frame.me?"
 */
export function FeaturesSection(): ReactElement {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
        Why Choose Frame.me?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-blue-100 rounded-xl w-fit mb-4">
            <ZapIcon size={32} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Lightning Fast</h3>
          <p className="text-gray-600">
            Start recording in seconds. No complex setup or configuration needed.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-green-100 rounded-xl w-fit mb-4">
            <CloudIcon size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">Cloud Storage</h3>
          <p className="text-gray-600">
            All your recordings are automatically saved and accessible from
            anywhere.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
          <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4">
            <ShieldCheckIcon size={32} className="text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">
            Secure & Private
          </h3>
          <p className="text-gray-600">
            Your data is encrypted and secure. Only you have access to your
            recordings.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * How it works section - 3 step process
 */
export function HowItWorksSection(): ReactElement {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
            1
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Up</h3>
          <p className="text-gray-600">Create your free account in seconds</p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
            2
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Record</h3>
          <p className="text-gray-600">Click record and capture your screen</p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full text-2xl font-bold mb-4">
            3
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Share</h3>
          <p className="text-gray-600">
            Access and share your recordings anywhere
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Social proof / trust banner section
 */
export function SocialProofSection(): ReactElement {
  return (
    <section className="max-w-5xl mx-auto px-4 py-16">
      <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white text-center shadow-xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Join Thousands of Happy Users
        </h2>
        <p className="text-xl opacity-90 mb-6">
          Trusted by professionals, educators, and creators worldwide
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold mb-2">100%</div>
            <div className="text-blue-100">Cloud-Based</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">Instant</div>
            <div className="text-blue-100">Setup Time</div>
          </div>
          <div>
            <div className="text-4xl font-bold mb-2">Secure</div>
            <div className="text-blue-100">Your Privacy</div>
          </div>
        </div>
      </div>
    </section>
  );
}
