"use client";

import { useState } from "react";
import { ChevronRight, FileText, Scale, AlertCircle } from "lucide-react";

interface Props {
  companyName: string;
  companyEmail: string;
  privacyLink: string;
  updatedAt: string;
}

const SECTIONS = [
  { id: "intro", title: "Introduction", icon: FileText },
  { id: "access", title: "Access and Use", icon: ChevronRight },
  { id: "fees", title: "Fees and Payment", icon: ChevronRight },
  { id: "privacy", title: "Privacy and Security", icon: ChevronRight },
  { id: "termination", title: "Termination", icon: ChevronRight },
  { id: "liability", title: "Limitation of Liability", icon: Scale },
  { id: "changes", title: "Changes to Terms", icon: AlertCircle },
];

export function TermsPage({
  companyName,
  companyEmail,
  privacyLink,
  updatedAt,
}: Props) {
  const [activeSection, setActiveSection] = useState<string>("intro");

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-3xl p-12 mb-8 text-white text-center shadow-xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Terms of Service
          </h1>
          <p className="text-blue-100">Last updated: {updatedAt}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Quick Navigation
              </h3>
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
                          ? "bg-blue-100 text-blue-700 font-semibold"
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
                    <FileText className="text-blue-600" size={32} />
                    Introduction
                  </h2>
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-4 rounded-r-lg">
                    <p className="text-gray-700 leading-relaxed">
                      Welcome to {companyName}! By using our screen recording
                      services, you agree to these terms. Please read them
                      carefully.
                    </p>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    These Terms of Use describe the terms and conditions
                    applicable to your use of {companyName}
                    and the related services. By accessing or using the
                    services, you intend and expressly agree to be bound by all
                    the terms and conditions of this Agreement and the Privacy
                    Policy (available at{" "}
                    <a
                      href={privacyLink}
                      className="text-blue-600 hover:underline"
                    >
                      {privacyLink}
                    </a>
                    ).
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    If you do not agree to these terms and conditions, you may
                    not use the services.
                  </p>
                </section>

                {/* Access and Use */}
                <section id="access" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Access and Use
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {companyName} grants you a limited license to access and use
                    our services subject to this Agreement. You acknowledge and
                    agree that {companyName} may modify, update, and change the
                    services at any time.
                  </p>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded-r-lg">
                    <p className="font-semibold text-gray-900 mb-2">
                      Requirements:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>You must be at least 18 years of age</li>
                      <li>
                        You must have legal authority to accept this agreement
                      </li>
                      <li>
                        You are responsible for your activities on the platform
                      </li>
                    </ul>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You shall not use the services for any purposes beyond the
                    scope of access granted. You may not copy, modify, reverse
                    engineer, or attempt to gain unauthorized access to any part
                    of the services.
                  </p>
                </section>

                {/* Fees and Payment */}
                <section id="fees" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Fees and Payment
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Some features may require payment. All fees are
                    non-refundable unless otherwise stated. You agree to pay all
                    applicable fees and charges incurred through your account.
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-700">
                      <strong>Credit System:</strong> {companyName} operates on
                      a credit-based system. Credits can be purchased and used
                      for premium features.
                    </p>
                  </div>
                </section>

                {/* Privacy and Security */}
                <section id="privacy" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Privacy and Security
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Your privacy is important to us. Our use of your personal
                    information is governed by our{" "}
                    <a
                      href={privacyLink}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                  <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded-r-lg">
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Your Data:</strong> All screen recordings are
                      stored securely and are only accessible by you. We use
                      industry-standard encryption to protect your content.
                    </p>
                  </div>
                </section>

                {/* Termination */}
                <section id="termination" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Termination
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You may terminate your account at any time through your
                    profile settings.
                    {companyName} reserves the right to suspend or terminate
                    your access if you violate these terms.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Upon termination, your right to use the services will
                    immediately cease, though certain provisions of this
                    agreement will survive termination.
                  </p>
                </section>

                {/* Limitation of Liability */}
                <section id="liability" className="mb-12 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <Scale className="text-purple-600" size={32} />
                    Limitation of Liability
                  </h2>
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
                    <p className="font-semibold text-gray-900 mb-2">
                      Important Notice:
                    </p>
                    <p className="text-gray-700 leading-relaxed">
                      The services are provided "as is" without warranties of
                      any kind. {companyName} shall not be liable for any
                      indirect, incidental, special, or consequential damages
                      arising from your use of the services.
                    </p>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    You acknowledge that {companyName} may experience downtime
                    or interruptions. We are not responsible for any losses
                    resulting from service unavailability.
                  </p>
                </section>

                {/* Changes to Terms */}
                <section id="changes" className="mb-8 scroll-mt-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <AlertCircle className="text-orange-600" size={32} />
                    Changes to Terms
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {companyName} reserves the right to update this Agreement at
                    any time. We will notify you of material changes by posting
                    updated terms on our website.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    By continuing to use the services after changes are posted,
                    you agree to be bound by the modified terms.
                  </p>
                </section>

                {/* Contact */}
                <section className="mb-8">
                  <div className="bg-linear-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      Questions?
                    </h3>
                    <p className="text-gray-700 mb-2">
                      If you have questions about these terms, please contact
                      us:
                    </p>
                    <a
                      href={`mailto:${companyEmail}`}
                      className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                    >
                      {companyEmail}
                    </a>
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
