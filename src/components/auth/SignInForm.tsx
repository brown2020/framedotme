import Link from "next/link";
import Image from "next/image";
import { MailIcon, LockIcon } from "lucide-react";
import googleLogo from "@/app/assets/google.svg";

/**
 * Auth button props
 */
interface AuthButtonProps {
  label: string;
  logo: string;
  onClick: () => void;
}

/**
 * Auth button component for OAuth providers
 */
function AuthButton({ label, logo, onClick }: AuthButtonProps) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 w-full px-4 py-2 border rounded-md hover:bg-gray-100"
      onClick={onClick}
    >
      <div className="w-6 h-6 relative">
        <Image
          src={logo}
          alt={`${label} logo`}
          fill
          className="object-contain"
        />
      </div>
      <span className="grow text-center">{label}</span>
    </button>
  );
}

/**
 * Form field values
 */
interface FormFields {
  email: string;
  password: string;
  name: string;
  acceptTerms: boolean;
  isEmailLinkLogin: boolean;
}

/**
 * Form field setters
 */
interface FormFieldSetters {
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setName: (value: string) => void;
  setAcceptTerms: (value: boolean) => void;
  setIsEmailLinkLogin: (value: boolean) => void;
}

/**
 * Form handlers
 */
interface FormHandlers {
  onGoogleSignIn: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onPasswordReset: () => void;
}

/**
 * Sign-in form props
 */
interface SignInFormProps extends FormFields, FormFieldSetters, FormHandlers {
  formRef: React.RefObject<HTMLFormElement | null>;
  showGoogleSignIn: boolean;
}

/**
 * Main sign-in form component
 */
export function SignInForm({
  formRef,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  acceptTerms,
  setAcceptTerms,
  isEmailLinkLogin,
  setIsEmailLinkLogin,
  showGoogleSignIn,
  onGoogleSignIn,
  onSubmit,
  onPasswordReset,
}: SignInFormProps) {
  return (
    <form onSubmit={onSubmit} ref={formRef} className="flex flex-col gap-2">
      <div className="text-3xl text-center pb-3">Sign In</div>

      {showGoogleSignIn && (
        <>
          <AuthButton
            label="Continue with Google"
            logo={googleLogo}
            onClick={onGoogleSignIn}
          />
          <div className="flex items-center justify-center w-full h-12">
            <hr className="grow h-px bg-gray-400 border-0" />
            <span className="px-3">or</span>
            <hr className="grow h-px bg-gray-400 border-0" />
          </div>
        </>
      )}

      {isEmailLinkLogin && (
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="input-primary mb-2"
        />
      )}
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="input-primary"
      />
      {!isEmailLinkLogin && (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="input-primary mt-2"
        />
      )}

      {!isEmailLinkLogin && (
        <div className="text-right mt-2">
          <button
            type="button"
            onClick={onPasswordReset}
            className="underline text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot Password?
          </button>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={!email || (!isEmailLinkLogin && !password)}
      >
        {isEmailLinkLogin ? (
          <div className="flex items-center gap-2 h-8">
            <MailIcon size={20} />
            <span>Continue with Email Link</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 h-8">
            <LockIcon size={20} />
            <span>Continue with Password</span>
          </div>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsEmailLinkLogin(!isEmailLinkLogin)}
          className="underline"
        >
          {isEmailLinkLogin ? "Use Email/Password" : "Use Email Link"}
        </button>
      </div>

      <label className="flex items-center space-x-2 pl-1">
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          className="h-full"
          required
        />
        <span>
          I accept the{" "}
          <Link href={"/terms"} className="underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline">
            privacy
          </Link>{" "}
          policy.
        </span>
      </label>
    </form>
  );
}
