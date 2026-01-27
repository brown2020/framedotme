"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import useProfileStore from "@/zustand/useProfileStore";
import { deleteCookie, getCookie } from "cookies-next";
import { REDIRECT_URL_COOKIE_NAME } from "@/lib/constants";
import { logger } from "@/utils/logger";
import { ClipLoader } from "react-spinners";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function LoginFinishPage() {
  const router = useRouter();
  const setAuthDetails = useAuthStore((s) => s.setAuthDetails);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const uid = useAuthStore((s) => s.uid);
  
  const [status, setStatus] = useState<"loading" | "needEmail" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    async function attemptSignIn() {
      let redirectPath = "/capture";
      try {
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          throw new Error("Sign in link is not valid");
        }

        let email = window.localStorage.getItem("frameEmail");
        const name = window.localStorage.getItem("frameName") || "";

        logger.debug("Attempting sign in with email:", email, name);
        if (!email) {
          setStatus("needEmail");
          return;
        }

        const userCredential = await signInWithEmailLink(
          auth,
          email,
          window.location.href
        );

        const user = userCredential.user;
        const authEmail = user?.email;
        const uid = user?.uid;
        const selectedName = name || user?.displayName || "";

        logger.debug("User auth data:", authEmail, uid, selectedName);

        if (!uid || !authEmail) {
          throw new Error("No user found");
        }

        logger.info(
          "User signed in successfully:",
          authEmail,
          uid,
          selectedName
        );

        setAuthDetails({
          uid,
          authEmail,
          authDisplayName: selectedName,
        });
        
        if (uid) {
          updateProfile(uid, { displayName: selectedName });
        }

        const cookieRedirect = getCookie(REDIRECT_URL_COOKIE_NAME);
        if (typeof cookieRedirect === "string" && cookieRedirect.startsWith("/")) {
          redirectPath = cookieRedirect;
        }
        
        router.replace(redirectPath);
      } catch (error) {
        let message = "Unknown error signing in";
        if (error instanceof FirebaseError) {
          message = error.message;
        } else if (error instanceof Error) {
          message = error.message;
        }

        logger.error("Login finish error:", message);
        setErrorMessage(message);
        setStatus("error");
        
        setTimeout(() => {
          redirectPath = "/";
          router.replace(redirectPath);
        }, 3000);
      } finally {
        window.localStorage.removeItem("frameEmail");
        window.localStorage.removeItem("frameName");
        deleteCookie(REDIRECT_URL_COOKIE_NAME);
      }
    }

    if (status === "loading") {
      attemptSignIn();
    }
  }, [router, setAuthDetails, updateProfile, uid, status]);

  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) return;
    
    window.localStorage.setItem("frameEmail", emailInput);
    setStatus("loading");
  };

  if (status === "needEmail") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#333b51] p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Confirm Your Email</h2>
          <p className="text-gray-600 mb-4">
            Please enter the email address you used to sign in.
          </p>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
            placeholder="your@email.com"
            className="border border-gray-300 rounded-md px-3 py-2 w-full mb-4"
            autoFocus
          />
          <Button onClick={handleEmailSubmit} className="w-full">
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#333b51] p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <p className="text-white text-center mt-4">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#333b51]">
      <ClipLoader color="#fff" size={80} />
      <p className="text-white mt-4">Completing sign in...</p>
    </div>
  );
}
