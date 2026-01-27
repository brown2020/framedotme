import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Frame.me",
  description: "Privacy policy for Frame.me screen capture and recording tool.",
};

export default function PrivacyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4">{children}</div>
      <Footer />
    </div>
  );
}
