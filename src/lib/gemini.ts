const GEMINI_API_KEY = "AIzaSyDuwMPkdCL2ppGD7WU3hZFbVmanXv5JeOE";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

export async function fixCode(params: {
  inputCode: string;
  language: string;
  mode: "expert" | "eli5";
  stackContext: string[];
}): Promise<GeminiFixResult> {
  const { inputCode, language, mode, stackContext } = params;

  const stackStr = stackContext.length > 0 ? stackContext.join(", ") : "General";

  const systemInstruction = `You are a senior software engineer and debugging expert. The user's tech stack is: ${stackStr}. Respond ONLY with valid JSON, no markdown, no backticks. Return an object with these exact fields: root_cause (string, one sentence identifying the exact root cause), explanation (string, full explanation tailored to ${mode} mode — eli5 uses analogies and simple language, expert uses precise technical language), fixed_code (string, the complete corrected code), summary (string, one line of what changed), related_risks (array of strings, up to 3 other things in the code that could cause similar issues).`;

  const userPrompt = `Language: ${language}. Mode: ${mode}. Broken code or error: ${inputCode}. Fix it completely.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

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
    throw new Error("Failed to parse Gemini response as JSON: " + cleaned.slice(0, 200));
  }
}

export async function scanFile(params: {
  code: string;
  language: string;
  stackContext: string[];
}): Promise<GeminiScanResult> {
  const { code, language, stackContext } = params;
  const stackStr = stackContext.length > 0 ? stackContext.join(", ") : "General";

  const systemInstruction = `You are a senior code reviewer. The user's stack is: ${stackStr}. Respond ONLY with valid JSON, no markdown, no backticks. Return an object with a field called 'issues' which is an array. Each issue has: line_hint (string, e.g. 'Around line 12'), severity (critical / warning / suggestion), title (short title), explanation (what is wrong and why), fix (the corrected code snippet for just that section).`;

  const userPrompt = `Scan this entire ${language} file and identify every bug, anti-pattern, performance issue, and potential crash. Be thorough: ${code}`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { issues: Array.isArray(parsed.issues) ? parsed.issues : [] };
  } catch {
    throw new Error("Failed to parse scan response: " + cleaned.slice(0, 200));
  }
}

export async function generatePatterns(summaries: string[]): Promise<GeminiPatternResult> {
  const prompt = `Here are the summaries of this developer's past debugging sessions: ${summaries.join("; ")}. Identify their most recurring mistake patterns.`;

  const systemInstruction = `You are a developer coach. Respond ONLY with valid JSON, no markdown. Return an object with a field called 'patterns' which is an array of up to 4 objects. Each has: title (name of the mistake pattern), frequency (how often it appears as a percentage string e.g. '4 out of 7 sessions'), description (one sentence explanation), tip (one actionable sentence to never make this mistake again).`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });

  if (!response.ok) throw new Error("Failed to generate patterns");

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return { patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [] };
  } catch {
    return { patterns: [] };
  }
}

export async function generateInsights(summaries: string[]): Promise<string> {
  const prompt = `You are a senior software engineer reviewing a developer's recent debugging sessions. Here are the last ${summaries.length} error summaries from a developer:\n\n${summaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nAnalyze these and identify 2-3 recurring mistake patterns this developer tends to make. Be specific, actionable, and friendly. Format your response as a single string with each insight on a new line starting with a dash (-). Keep it under 150 words total.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
    }),
  });

  if (!response.ok) throw new Error("Failed to generate insights");

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}
