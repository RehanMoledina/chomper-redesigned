import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MonsterCompanion } from "@/components/monster-companion";
import { CheckCircle2, Trophy, Repeat } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
        <h1 className="text-xl font-bold text-primary">Chomper</h1>
        <Button asChild data-testid="button-login">
          <Link href="/login">Log In</Link>
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="flex justify-center">
            <MonsterCompanion 
              state="happy" 
              size="large" 
              showMessage={false}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Organize Your Life
            </h2>
            <p className="text-lg text-muted-foreground">
              Never miss a bill, rent payment, or important deadline again. Set up recurring tasks that automatically reappear when you need them - daily, weekly, or monthly. Plus, your monster companion celebrates every task you complete!
            </p>
          </div>

          <Button size="lg" className="text-lg px-8" asChild data-testid="button-get-started">
            <Link href="/register">Get Started</Link>
          </Button>

          <div className="grid grid-cols-3 gap-3 pt-8">
            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm">Chomp Tasks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  In light mode or dark mode
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <h3 className="font-semibold text-sm">Track Progress</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Build streaks and earn achievements
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <Repeat className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold text-sm">Recurring Tasks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-regenerate daily, weekly, or monthly
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border">
        <p>Start chomping your tasks today</p>
      </footer>
    </div>
  );
}
