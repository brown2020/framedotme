import type { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "@/providers/ClientProvider";

import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Frame.me",
  description: "Create screen recordings with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClientProvider>
          <div className="flex flex-col h-full">
            <Header />
            <div className="flex flex-col h-container-small md:h-container-custom overflow-y-scroll">
              <div className="flex flex-col h-full flex-1">{children}</div>
            </div>
          </div>
        </ClientProvider>
      </body>
    </html>
  );
}
