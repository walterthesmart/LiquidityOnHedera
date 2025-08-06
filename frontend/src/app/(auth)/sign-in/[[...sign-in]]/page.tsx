import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignInForm } from "./_components/sign-in-form";
export default async function SignInPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/auth-router");
  }

  return (
    <div className="  w-full min-h-screen grid justify-center items-center">
      <SignInForm />
    </div>
  );
}
