import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MonsterCompanion } from "@/components/monster-companion";
import { CheckCircle2, Flame, Trophy, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="w-full py-4 px-6 flex items-center justify-between border-b border-border">
        <h1 className="text-xl font-bold text-primary">Chomper</h1>
        <Button asChild data-testid="button-login">
          <a href="/api/login">Log In</a>
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
              Make Productivity Fun
            </h2>
            <p className="text-lg text-muted-foreground">
              Meet your new productivity companion! Chomper turns your to-do list into a delightful game where completing tasks keeps your monster happy and fed.
            </p>
          </div>

          <Button size="lg" className="text-lg px-8" asChild data-testid="button-get-started">
            <a href="/api/login">Get Started</a>
          </Button>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h3 className="font-semibold text-sm">Chomp Tasks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete tasks to feed your monster
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <Flame className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <h3 className="font-semibold text-sm">Build Streaks</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Stay consistent and grow your streak
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <Trophy className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <h3 className="font-semibold text-sm">Earn Achievements</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Unlock rewards as you progress
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-4 text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-semibold text-sm">Unlock Monsters</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Discover new companions
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
