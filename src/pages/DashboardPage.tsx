import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { fixCode } from "@/lib/gemini";
import { Navbar } from "@/components/Navbar";
import { CodeDiffViewer } from "@/components/CodeDiffViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Zap, Copy, Share2, CheckCheck, AlertTriangle, GitCompare, Code } from "lucide-react";

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "React",
  "Node.js", "Go", "Rust", "PHP", "Other",
];

interface FixResult {
  root_cause: string;
  explanation: string;
  fixed_code: string;
  summary: string;
  related_risks: string[];
  sessionId?: string;
}

function AnalysisSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="skeleton h-5 w-32 mb-4 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/6 rounded" />
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="skeleton h-3.5 w-full rounded" />
            <div className="skeleton h-3.5 w-5/6 rounded" />
            <div className="skeleton h-3.5 w-3/4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inputCode, setInputCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [mode, setMode] = useState<"expert" | "eli5">("expert");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [stackContext, setStackContext] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [codeView, setCodeView] = useState<"fixed" | "diff">("fixed");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("stack_context")
        .eq("id", user.id)
        .single();
      if (data?.stack_context) setStackContext(data.stack_context);
    };
    fetchProfile();
  }, [user]);

  const handleAnalyze = async () => {
    if (!inputCode.trim()) {
      toast({ title: "Empty input", description: "Please paste your code or error message.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const fix = await fixCode({ inputCode, language, mode, stackContext });

      // Save to Supabase
      let sessionId: string | undefined;
      if (user) {
        const { data } = await supabase
          .from("sessions")
          .insert({
            user_id: user.id,
            input_code: inputCode,
            error_message: null,
            fixed_code: fix.fixed_code,
            explanation: fix.explanation,
            summary: fix.summary,
            mode,
            language,
            is_public: true,
          })
          .select("id")
          .single();
        sessionId = data?.id;
      }

      setResult({ ...fix, related_risks: fix.related_risks ?? [], sessionId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Analysis failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyFix = () => {
    if (result?.fixed_code) {
      navigator.clipboard.writeText(result.fixed_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = () => {
    if (result?.sessionId) {
      const url = `${window.location.origin}/share/${result.sessionId}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast({ title: "Link copied!", description: "Share URL copied to clipboard." });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-foreground">Analyze & Fix</h1>
          <p className="text-muted-foreground mt-1">Paste your broken code or error message below.</p>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          {/* Mode Toggle */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm font-medium text-foreground">Mode:</span>
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setMode("expert")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === "expert"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Expert
              </button>
              <button
                onClick={() => setMode("eli5")}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  mode === "eli5"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                ELI5
              </button>
            </div>
            {mode === "eli5" && (
              <span className="text-xs text-muted-foreground">Simple explanations & analogies</span>
            )}
          </div>

          {/* Language selector */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Language:</span>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Code Input */}
          <Textarea
            placeholder="Paste your broken code or error message here..."
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="font-mono text-sm min-h-48 resize-y bg-muted/30 border-border"
          />

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary gap-2 px-6"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {loading ? "Analyzing..." : "Analyze & Fix"}
            </Button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && <AnalysisSkeleton />}

        {/* Results */}
        {result && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 animate-fade-in">
            {/* Left: Explanation */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-card flex flex-col gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-destructive/10 text-destructive text-xs">!</span>
                  What went wrong
                </h2>
                {result.root_cause && (
                  <div className="mb-3 rounded-lg bg-destructive/5 border border-destructive/20 px-4 py-2.5">
                    <span className="text-xs font-semibold text-destructive uppercase tracking-wider block mb-1">Root Cause</span>
                    <p className="text-sm font-semibold text-foreground">{result.root_cause}</p>
                  </div>
                )}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
              </div>
              <div className="pt-3 border-t border-border">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {result.summary}
                </span>
              </div>
              {result.related_risks && result.related_risks.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Watch Out For
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.related_risks.map((risk, i) => (
                      <span key={i} className="inline-flex items-center rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 px-2.5 py-1 text-xs leading-snug">
                        {risk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Fixed Code */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-green-500/10 text-green-600 text-xs">✓</span>
                  Fixed Code
                </h2>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex items-center rounded-md border border-border overflow-hidden">
                    <button
                      onClick={() => setCodeView("fixed")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                        codeView === "fixed"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Code className="h-3 w-3" /> Code
                    </button>
                    <button
                      onClick={() => setCodeView("diff")}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium transition-colors ${
                        codeView === "diff"
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <GitCompare className="h-3 w-3" /> Diff
                    </button>
                  </div>
                  {result.sessionId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={shareLink}
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {linkCopied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
                      {linkCopied ? "Copied!" : "Share Fix"}
                    </Button>
                  )}
                  {codeView === "fixed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyFix}
                      className="h-8 gap-1.5 text-xs"
                    >
                      {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy Fix"}
                    </Button>
                  )}
                </div>
              </div>
              {codeView === "fixed" ? (
                <div className="code-block rounded-none border-0 text-sm max-h-80 overflow-auto">
                  {result.fixed_code}
                </div>
              ) : (
                <div className="p-1">
                  <CodeDiffViewer oldCode={inputCode} newCode={result.fixed_code} />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
