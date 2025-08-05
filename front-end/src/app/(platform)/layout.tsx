import { PlatformSidebar } from "@/components/platform-sidebar";
import {
  ErrorBoundary,
  NetworkErrorBoundary,
} from "@/components/error-boundary";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ErrorBoundary>
        <main className="flex w-full relative">
          <PlatformSidebar />
          <div className="md:ml-12 mt-16 sm:mt-20 w-full">
            <NetworkErrorBoundary>{children}</NetworkErrorBoundary>
          </div>
        </main>
      </ErrorBoundary>
    </>
  );
}
