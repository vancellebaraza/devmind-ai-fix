import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Cpu, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALL_TECHNOLOGIES = [
  "JavaScript", "TypeScript", "Python", "React", "Next.js",
  "Node.js", "Express", "Django", "FastAPI", "Supabase",
  "PostgreSQL", "MongoDB", "Flutter", "Swift", "Kotlin",
  "Go", "Rust", "Vue.js", "Angular", "PHP",
];

export default function SetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTech = (tech: string) => {
    setSelected((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ stack_context: selected })
        .eq("id", user.id);

      if (error) throw error;
      navigate("/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Cpu className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">DevMind AI</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up your stack</h1>
          <p className="mt-2 text-muted-foreground">
            Select the technologies you work with so DevMind can give better fixes.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          <div className="flex flex-wrap gap-2.5 mb-8">
            {ALL_TECHNOLOGIES.map((tech) => {
              const isSelected = selected.includes(tech);
              return (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={`
                    inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm font-medium transition-all
                    ${isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
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

          {selected.length > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              {selected.length} {selected.length === 1 ? "technology" : "technologies"} selected
            </p>
          )}

          <div className="flex justify-between items-center">
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/dashboard")}
            >
              Skip for now
            </button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              {loading ? (
                <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
              ) : null}
              Start Fixing Code
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
