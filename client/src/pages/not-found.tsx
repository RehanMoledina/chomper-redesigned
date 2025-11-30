import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MonsterCompanion } from "@/components/monster-companion";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
      <div className="text-center px-4 max-w-sm">
        <MonsterCompanion 
          state="hungry" 
          size="large" 
          showMessage={true} 
          message="Oops! This page got chomped!" 
        />
        
        <h1 className="text-2xl font-semibold mt-6 mb-2">Page Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link href="/">
          <Button className="gap-2" data-testid="button-go-home">
            <Home className="h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>
    </div>
  );
}
