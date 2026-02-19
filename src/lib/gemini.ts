const GEMINI_API_KEY = "AIzaSyDuwMPkdCL2ppGD7WU3hZFbVmanXv5JeOE";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiFixResult {
  explanation: string;
  fixed_code: string;
  summary: string;
}

export async function fixCode(params: {
  inputCode: string;
  language: string;
  mode: "expert" | "eli5";
  stackContext: string[];
}): Promise<GeminiFixResult> {
  const { inputCode, language, mode, stackContext } = params;

  const stackStr = stackContext.length > 0 ? stackContext.join(", ") : "General";

  const systemInstruction = `You are a senior software engineer. The user's tech stack is: ${stackStr}. Respond ONLY with a valid JSON object, no markdown, no backticks, no extra text. The JSON must have exactly these fields: explanation (string), fixed_code (string), summary (string). In ${mode} mode: if mode is eli5, use simple friendly language and analogies in the explanation. If mode is expert, use concise technical language.`;

  const userPrompt = `Language: ${language}. Here is the broken code or error: ${inputCode}. Fix it and explain what was wrong.`;

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

  // Strip markdown code fences if present
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      explanation: parsed.explanation ?? "",
      fixed_code: parsed.fixed_code ?? "",
      summary: parsed.summary ?? "",
    };
  } catch {
    throw new Error("Failed to parse Gemini response as JSON: " + cleaned.slice(0, 200));
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
