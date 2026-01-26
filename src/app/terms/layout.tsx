import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | Frame.me",
  description: "Terms of service for Frame.me screen capture and recording tool.",
};

export default function TermsLayout({
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
