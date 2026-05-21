import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Terminal, Code, Lock } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center gap-4 mb-8">
            <Shield className="h-12 w-12 text-primary animate-pulse" />
            <Terminal className="h-12 w-12 text-secondary" />
            <Code className="h-12 w-12 text-accent" />
            <Lock className="h-12 w-12 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Master Secure Coding with{" "}
            <span className="text-primary">Hands-On Practice</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Learn to identify and fix security vulnerabilities through interactive
            CTF challenges, real-world simulations, and AI-powered security testing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg">
              <Link href="/challenges">Start Learning</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg">
              <Link href="/labs">Explore Labs</Link>
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Challenges</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">5K+</div>
              <div className="text-sm text-muted-foreground">Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Labs Online</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}