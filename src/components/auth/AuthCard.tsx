import type { ReactElement, ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  children,
}: AuthCardProps): ReactElement {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-linear-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-center text-gray-600 mb-6">{subtitle}</p>
        ) : (
          <div className="mb-6" />
        )}
        {children}
      </div>
    </div>
  );
}
