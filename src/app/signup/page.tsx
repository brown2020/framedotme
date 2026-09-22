import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Frame.me account with email or Google.",
};

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : {};
  const raw = firstParam(params.redirect);
  const redirectTo =
    raw?.startsWith("/") && !raw.startsWith("//") ? raw : null;

  return (
    <AuthCard
      title="Create your account"
      subtitle="Email and password — or continue with Google"
    >
      <SignupForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
