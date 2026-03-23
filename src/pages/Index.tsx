import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cpu, Zap, Brain, ToggleLeft, Clock, ArrowRight, Code2, Terminal } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Code Fix",
    description: "Paste your broken code and get a working fix in seconds, powered by AI.",
  },
  {
    icon: Brain,
    title: "Stack Context Awareness",
    description: "DevMind knows your tech stack and tailors every fix to your specific environment.",
  },
  {
    icon: ToggleLeft,
    title: "ELI5 / Expert Toggle",
    description: "Get explanations in simple analogies or concise technical language—your choice.",
  },
  {
    icon: Clock,
    title: "Fix History & Insights",
    description: "Browse your past fixes and get AI-generated insights about recurring patterns.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-foreground text-lg">DevMind AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 sm:py-32">
        <div className="container relative text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground font-medium mb-8 animate-fade-in shadow-card">
            <Zap className="h-3.5 w-3.5 text-accent" />
            AI-Powered Code Debugging
          </div>

          <h1 className="mx-auto max-w-3xl font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground animate-fade-in leading-tight">
            Your AI-Powered
            <br />
            <span className="text-primary">Developer Sidekick</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed animate-fade-in">
            Paste broken code or error messages and get instant AI-powered fixes
            with clear explanations — tailored to your exact tech stack.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in">
            <Link to="/signup">
              <Button size="lg" className="gap-2 px-8">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2 px-8">
                Sign in
              </Button>
            </Link>
          </div>

          {/* Demo snippet */}
          <div className="mt-16 mx-auto max-w-2xl rounded-xl overflow-hidden border border-code-border shadow-card animate-fade-in">
            <div className="flex items-center gap-2 bg-code-bg px-4 py-3 border-b border-code-border">
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <div className="ml-2 flex items-center gap-1.5 text-xs text-code-fg/40">
                <Terminal className="h-3 w-3" />
                error.js
              </div>
            </div>
            <div className="code-block rounded-none border-0 text-left text-sm">
              <span className="text-red-400">TypeError: Cannot read properties of undefined</span>
              {"\n"}
              <span className="text-code-fg/50">    at getUserData </span>
              <span className="text-yellow-500/80">(app.js:42)</span>
              {"\n\n"}
              <span className="text-emerald-400">// ✓ DevMind AI Fix:</span>
              {"\n"}
              <span className="text-blue-400">const</span>
              {" userData = user"}
              <span className="text-yellow-500/80">?.</span>
              {"data "}
              <span className="text-blue-400">??</span>
              {" null;"}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl font-bold text-foreground">Everything you need to debug faster</h2>
            <p className="mt-3 text-muted-foreground">Stop Googling. Start fixing.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-hover rounded-xl border border-border bg-card p-6 shadow-card"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <feature.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container text-center">
          <div className="mx-auto max-w-xl rounded-2xl bg-primary p-10 text-primary-foreground">
            <Code2 className="mx-auto h-10 w-10 mb-4 opacity-80" />
            <h2 className="font-heading text-3xl font-bold mb-3">Ready to fix your code?</h2>
            <p className="opacity-80 mb-6">Join developers who debug smarter with AI.</p>
            <Link to="/signup">
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
                Start for free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="container flex items-center justify-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <span>DevMind AI — Your AI-Powered Developer Sidekick</span>
        </div>
      </footer>
    </div>
  );
}
