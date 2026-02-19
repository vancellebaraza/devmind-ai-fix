import { useState, useEffect } from "react";
import { supabase, type Session, type Insight } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { generateInsights } from "@/lib/gemini";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, ChevronDown, ChevronUp, Code2, Clock } from "lucide-react";

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(session.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-mono">{session.language}</Badge>
              <Badge
                variant="outline"
                className={`text-xs ${session.mode === "eli5" ? "border-yellow-300 text-yellow-700 bg-yellow-50" : "border-blue-300 text-blue-700 bg-blue-50"}`}
              >
                {session.mode.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-foreground font-medium line-clamp-2">{session.summary}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {date}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded(!expanded)}
              className="h-7 gap-1 text-xs"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Collapse" : "View Fix"}
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border">
          <div className="p-5 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Explanation</h4>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{session.explanation}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5" /> Fixed Code
              </h4>
              <div className="code-block text-xs max-h-64 overflow-auto">{session.fixed_code}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: sessionData } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSessions((sessionData as Session[]) ?? []);
      setLoadingSessions(false);

      // Fetch existing insight
      const { data: insightData } = await supabase
        .from("insights")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (insightData) setInsights(insightData as Insight);
    };
    fetchData();
  }, [user]);

  const generateNewInsights = async () => {
    if (!user || sessions.length < 5) return;
    setLoadingInsights(true);

    try {
      const last10 = sessions.slice(0, 10).map((s) => s.summary).filter(Boolean);
      const insightText = await generateInsights(last10);
      const relatedIds = sessions.slice(0, 10).map((s) => s.id);

      const { data } = await supabase
        .from("insights")
        .insert({ user_id: user.id, insight_text: insightText, related_session_ids: relatedIds })
        .select()
        .single();

      if (data) setInsights(data as Insight);
      toast({ title: "Insights generated!", description: "AI analyzed your patterns." });
    } catch {
      toast({ title: "Failed to generate insights", variant: "destructive" });
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Fix History</h1>
          <p className="text-muted-foreground mt-1">All your past debugging sessions.</p>
        </div>

        {/* Pattern Insights */}
        {sessions.length >= 5 && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <Lightbulb className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Pattern Insights</h3>
                  {insights ? (
                    <p className="mt-1 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                      {insights.insight_text}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      You have {sessions.length} sessions! Generate AI insights about your coding patterns.
                    </p>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={generateNewInsights}
                disabled={loadingInsights}
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loadingInsights ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                ) : insights ? "Refresh" : "Generate"}
              </Button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        {loadingSessions ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Code2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No sessions yet</p>
            <p className="text-sm mt-1">Head to the dashboard to start fixing code!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
