import { useState, useEffect } from "react";
import { supabase, type Session } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { generatePatterns } from "@/lib/gemini";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dna, Flame, TrendingUp, Code2, Lightbulb, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface Pattern {
  title: string;
  frequency: string;
  description: string;
  tip: string;
}

function calculateStreaks(sessions: Session[]) {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const daySet = new Set(
    sessions.map((s) => new Date(s.created_at).toISOString().split("T")[0])
  );

  const sortedDays = Array.from(daySet).sort().reverse();

  // Current streak
  let current = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedDays.length; i++) {
    const day = new Date(sortedDays[i]);
    day.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - day.getTime()) / 86400000);
    if (diffDays === i || (i === 0 && diffDays === 1)) {
      current++;
    } else {
      break;
    }
  }

  // Longest streak
  const allDays = Array.from(daySet).sort();
  let longest = 1;
  let streak = 1;
  for (let i = 1; i < allDays.length; i++) {
    const prev = new Date(allDays[i - 1]);
    const curr = new Date(allDays[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      streak++;
      longest = Math.max(longest, streak);
    } else {
      streak = 1;
    }
  }

  return { current, longest };
}

function getLanguageBreakdown(sessions: Session[]) {
  const counts: Record<string, number> = {};
  sessions.forEach((s) => {
    if (s.language) counts[s.language] = (counts[s.language] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
}

function getLast14Days(sessions: Session[]) {
  const days: { date: string; fixes: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const dateStr = d.toISOString().split("T")[0];
    const fixes = sessions.filter((s) => s.created_at.startsWith(dateStr)).length;
    days.push({ date: label, fixes });
  }
  return days;
}

export default function DnaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingPatterns, setLoadingPatterns] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSessions((data as Session[]) ?? []);
      setLoadingSessions(false);
    };
    fetchSessions();
  }, [user]);

  const handleGeneratePatterns = async () => {
    if (!user || sessions.length < 3) return;
    setLoadingPatterns(true);
    try {
      const summaries = sessions.slice(0, 20).map((s) => s.summary).filter(Boolean);
      const result = await generatePatterns(summaries);
      setPatterns(result.patterns);
    } catch {
      toast({ title: "Failed to analyze patterns", variant: "destructive" });
    } finally {
      setLoadingPatterns(false);
    }
  };

  const streaks = calculateStreaks(sessions);
  const languageData = getLanguageBreakdown(sessions);
  const timelineData = getLast14Days(sessions);
  const maxLang = languageData[0]?.count ?? 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Dna className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Debug DNA</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-12">Your personal error profile built from all your sessions.</p>
        </div>

        {loadingSessions ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton rounded-xl h-40" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Code2 className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No sessions yet</p>
            <p className="text-sm mt-1">Start debugging on the dashboard to build your DNA profile.</p>
          </div>
        ) : (
          <div className="space-y-8">

            {/* Section 1 — Streak Tracker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center">
                <div className="text-4xl mb-2">🔥</div>
                <div className="text-3xl font-bold text-foreground">{streaks.current} day{streaks.current !== 1 ? "s" : ""}</div>
                <div className="text-sm text-muted-foreground mt-1">Current Streak</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card text-center">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="h-8 w-8 text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-foreground">{streaks.longest} day{streaks.longest !== 1 ? "s" : ""}</div>
                <div className="text-sm text-muted-foreground mt-1">Longest Streak</div>
              </div>
            </div>

            {/* Section 2 — Top Mistake Patterns */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">Your Top Mistake Patterns</h2>
                </div>
                {sessions.length >= 3 && (
                  <Button
                    size="sm"
                    onClick={handleGeneratePatterns}
                    disabled={loadingPatterns}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-8 text-xs"
                  >
                    {loadingPatterns ? (
                      <span className="h-3 w-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    {patterns ? "Refresh" : "Analyze Patterns"}
                  </Button>
                )}
              </div>

              <div className="p-6">
                {sessions.length < 3 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete at least 3 debugging sessions to unlock pattern analysis.
                  </p>
                ) : !patterns && !loadingPatterns ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Click "Analyze Patterns" to discover your recurring coding mistakes.
                  </p>
                ) : loadingPatterns ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton h-20 rounded-lg" />
                    ))}
                  </div>
                ) : patterns && patterns.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {patterns.map((pattern, i) => (
                      <div key={i} className="rounded-lg border border-border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm text-foreground">{pattern.title}</h3>
                          <span className="shrink-0 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                            {pattern.frequency}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{pattern.description}</p>
                        <div className="flex items-start gap-1.5 text-xs text-foreground bg-primary/5 rounded-md px-2.5 py-2 border border-primary/10">
                          <span className="text-primary font-bold shrink-0 mt-0.5">→</span>
                          <span>{pattern.tip}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Not enough distinct patterns found yet.
                  </p>
                )}
              </div>
            </div>

            {/* Section 3 — Language Breakdown */}
            {languageData.length > 0 && (
              <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                  <Code2 className="h-4 w-4 text-primary" />
                  <h2 className="font-semibold text-foreground">Language Breakdown</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {languageData.map(({ language, count }) => (
                      <div key={language} className="flex items-center gap-3">
                        <span className="text-sm text-foreground w-28 shrink-0 font-mono">{language}</span>
                        <div className="flex-1 bg-muted/40 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${(count / maxLang) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                          {count} session{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section 4 — Progress Timeline */}
            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h2 className="font-semibold text-foreground">Your Debugging Activity</h2>
                <span className="text-xs text-muted-foreground ml-auto">Last 14 days</span>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timelineData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      interval={3}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        color: "hsl(var(--foreground))",
                      }}
                      cursor={{ fill: "hsl(var(--muted)/0.4)" }}
                      formatter={(value: number) => [value, "fixes"]}
                    />
                    <Bar dataKey="fixes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
