"use client";

import AuthComponent from "./AuthComponent";
import Footer from "./Footer";

export default function HomePage() {
  return (
    <div className="relative flex flex-col h-full w-full justify-center items-center text-white overflow-hidden">
      <div className="flex-1 flex items-center">
        <div className="flex flex-col z-10 gap-5 px-4 py-4 md:px-9 md:py-9 text-center max-w-4xl bg-black/40 rounded-lg">
          <h2 className="text-3xl md:text-5xl font-semibold">
            Welcome to Frame.me
          </h2>

          <h2 className="text-xl md:text-2xl md:px-9">
            Sign in to create, save and browse screen recordings.
          </h2>

          <AuthComponent />
        </div>
      </div>
      <Footer />
    </div>
  );
}
