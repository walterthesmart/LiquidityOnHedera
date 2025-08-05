import { SignIn } from "@clerk/nextjs";

export function SignInForm() {
  return (
    <SignIn
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary/80 hover:bg-primary h-8 text-lg",
          formFieldLabel: "font-semibold",
          formFieldInput: "h-12",

          footerAction: { display: "none" },
        },
      }}
    />
  );
}
