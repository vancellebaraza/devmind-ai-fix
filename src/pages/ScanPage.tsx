import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { scanFile, type ScanIssue } from "@/lib/gemini";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScanSearch, AlertTriangle, Info, XCircle, ChevronDown, ChevronUp } from "lucide-react";

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "React",
  "Node.js", "Go", "Rust", "PHP", "Other",
];

function SeverityBadge({ severity }: { severity: ScanIssue["severity"] }) {
  if (severity === "critical") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 text-xs font-semibold">
        <XCircle className="h-3 w-3" /> Critical
      </span>
    );
  }
  if (severity === "warning") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-700 border border-yellow-300 px-2.5 py-0.5 text-xs font-semibold">
        <AlertTriangle className="h-3 w-3" /> Warning
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-300 px-2.5 py-0.5 text-xs font-semibold">
      <Info className="h-3 w-3" /> Suggestion
    </span>
  );
}

function IssueCard({ issue, index }: { issue: ScanIssue; index: number }) {
  const [expanded, setExpanded] = useState(index < 3);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <SeverityBadge severity={issue.severity} />
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                {issue.line_hint}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{issue.title}</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-1"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 py-4 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">What's Wrong</h4>
            <p className="text-sm text-foreground leading-relaxed">{issue.explanation}</p>
          </div>
          {issue.fix && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Fix</h4>
              <div className="code-block text-xs max-h-48 overflow-auto">{issue.fix}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScanSkeleton() {
  return (
    <div className="space-y-4 mt-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="skeleton h-4 w-24 mb-3 rounded" />
          <div className="skeleton h-5 w-64 mb-2 rounded" />
          <div className="skeleton h-4 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ScanPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<ScanIssue[] | null>(null);
  const [stackContext, setStackContext] = useState<string[]>([]);

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

  const handleScan = async () => {
    if (!code.trim()) {
      toast({ title: "Empty input", description: "Please paste your code file.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setIssues(null);

    try {
      const result = await scanFile({ code, language, stackContext });

      // Save to Supabase as a scan session
      if (user) {
        await supabase.from("sessions").insert({
          user_id: user.id,
          input_code: code,
          error_message: null,
          fixed_code: result.issues.map((i) => `[${i.severity.toUpperCase()}] ${i.title}: ${i.fix}`).join("\n\n"),
          explanation: result.issues.map((i) => `${i.line_hint} — ${i.explanation}`).join("\n"),
          summary: `File scan: ${result.issues.length} issue(s) found in ${language}`,
          mode: "scan",
          language,
          is_public: false,
        });
      }

      setIssues(result.issues);

      if (result.issues.length === 0) {
        toast({ title: "No issues found!", description: "Your code looks clean." });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast({ title: "Scan failed", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = issues?.filter((i) => i.severity === "critical").length ?? 0;
  const warningCount = issues?.filter((i) => i.severity === "warning").length ?? 0;
  const suggestionCount = issues?.filter((i) => i.severity === "suggestion").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Whole File Scanner</h1>
          <p className="text-muted-foreground mt-1">Paste an entire code file and get a comprehensive issue report.</p>
        </div>

        {/* Input Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
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

          <Textarea
            placeholder="Paste your entire code file here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-sm min-h-64 resize-y bg-muted/30 border-border"
          />

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleScan}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary gap-2 px-6"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              {loading ? "Scanning..." : "Scan for Issues"}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && <ScanSkeleton />}

        {/* Results */}
        {issues !== null && !loading && (
          <div className="mt-8 animate-fade-in">
            {issues.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-border bg-card shadow-card">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-3">
                  <span className="text-green-600 text-xl">✓</span>
                </div>
                <p className="font-semibold text-foreground">No issues found</p>
                <p className="text-sm text-muted-foreground mt-1">Your code looks clean!</p>
              </div>
            ) : (
              <>
                {/* Summary bar */}
                <div className="flex items-center gap-4 mb-5 p-4 rounded-xl border border-border bg-card shadow-card">
                  <span className="text-sm font-semibold text-foreground">
                    {issues.length} issue{issues.length !== 1 ? "s" : ""} found
                  </span>
                  <div className="flex items-center gap-3 ml-auto flex-wrap">
                    {criticalCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                        <XCircle className="h-3.5 w-3.5" /> {criticalCount} critical
                      </span>
                    )}
                    {warningCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> {warningCount} warning{warningCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {suggestionCount > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
                        <Info className="h-3.5 w-3.5" /> {suggestionCount} suggestion{suggestionCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {issues.map((issue, i) => (
                    <IssueCard key={i} issue={issue} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
