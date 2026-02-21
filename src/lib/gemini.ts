import { supabase } from "@/integrations/supabase/client";

interface GeminiFixResult {
  root_cause: string;
  explanation: string;
  fixed_code: string;
  summary: string;
  related_risks: string[];
}

export interface ScanIssue {
  line_hint: string;
  severity: "critical" | "warning" | "suggestion";
  title: string;
  explanation: string;
  fix: string;
}

interface GeminiScanResult {
  issues: ScanIssue[];
}

interface GeminiPatternResult {
  patterns: {
    title: string;
    frequency: string;
    description: string;
    tip: string;
  }[];
}

function cleanJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

async function callAI(action: string, params: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-code-helper", {
    body: { action, ...params },
  });

  if (error) {
    throw new Error(error.message || "AI service error");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data?.text ?? "";
}

export async function fixCode(params: {
  inputCode: string;
  language: string;
  mode: "expert" | "eli5";
  stackContext: string[];
}): Promise<GeminiFixResult> {
  const rawText = await callAI("fix", params);
  const cleaned = cleanJson(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    return {
      root_cause: parsed.root_cause ?? "",
      explanation: parsed.explanation ?? "",
      fixed_code: parsed.fixed_code ?? "",
      summary: parsed.summary ?? "",
      related_risks: Array.isArray(parsed.related_risks) ? parsed.related_risks : [],
    };
  } catch {
    throw new Error("Failed to parse AI response as JSON: " + cleaned.slice(0, 200));
  }
}

export async function scanFile(params: {
  code: string;
  language: string;
  stackContext: string[];
}): Promise<GeminiScanResult> {
  const rawText = await callAI("scan", params);
  const cleaned = cleanJson(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    return { issues: Array.isArray(parsed.issues) ? parsed.issues : [] };
  } catch {
    throw new Error("Failed to parse scan response: " + cleaned.slice(0, 200));
  }
}

export async function generatePatterns(summaries: string[]): Promise<GeminiPatternResult> {
  const rawText = await callAI("patterns", { summaries });
  const cleaned = cleanJson(rawText);

  try {
    const parsed = JSON.parse(cleaned);
    return { patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [] };
  } catch {
    return { patterns: [] };
  }
}

export async function generateInsights(summaries: string[]): Promise<string> {
  return await callAI("insights", { summaries });
}
