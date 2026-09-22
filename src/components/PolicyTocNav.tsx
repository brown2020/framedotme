"use client";

import type { LucideIcon } from "lucide-react";

export type PolicySection = {
  id: string;
  title: string;
  icon: LucideIcon;
};

type Props = {
  sections: PolicySection[];
  activeSection: string;
  onSelect: (id: string) => void;
  heading?: string;
  activeClassName?: string;
};

/**
 * Shared sticky table-of-contents nav for long policy pages.
 */
export function PolicyTocNav({
  sections,
  activeSection,
  onSelect,
  heading = "Contents",
  activeClassName = "bg-purple-100 text-purple-700 font-semibold",
}: Props) {
  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{heading}</h3>
        <nav className="space-y-2" aria-label={heading}>
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                type="button"
                key={section.id}
                onClick={() => {
                  onSelect(section.id);
                  document
                    .getElementById(section.id)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? activeClassName
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span className="text-sm">{section.title}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
