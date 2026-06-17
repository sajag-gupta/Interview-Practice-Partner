import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { ArrowRight, KeyRound, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/interview");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === "signup") {
        await signUp({ name, email, password });
      } else {
        await signIn({ email, password });
      }

      setLocation("/interview");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to continue right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.95)_48%,rgba(248,250,252,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82)_0%,rgba(15,23,42,0.95)_48%,rgba(2,6,23,0.98)_100%)]" />
      <div className="absolute left-[10%] top-[18%] h-72 w-72 rounded-full bg-primary/10 blur-3xl dark:bg-cyan-400/20" />
      <div className="absolute right-[12%] bottom-[8%] h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/20" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl gap-10 px-6 py-6 lg:grid-cols-[1fr_1.05fr] lg:px-10 lg:py-10">
        <section className="flex flex-col justify-between rounded-[2rem] border border-border bg-card/90 p-8 backdrop-blur-2xl shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-primary">InterviewProAI</p>
                <p className="text-sm text-muted-foreground">Secure workspace access</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          <div className="space-y-8 py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Private browser session with polished interview flow
            </div>

            <div className="space-y-5">
              <h1 className="max-w-xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
                Sign in to a focused interview workspace.
              </h1>
              <p className="max-w-lg text-lg leading-8 text-muted-foreground">
                Your session keeps the interview flow, feedback, and access state inside this browser so the experience stays quick and lightweight.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border bg-background/70 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">Dedicated access</p>
                    <p className="text-sm text-muted-foreground">Create or resume a workspace instantly.</p>
                  </div>
                </div>
              </Card>
              <Card className="border-border bg-background/70 p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">Simple passcode</p>
                    <p className="text-sm text-muted-foreground">No database setup required for the demo flow.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Button variant="outline" className="w-fit rounded-full" onClick={() => setLocation("/")}>
            Back to landing
          </Button>
        </section>

        <section className="flex items-center">
          <Card className="w-full border-border bg-card/90 shadow-2xl backdrop-blur-2xl">
            <CardContent className="space-y-6 p-8 sm:p-10">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.24em] text-primary">Workspace login</p>
                <h2 className="text-3xl font-semibold text-card-foreground">Continue in your browser</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use one account per browser profile and jump straight into the interview workspace.
                </p>
              </div>

              <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted text-muted-foreground">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form className="space-y-5 pt-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="email-signin">Email</Label>
                      <Input
                        id="email-signin"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-signin">Passcode</Label>
                      <Input
                        id="password-signin"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Enter your passcode"
                        className="bg-background"
                      />
                    </div>

                    {error && <p className="rounded-xl border border-rose-400/20 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-100">{error}</p>}

                    <Button type="submit" size="lg" className="w-full rounded-full" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Enter workspace"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form className="space-y-5 pt-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="name-signup">Display name</Label>
                      <Input
                        id="name-signup"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Alex Johnson"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-signup">Email</Label>
                      <Input
                        id="email-signup"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password-signup">Passcode</Label>
                      <Input
                        id="password-signup"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Create a passcode"
                        className="bg-background"
                      />
                    </div>

                    {error && <p className="rounded-xl border border-rose-400/20 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-100">{error}</p>}

                    <Button type="submit" size="lg" className="w-full rounded-full" disabled={isSubmitting}>
                      {isSubmitting ? "Creating account..." : "Create workspace"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}