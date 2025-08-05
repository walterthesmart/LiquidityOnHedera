export default function LandingPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen   bg-gradient-to-b from-background to-secondary/5 ">
      {children}
    </div>
  );
}
