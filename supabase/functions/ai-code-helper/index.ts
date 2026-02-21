import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { action, inputCode, language, mode, stackContext, code, summaries } = await req.json();

    let systemPrompt = "";
    let userPrompt = "";
    const stackStr = stackContext?.length > 0 ? stackContext.join(", ") : "General";

    if (action === "fix") {
      systemPrompt = `You are a senior software engineer and debugging expert. The user's tech stack is: ${stackStr}. Respond ONLY with valid JSON, no markdown, no backticks. Return an object with these exact fields: root_cause (string, one sentence identifying the exact root cause), explanation (string, full explanation tailored to ${mode} mode — eli5 uses analogies and simple language, expert uses precise technical language), fixed_code (string, the complete corrected code), summary (string, one line of what changed), related_risks (array of strings, up to 3 other things in the code that could cause similar issues).`;
      userPrompt = `Language: ${language}. Mode: ${mode}. Broken code or error: ${inputCode}. Fix it completely.`;
    } else if (action === "scan") {
      systemPrompt = `You are a senior code reviewer. The user's stack is: ${stackStr}. Respond ONLY with valid JSON, no markdown, no backticks. Return an object with a field called 'issues' which is an array. Each issue has: line_hint (string, e.g. 'Around line 12'), severity (critical / warning / suggestion), title (short title), explanation (what is wrong and why), fix (the corrected code snippet for just that section).`;
      userPrompt = `Scan this entire ${language} file and identify every bug, anti-pattern, performance issue, and potential crash. Be thorough: ${code}`;
    } else if (action === "patterns") {
      systemPrompt = `You are a developer coach. Respond ONLY with valid JSON, no markdown. Return an object with a field called 'patterns' which is an array of up to 4 objects. Each has: title (name of the mistake pattern), frequency (how often it appears as a percentage string e.g. '4 out of 7 sessions'), description (one sentence explanation), tip (one actionable sentence to never make this mistake again).`;
      userPrompt = `Here are the summaries of this developer's past debugging sessions: ${summaries?.join("; ")}. Identify their most recurring mistake patterns.`;
    } else if (action === "insights") {
      systemPrompt = "You are a senior software engineer reviewing a developer's recent debugging sessions.";
      userPrompt = `Here are the last ${summaries?.length} error summaries from a developer:\n\n${summaries?.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n\nAnalyze these and identify 2-3 recurring mistake patterns this developer tends to make. Be specific, actionable, and friendly. Format your response as a single string with each insight on a new line starting with a dash (-). Keep it under 150 words total.`;
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ text: rawText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-code-helper error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
