import type { ReactNode } from "react";

export const metadata = {
  title: "Recordings | Frame.me",
  description: "View and manage your screen recordings.",
};

export default function RecordingsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col h-full flex-1 w-full p-5 space-y-5">
      {children}
    </div>
  );
}
