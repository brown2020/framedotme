"use client";

import { useState } from "react";
import {
  Shield,
  Eye,
  Lock,
  Database,
  Cookie,
  Mail,
  ChevronRight,
} from "lucide-react";

interface Props {
  companyName: string;
  companyEmail: string;
  companyAddress: string;
  companyLocation: string;
  updatedAt: string;
}

const SECTIONS = [
  { id: "intro", title: "Introduction", icon: Shield },
  { id: "collection", title: "Information We Collect", icon: Database },
  { id: "usage", title: "How We Use Your Data", icon: Eye },
  { id: "security", title: "Data Security", icon: Lock },
  { id: "cookies", title: "Cookies & Tracking", icon: Cookie },
  { id: "rights", title: "Your Rights", icon: ChevronRight },
  { id: "contact", title: "Contact Us", icon: Mail },
];

export function PrivacyPage({
  companyName,
  companyEmail,
  companyAddress,
  companyLocation,
  updatedAt,
}: Props) {
  const [activeSection, setActiveSection] = useState<string>("intro");

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-linear-to-br from-gray-50 via-purple-50 to-blue-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-linear-to-r from-purple-600 to-blue-600 rounded-3xl p-12 mb-8 text-white text-center shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield size={48} />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-purple-100">Your privacy is our priority</p>
          <p className="text-purple-100 text-sm mt-2">
            Last updated: {updatedAt}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contents</h3>
              <nav className="space-y-2">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        document
                          .getElementById(section.id)
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        activeSection === section.id
                          ? "bg-purple-100 text-purple-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12 border border-gray-200">
              <div className="prose prose-lg max-w-none">
                {/* Introduction */}
                <section id="intro" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Shield className="text-purple-600" size={32} />
                    Introduction
                  </h2>
                  <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4 rounded-r-lg">
                    <p className="text-gray-700 leading-relaxed font-semibold">
                      Protecting your privacy is our top priority.
                    </p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    This Privacy Policy applies to {companyName} and governs
                    data collection and usage. By using {companyName}, you
                    consent to the data practices described in this statement.
                  </p>
                </section>

                {/* Information We Collect */}
                <section id="collection" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Database className="text-blue-600" size={32} />
                    Information We Collect
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We collect information to provide better services to our
                    users. The information we collect includes:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">
                        Account Information
                      </h4>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Email address</li>
                        <li>• Display name</li>
                        <li>• Profile photo (optional)</li>
                      </ul>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">
                        Usage Data
                      </h4>
                      <ul className="text-gray-700 space-y-1 text-sm">
                        <li>• Screen recordings you create</li>
                        <li>• Usage patterns and preferences</li>
                        <li>• Device and browser information</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    We only collect information that you voluntarily provide or
                    that is necessary to deliver our services.
                  </p>
                </section>

                {/* How We Use Your Data */}
                <section id="usage" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Eye className="text-green-600" size={32} />
                    How We Use Your Data
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {companyName} uses your information to:
                  </p>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1 bg-blue-100 rounded">
                        <ChevronRight size={16} className="text-blue-600" />
                      </div>
                      <p className="text-gray-700">
                        Provide and maintain the screen recording services
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1 bg-blue-100 rounded">
                        <ChevronRight size={16} className="text-blue-600" />
                      </div>
                      <p className="text-gray-700">
                        Store and manage your recordings securely
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1 bg-blue-100 rounded">
                        <ChevronRight size={16} className="text-blue-600" />
                      </div>
                      <p className="text-gray-700">
                        Improve and optimize our services
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-1 bg-blue-100 rounded">
                        <ChevronRight size={16} className="text-blue-600" />
                      </div>
                      <p className="text-gray-700">
                        Communicate with you about your account and services
                      </p>
                    </div>
                  </div>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="font-semibold text-gray-900 mb-2">
                      We will NEVER:
                    </p>
                    <ul className="text-gray-700 space-y-1">
                      <li>• Sell your personal information to third parties</li>
                      <li>• Share your recordings without your permission</li>
                      <li>• Use your data for advertising purposes</li>
                    </ul>
                  </div>
                </section>

                {/* Data Security */}
                <section id="security" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Lock className="text-blue-600" size={32} />
                    Data Security
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We implement industry-standard security measures to protect
                    your information:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">
                        🔐 Encryption
                      </h4>
                      <p className="text-gray-700 text-sm">
                        All data is encrypted in transit and at rest
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">
                        🔒 Secure Authentication
                      </h4>
                      <p className="text-gray-700 text-sm">
                        Firebase authentication with industry standards
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">
                        ☁️ Cloud Security
                      </h4>
                      <p className="text-gray-700 text-sm">
                        Stored on Google Cloud with enterprise-grade security
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">
                        👤 Privacy Controls
                      </h4>
                      <p className="text-gray-700 text-sm">
                        You control your data and can delete it anytime
                      </p>
                    </div>
                  </div>
                </section>

                {/* Cookies */}
                <section id="cookies" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Cookie className="text-orange-600" size={32} />
                    Cookies & Tracking
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use cookies and similar technologies to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
                    <li>Maintain your login session</li>
                    <li>Remember your preferences</li>
                    <li>Improve website performance</li>
                    <li>Understand how you use our services</li>
                  </ul>
                  <p className="text-gray-700 leading-relaxed">
                    You can control cookie preferences through your browser
                    settings.
                  </p>
                </section>

                {/* Your Rights */}
                <section id="rights" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Your Privacy Rights
                  </h2>
                  <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-4 rounded-r-lg">
                    <p className="font-semibold text-gray-900 mb-3">
                      You have the right to:
                    </p>
                    <ul className="text-gray-700 space-y-2">
                      <li>✓ Access your personal information</li>
                      <li>✓ Request correction of inaccurate data</li>
                      <li>✓ Delete your account and all associated data</li>
                      <li>✓ Export your recordings</li>
                      <li>
                        ✓ Opt out of communications (except essential service
                        emails)
                      </li>
                    </ul>
                  </div>
                </section>

                {/* Contact */}
                <section id="contact" className="mb-8 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Mail className="text-blue-600" size={32} />
                    Contact Us
                  </h2>
                  <div className="bg-linear-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-gray-200">
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      If you have any questions about this Privacy Policy or
                      believe we have not adhered to it, please contact us:
                    </p>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="font-semibold text-gray-900">
                        {companyName}
                      </p>
                      <p className="text-gray-700">{companyAddress}</p>
                      <p className="text-gray-700 mb-3">{companyLocation}</p>
                      <a
                        href={`mailto:${companyEmail}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        {companyEmail}
                      </a>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
