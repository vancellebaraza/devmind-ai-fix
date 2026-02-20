import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase, type Session } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeDiffViewer } from "@/components/CodeDiffViewer";
import { Cpu, ArrowRight, Copy, CheckCheck, Code2, AlertTriangle, Calendar, GitCompare, Code } from "lucide-react";

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeView, setCodeView] = useState<"split" | "diff">("split");

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
      } else {
        setSession(data as Session);
      }
      setLoading(false);
    };
    fetchSession();
  }, [id]);

  const copyFix = () => {
    if (session?.fixed_code) {
      navigator.clipboard.writeText(session.fixed_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center gap-4 px-4">
        <Code2 className="h-12 w-12 text-muted-foreground opacity-40" />
        <h1 className="text-2xl font-bold text-foreground">Fix not found</h1>
        <p className="text-muted-foreground">This shared fix doesn't exist or was removed.</p>
        <Link to="/signup">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Try DevMind AI</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">DevMind AI</span>
          </div>
          <Link to="/signup">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1">
              Try DevMind AI <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-10 max-w-4xl">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="font-mono">{session.language}</Badge>
          <Badge
            variant="outline"
            className={`${session.mode === "eli5" ? "border-yellow-300 text-yellow-700 bg-yellow-50" : "border-blue-300 text-blue-700 bg-blue-50"}`}
          >
            {session.mode.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground ml-auto">
            Shared via DevMind AI
          </span>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => setCodeView("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                codeView === "split"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code className="h-3.5 w-3.5" /> Side by Side
            </button>
            <button
              onClick={() => setCodeView("diff")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                codeView === "diff"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitCompare className="h-3.5 w-3.5" /> Diff View
            </button>
          </div>
        </div>

        {codeView === "split" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Code */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-destructive/10 text-destructive text-xs">!</span>
                  Original broken code
                </h2>
              </div>
              <div className="code-block rounded-none border-0 text-sm max-h-64 overflow-auto">
                {session.input_code}
              </div>
            </div>

            {/* Fixed Code */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-green-500/10 text-green-600 text-xs">✓</span>
                  Fixed Code
                </h2>
                <Button size="sm" variant="outline" onClick={copyFix} className="h-7 gap-1 text-xs">
                  {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="code-block rounded-none border-0 text-sm max-h-64 overflow-auto">
                {session.fixed_code}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitCompare className="h-4 w-4 text-primary" />
                Diff View
              </h2>
              <Button size="sm" variant="outline" onClick={copyFix} className="h-7 gap-1 text-xs">
                {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Fixed"}
              </Button>
            </div>
            <div className="p-1">
              <CodeDiffViewer oldCode={session.input_code} newCode={session.fixed_code} />
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-base font-semibold text-foreground mb-3">What went wrong</h2>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{session.explanation}</p>
          <div className="mt-4 pt-4 border-t border-border">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {session.summary}
            </span>
          </div>
        </div>

        {/* Session Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-3 px-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Code2 className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{session.language}</span>
          </div>
          <span className="text-border">·</span>
          <Badge
            variant="outline"
            className={`text-xs ${session.mode === "eli5" ? "border-yellow-300 text-yellow-700 bg-yellow-50" : "border-blue-300 text-blue-700 bg-blue-50"}`}
          >
            {session.mode.toUpperCase()} mode
          </Badge>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Fixed on {new Date(session.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>

        {/* Related Risks */}
        {(() => {
          let risks: string[] = [];
          try {
            const raw = (session as unknown as Record<string, unknown>).related_risks;
            if (Array.isArray(raw)) risks = raw as string[];
          } catch {}
          return risks.length > 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-card">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Watch Out For
              </h2>
              <div className="flex flex-wrap gap-2">
                {risks.map((risk: string, i: number) => (
                  <span key={i} className="inline-flex items-center rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 px-2.5 py-1 text-xs leading-snug">
                    {risk}
                  </span>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* CTA */}
        <div className="mt-8 rounded-2xl bg-primary p-8 text-center text-primary-foreground">
          <Cpu className="mx-auto h-8 w-8 mb-3 opacity-90" />
          <h3 className="text-xl font-bold mb-2">Fix your own broken code</h3>
          <p className="text-primary-foreground/80 text-sm mb-4">
            Paste any code or error and get an instant AI-powered fix.
          </p>
          <Link to="/signup">
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold gap-2">
              Try DevMind AI free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
