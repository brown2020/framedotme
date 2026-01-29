"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Zap,
  Cloud,
  Shield,
  Users,
  HeartHandshake,
  Target,
} from "lucide-react";

const FAQ_DATA = [
  {
    question: "What is Frame.me?",
    answer:
      "Frame.me is a modern screen capture and recording tool designed to simplify capturing, organizing, and sharing high-quality screen content for professionals and creators.",
  },
  {
    question: "How do I start a screen recording?",
    answer:
      'Navigate to the Capture page, choose your preferred settings, and click "Start Recording". Your browser will prompt you to select what to share.',
  },
  {
    question: "Where are my recordings stored?",
    answer:
      "All recordings are securely stored in the cloud and accessible from your Recordings page. You can view, download, or delete them at any time.",
  },
  {
    question: "How can I share my captures?",
    answer:
      "Download your recordings and share them however you like. We're working on direct sharing features for future releases.",
  },
  {
    question: "Are there any limitations on recording quality?",
    answer:
      "Frame.me supports high-quality recordings based on your device capabilities. The quality depends on your screen resolution and browser settings.",
  },
  {
    question: "Is there a limit to the number of recordings I can save?",
    answer:
      "Free accounts have generous storage limits. Additional storage and premium features are available through our credit system.",
  },
  {
    question: "Can I download my recordings?",
    answer:
      "Yes! All your recordings can be downloaded in their original quality directly to your device.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use industry-standard encryption and security practices. Only you have access to your recordings.",
  },
] as const;

export function AboutPage(): ReactElement {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-linear-to-br from-blue-50 via-white to-purple-50">
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            About Frame.me
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The modern way to capture and share your screen
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-12 mb-16 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-4 text-center">Our Mission</h2>
          <p className="text-xl text-center leading-relaxed">
            To empower creators, educators, and professionals with the simplest,
            most reliable screen recording tool that respects your privacy and
            enhances your productivity.
          </p>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">
            Why Choose Frame.me
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-4 bg-blue-100 rounded-xl w-fit mb-4">
                <Zap className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Start recording in seconds with our streamlined interface. No
                complex configuration required.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-4 bg-green-100 rounded-xl w-fit mb-4">
                <Cloud className="text-green-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Cloud Powered
              </h3>
              <p className="text-gray-600">
                Access your recordings from anywhere. Automatic cloud backup
                keeps your content safe.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-4 bg-purple-100 rounded-xl w-fit mb-4">
                <Shield className="text-purple-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Privacy First
              </h3>
              <p className="text-gray-600">
                Your data belongs to you. End-to-end security ensures only you
                can access your recordings.
              </p>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="bg-white rounded-3xl p-12 mb-16 shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <Users className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                User-Centric
              </h3>
              <p className="text-gray-600">
                Every feature is designed with you in mind
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                <HeartHandshake className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Transparent
              </h3>
              <p className="text-gray-600">
                No hidden fees, no surprises, just honest service
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                <Target className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Innovation
              </h3>
              <p className="text-gray-600">
                Constantly improving to serve you better
              </p>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="bg-white rounded-3xl p-12 shadow-lg">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <button
                  className="flex justify-between items-center w-full text-left py-3 hover:text-blue-600 transition-colors"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={openFAQ === index}
                >
                  <span className="font-semibold text-lg text-gray-900 pr-8">
                    {faq.question}
                  </span>
                  {openFAQ === index ? (
                    <ChevronUp className="text-blue-600 shrink-0" size={24} />
                  ) : (
                    <ChevronDown className="text-gray-400 shrink-0" size={24} />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="mt-3 text-gray-600 text-base leading-relaxed pl-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Recording?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who trust Frame.me
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:scale-105"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
