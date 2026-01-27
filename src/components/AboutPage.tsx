"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ_DATA = [
  {
    question: "1. What is Frame.me?",
    answer:
      "Frame.me is a screen capture and recording tool designed to simplify capturing, organizing, and sharing high-quality screen content.",
  },
  {
    question: "2. How do I start a screen recording?",
    answer:
      'Choose your capture mode (full screen, window, or custom area), set your preferences, and click "Start Recording" to begin capturing.',
  },
  {
    question: "3. How do I organize my captures?",
    answer:
      "You can add custom tags to each capture, making it easier to search and filter your content later.",
  },
  {
    question: "4. How can I share my captures?",
    answer:
      "Simply generate a shareable link or post directly to social media channels from within the platform.",
  },
  {
    question: "5. Can I download my captures?",
    answer:
      "Yes, you can download your captures in high resolution directly to your device.",
  },
  {
    question: "6. Are there any limitations on recording quality?",
    answer:
      "Frame.me supports a range of resolutions and frame rates, though some settings may depend on your device capabilities.",
  },
  {
    question: "7. Is there a limit to the number of recordings I can save?",
    answer:
      "Free accounts have a limit on the number of stored recordings. Additional storage may require a credits purchase, depending on usage.",
  },
  {
    question: "8. Can I use Frame.me with my own video hosting?",
    answer:
      "Yes, you can download your captures and upload them to your preferred video hosting platform.",
  },
] as const;

export default function AboutPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ((prevIndex) => (prevIndex === index ? null : index));
  };

  return (
    <div className="flex flex-col h-full items-center px-6 py-12 justify-center w-full max-w-5xl mx-auto flex-1 gap-12 bg-gray-100">
      <div className="text-3xl font-bold text-center text-gray-800">
        About Frame.me
      </div>

      {/* About Section */}
      <div className="bg-white shadow-md p-8 rounded-lg">
        <p className="text-lg text-gray-700 leading-relaxed">
          Welcome to <strong>Frame.me</strong>, the ultimate screen capture and
          recording tool designed to make capturing and sharing your screen easy
          and effective. Whether you&apos;re creating tutorials, recording
          demos, or saving important moments, Frame.me provides high-quality
          screen capture and recording options tailored to your needs.
        </p>
        <p className="mt-4 text-lg text-gray-700">
          <span className="font-bold">Seamless Capture:</span> Frame.me allows
          you to capture your screen effortlessly, whether you need full-screen
          recording, selected areas, or specific windows. It’s built to support
          both quick snapshots and extended recording sessions with high
          resolution and clarity.
        </p>
        <p className="mt-4 text-lg text-gray-700">
          <span className="font-bold">Organize and Share:</span> Every capture
          you create is saved to your profile, where you can{" "}
          <strong>tag</strong>, <strong>search</strong>, and{" "}
          <strong>organize</strong> your files. With sharing options, you can
          quickly generate links to share with colleagues, friends, or on social
          media.
        </p>
        <p className="mt-4 text-lg text-gray-700">
          Whether you&apos;re creating a step-by-step guide, sharing a
          presentation, or documenting processes, Frame.me is here to help you
          capture and share effortlessly. Join our growing community and start
          creating today!
        </p>
      </div>

      {/* FAQs Section */}
      <div className="bg-white shadow-md p-8 rounded-lg w-full">
        <div className="text-3xl font-semibold text-gray-800 mb-6">
          Frequently Asked Questions
        </div>
        <div className="space-y-4">
          {FAQ_DATA.map((faq, index) => (
            <div key={index} className="border-b border-gray-300 pb-4">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium text-lg text-gray-800">
                  {faq.question}
                </span>
                {openFAQ === index ? (
                  <ChevronUp className="text-gray-500" />
                ) : (
                  <ChevronDown className="text-gray-500" />
                )}
              </div>
              {openFAQ === index && (
                <div className="mt-3 text-gray-600 text-lg">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
