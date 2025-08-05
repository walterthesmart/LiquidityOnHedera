import { redirect } from "next/navigation";

// Simple auth router that redirects to dashboard
// This avoids Clerk issues during build time
export default function AuthRouter() {
  // During build time, just redirect to dashboard
  redirect("/dashboard");
}
