import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALL_TECHNOLOGIES = [
  "JavaScript", "TypeScript", "Python", "React", "Next.js",
  "Node.js", "Express", "Django", "FastAPI", "Supabase",
  "PostgreSQL", "MongoDB", "Flutter", "Swift", "Kotlin",
  "Go", "Rust", "Vue.js", "Angular", "PHP",
];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("stack_context")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.stack_context) setSelected(data.stack_context);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const toggleTech = (tech: string) => {
    setSelected((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ stack_context: selected })
        .eq("id", user.id);

      if (error) throw error;
      toast({ title: "Profile updated!", description: "Your stack context has been saved." });
    } catch {
      toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account and tech stack preferences.</p>
        </div>

        {/* Account Info */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card mb-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Account
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Stack Context */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-semibold text-foreground mb-2">Tech Stack</h2>
          <p className="text-sm text-muted-foreground mb-5">
            DevMind uses these to give better, context-aware code fixes.
          </p>

          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 mb-6">
              {ALL_TECHNOLOGIES.map((tech) => {
                const isSelected = selected.includes(tech);
                return (
                  <button
                    key={tech}
                    onClick={() => toggleTech(tech)}
                    className={`
                      inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all
                      ${isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-accent"
                      }
                    `}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {tech}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {selected.length} {selected.length === 1 ? "technology" : "technologies"} selected
            </span>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
