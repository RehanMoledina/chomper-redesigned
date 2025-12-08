import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MonsterCompanion } from "@/components/monster-companion";
import { CheckCircle, AlertCircle, ArrowLeft, Loader2, Mail } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    setToken(tokenParam);
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) => {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to verify email");
      }
      return res.json();
    },
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  useEffect(() => {
    if (token && !success && !error && !verifyMutation.isPending) {
      verifyMutation.mutate(token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">Chomper</h1>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8">
            <div className="flex justify-center">
              <MonsterCompanion 
                state="idle" 
                size="medium" 
                showMessage={false}
              />
            </div>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Invalid Verification Link</CardTitle>
                <CardDescription>
                  This email verification link is invalid or missing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/login">
                  <Button className="w-full" data-testid="button-go-to-login">
                    Go to Login
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (verifyMutation.isPending) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">Chomper</h1>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8">
            <div className="flex justify-center">
              <MonsterCompanion 
                state="eating" 
                size="medium" 
                showMessage={false}
              />
            </div>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Verifying Email...</CardTitle>
                <CardDescription>
                  Please wait while we verify your email address.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">Chomper</h1>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8">
            <div className="flex justify-center">
              <MonsterCompanion 
                state="celebrating" 
                size="medium" 
                showMessage={false}
              />
            </div>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Email Verified!</CardTitle>
                <CardDescription>
                  Your email has been verified successfully. You can now enjoy all features of Chomper!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button className="w-full" data-testid="button-go-to-app">
                    Start Chomping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
          <Link href="/">
            <h1 className="text-xl font-bold text-primary cursor-pointer">Chomper</h1>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full space-y-8">
            <div className="flex justify-center">
              <MonsterCompanion 
                state="hungry" 
                size="medium" 
                showMessage={false}
              />
            </div>

            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Verification Failed</CardTitle>
                <CardDescription>
                  {error}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/login">
                  <Button className="w-full" data-testid="button-go-to-login">
                    Go to Login
                  </Button>
                </Link>
                <p className="text-sm text-center text-muted-foreground">
                  Need a new verification link? Log in and request one from your settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return null;
}
