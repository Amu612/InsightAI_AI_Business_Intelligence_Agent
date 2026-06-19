export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { companyName } = req.body || {};

    if (
      !companyName ||
      typeof companyName !== "string" ||
      !companyName.trim()
    ) {
      return res.status(400).json({
        error: "Company name is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY missing from server variables"
      });
    }

    const company = companyName.trim();
    const prompt = buildPrompt(company);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const geminiData = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error Response:", geminiData);
      return res.status(response.status).json({
        error: geminiData?.error?.message || "Gemini request failed"
      });
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return res.status(500).json({
        error: "Gemini returned empty response text"
      });
    }

    const report = parseGeminiJSON(rawText);

    return res.status(200).json(report);

  } catch (error) {
    console.error("Internal Server Exception:", error);
    return res.status(500).json({
      error: error.message || "Internal Server Error"
    });
  }
}

function buildPrompt(company) {
  const safeCompany = company.replace(/"/g, '\\"');
  return `You are an elite management consultant,
AI strategist,
business analyst,
enterprise architect,
digital transformation consultant,
and market intelligence expert.

Analyze:
"${safeCompany}"

Return ONLY valid JSON.

{
"companyName": "${safeCompany}",

"overview": {
"aiReadiness": 0,
"roiPotential": "",
"summary": "",
"recommendations": []
},

"businessInformation": {
"profile": {
"Industry": "",
"Founded": "",
"Headquarters": "",
"Employees": "",
"Revenue": "",
"Business Model": ""
},

"market": {
  "Market Position": "",
  "Revenue Growth": "",
  "Geographic Reach": "",
  "Key Competitors": [],
  "Market Cap": "",
  "Listed": ""
},

"description": ""

},

"challenges": [
{
"id": "CH-1",
"title": "",
"challenge": "",
"impact": "",
"reasoning": "",
"evidence": "",
"confidenceScore": 0,
"effortToAddress": "",
"x": 0,
"y": 0
}
],

"aiOpportunities": [
{
"id": "OP-1",
"title": "",
"problem": "",
"solution": "",
"roi": "",
"difficulty": "",
"timeline": "",
"priority": "",
"effortScore": 0,
"impactScore": 0,
"confidenceScore": 0
}
],

"roadmap": [
{
"phase": "Phase 1",
"title": "",
"duration": "",
"items": [],
"expectedOutcome": "",
"estimatedRoi": ""
}
],

"ceoPitch": {
"headline": "",
"sections": [
  {
    "title": "",
    "content": ""
  }
],
"callToAction": ""
},

"agentTrace": [
{
  "agent": "",
  "status": "completed",
  "icon": "",
  "log": ""
}
]
}

Requirements:
1. Generate exactly 6 challenges.
2. Generate exactly 8 AI opportunities.
3. Generate exactly 4 roadmap phases.
4. Challenges must include: challenge, impact, reasoning, evidence, confidenceScore, effortToAddress, x, and y.
5. Opportunities must include: problem, solution, roi, difficulty, timeline, priority, effortScore, impactScore, confidenceScore.
6. Opportunities must map to resolving the challenges.
7. Use confidence scores between 60 and 95.
8. Use effortScore and impactScore from 0-100.
9. Use x and y values from 0-100.
10. Generate exactly 6 agent traces for agentTrace, each with agent, status, icon, and log specific to the company.
11. CRITICAL: The data generated for overview, businessInformation, challenges, aiOpportunities, roadmap, ceoPitch, and agentTrace must be COMPLETELY UNIQUE and HIGHLY SPECIFIC to the requested company. Do NOT copy any placeholder values from the prompt.
12. CRITICAL: roiPotential MUST be a short, concise string under 15 characters (e.g., "$1M - $5M" or "20% ROI"). Do not write sentences.
13. Do not wrap in markdown or code blocks. Output JSON only.`;
}

function parseGeminiJSON(rawText) {
  let cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Gemini response does not contain valid JSON");
  }

  cleaned = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const repaired = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    return JSON.parse(repaired);
  }
}
