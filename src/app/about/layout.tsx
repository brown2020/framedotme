import Footer from "@/components/Footer";

export const metadata = {
  title: "About Frame.me | Screen Capture & Recording Tool",
  description:
    "Learn about Frame.me, the powerful tool that enables seamless screen capturing and recording. Perfect for creating tutorials, demos, and presentations, Frame.me simplifies sharing your screen with high-quality captures and easy-to-use features.",
  keywords:
    "About Frame.me, screen capture tool, recording software, tutorial creation, screen sharing, high-quality capture, video demos, presentation recording, user-friendly screen capture",
  canonical: "https://www.frame.me/about",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
