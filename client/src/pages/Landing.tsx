import { useLocation } from "wouter";
import { ArrowRight, Brain, LogOut, Mic, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const featureCards = [
  {
    title: "Adaptive questioning",
    description: "The interviewer adjusts difficulty, tone, and follow-ups based on your answers.",
    icon: Brain,
  },
  {
    title: "Voice and chat modes",
    description: "Practice in the flow that matches your interview style without changing screens.",
    icon: Mic,
  },
  {
    title: "Instant feedback",
    description: "Get performance scoring, strengths, and clear improvement areas after each session.",
    icon: TrendingUp,
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, user, lastFeedback, signOut } = useAuth();

  const handleStart = () => {
    if (isAuthenticated) {
      setLocation("/interview");
    } else {
      setLocation("/auth");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.96)_48%,rgba(248,250,252,0.94)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.82)_0%,rgba(15,23,42,0.95)_48%,rgba(2,6,23,0.98)_100%)]" />
      <div className="absolute left-[-6rem] top-[8rem] h-72 w-72 rounded-full bg-primary/10 blur-3xl dark:bg-cyan-400/20" />
      <div className="absolute right-[-4rem] bottom-[5rem] h-80 w-80 rounded-full bg-sky-500/10 blur-3xl dark:bg-blue-500/20" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">InterviewProAI</p>
              <p className="text-sm text-muted-foreground">Adaptive interview practice workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <div className="hidden items-center gap-3 rounded-full border border-border bg-background/70 px-4 py-2 text-sm text-foreground/80 shadow-sm backdrop-blur md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Signed in as {user.name}
              </div>
            )}
            <ThemeToggle />
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-16">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-4 py-2 text-sm text-foreground shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Private interview coaching with a polished workflow
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Practice interviews in a workspace that feels calm, sharp, and intentional.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Sign in, launch a role-specific mock interview, and get guided feedback without the clutter of a typical dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" onClick={handleStart} className="rounded-full px-6 shadow-lg shadow-primary/20">
                {isAuthenticated ? "Continue to interview" : "Get started"}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {!isAuthenticated ? (
                <Button size="lg" variant="outline" onClick={() => setLocation("/auth")} className="rounded-full px-6">
                  Create workspace access
                </Button>
              ) : (
                <Button size="lg" variant="outline" onClick={() => { signOut(); setLocation("/"); }} className="rounded-full px-6">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {featureCards.map((feature) => {
                const Icon = feature.icon;

                return (
                  <Card key={feature.title} className="border-border bg-card/90 p-5 shadow-sm backdrop-blur-xl">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-medium text-card-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-5 lg:pl-6">
            <Card className="border-border bg-card/90 p-6 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-primary">Workspace snapshot</p>
                  <h2 className="mt-2 text-2xl font-semibold text-card-foreground">What you get</h2>
                </div>
                <div className="rounded-full border border-border bg-background px-3 py-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Live
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="font-medium text-card-foreground">Beautiful interview shell</p>
                  <p className="mt-1">A focused layout with adaptive panels and clean spacing.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="font-medium text-card-foreground">Role-aware practice</p>
                  <p className="mt-1">Switch between roles, modes, and interview depth without reloading the app.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/60 p-4">
                  <p className="font-medium text-card-foreground">Exit back to home</p>
                  <p className="mt-1">When the interview ends, the app returns to this landing page automatically.</p>
                </div>
              </div>
            </Card>

            {lastFeedback && (
              <Card className="border-border bg-card/90 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-primary">Latest feedback</p>
                    <h3 className="mt-2 text-xl font-semibold text-card-foreground">Your last score is saved</h3>
                  </div>
                  <div className="rounded-2xl border border-border bg-background px-4 py-2 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Overall</p>
                    <p className="text-2xl font-semibold text-card-foreground">{lastFeedback.overallScore.toFixed(1)}/10</p>
                  </div>
                </div>

                <Separator className="my-5" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Strength</p>
                    <p className="mt-2 text-sm text-muted-foreground">{lastFeedback.strengths[0] || "Strong structure and clear delivery."}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Improve</p>
                    <p className="mt-2 text-sm text-muted-foreground">{lastFeedback.improvements[0] || "Keep answers concise and anchored in examples."}</p>
                  </div>
                </div>
              </Card>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}