export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full flex-1 w-full p-5 space-y-5">
      {children}
    </div>
  );
}
