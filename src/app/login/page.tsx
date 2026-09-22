import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Frame.me with email or Google.",
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const raw = firstParam(params.redirect);
  const redirectTo =
    raw?.startsWith("/") && !raw.startsWith("//") ? raw : null;

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to capture and share recordings"
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
