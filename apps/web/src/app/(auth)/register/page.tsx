"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Logo,
  Badge,
  Spinner,
} from "@saas/ui";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [inviteCode, setInviteCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteCode: inviteCode ? inviteCode.toUpperCase() : undefined }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message ?? "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Auto sign-in upon successful registration
      const loginResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (!loginResult?.ok || loginResult.error) {
        // Redirect to login if auto-login fails
        router.push("/login?registered=true");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-md shadow-card">
      <CardHeader>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start generating high-definition neural voices in seconds
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Full Name"
            type="text"
            required
            placeholder="Alex Morgan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            fullWidth
          />

          <Input
            label="Work Email"
            type="email"
            required
            placeholder="alex@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            fullWidth
          />

          <Input
            label="Password (min. 8 characters)"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
          />

          <Input
            label="Confirm Password"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
          />

          <Input
            label="Invite Code (Optional)"
            type="text"
            placeholder="VX-XXXXX"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            fullWidth
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Create Account & Claim 1,000 Credits
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="text-primary font-medium hover:underline"
            >
              Sign in here
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-background relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <Link href="/">
            <Logo size="lg" variant="full" animated />
          </Link>
          <Badge variant="success" size="sm" dot className="mt-2">
            Get 1,000 Free Credits on Sign Up
          </Badge>
        </div>

        <React.Suspense
          fallback={
            <div className="flex items-center justify-center p-12 bg-card rounded-xl border border-border">
              <Spinner size="lg" color="primary" />
            </div>
          }
        >
          <RegisterForm />
        </React.Suspense>
      </div>
    </div>
  );
}
