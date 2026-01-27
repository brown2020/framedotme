"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "@/firebase/firebaseClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FirebaseError } from "firebase/app";
import useProfileStore from "@/zustand/useProfileStore";
import { deleteCookie, getCookie } from "cookies-next";
import { REDIRECT_URL_COOKIE_NAME } from "@/lib/constants";
import { logger } from "@/utils/logger";

export default function LoginFinishPage() {
  const router = useRouter();
  const setAuthDetails = useAuthStore((s) => s.setAuthDetails);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const uid = useAuthStore((s) => s.uid);

  useEffect(() => {
    async function attemptSignIn() {
      let redirectPath = "/capture";
      try {
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          throw new Error("Sign in link is not valid");
        }

        let email = window.localStorage.getItem("frameEmail");
        const name = window.localStorage.getItem("frameName") || "";

        logger.debug("User signed in successfully:", email, name);
        if (!email) {
          email = window.prompt("Please confirm your email");
          if (!email) {
            throw new Error("Email confirmation cancelled by user");
          }
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
      } catch (error) {
        let errorMessage = "Unknown error signing in";
        if (error instanceof FirebaseError) {
          errorMessage = error.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        logger.error("Login finish error:", errorMessage);
        alert(errorMessage);
        redirectPath = "/";
      } finally {
        window.localStorage.removeItem("frameEmail");
        window.localStorage.removeItem("frameName");
        deleteCookie(REDIRECT_URL_COOKIE_NAME);
        router.replace(redirectPath);
      }
    }

    attemptSignIn();
  }, [router, setAuthDetails, updateProfile, uid]);
}
