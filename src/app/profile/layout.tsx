import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Profile | Frame.me",
  description: "Manage your Frame.me account and settings.",
};

export default function ProfileLayout({
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
