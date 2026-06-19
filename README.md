# AI Business Intelligence Agent - IntelliAgent

## 1. Approach

The objective of this project is to build an intelligent, multi-agent AI system capable of generating dynamic, comprehensive business intelligence reports for any company using just its name. The approach focuses on leveraging state-of-the-art Large Language Models (LLMs) to dynamically extract, analyze, and structure real-world company data. Instead of relying on static datasets, we used the Gemini 2.5 Flash model with heavily structured prompt engineering to dynamically generate an overview, challenges, AI opportunities, a strategic roadmap, and a CEO pitch.

## 2. Architecture

The architecture is divided into two primary layers:

- **Frontend Layer:** A modern, responsive UI built with Vanilla HTML, CSS, and JavaScript. It uses TailwindCSS for rapid, utility-first styling. The UI simulates a complex multi-agent execution flow using a smooth polling/animation mechanism before rendering the final intelligence dashboard.
- **Backend / API Layer:** A lightweight Express.js Node server (acting as a local proxy for Serverless functionality) that handles secure API communications. The `/api/analyze` endpoint intercepts frontend requests, secures the `GEMINI_API_KEY`, and dispatches a heavily structured, system-instructed prompt to the Google Gemini API. It handles JSON parsing, error resilience, and returns a robust, 100% dynamic JSON payload back to the client.

## 3. AI Tools Used

- **ChatGPT & Claude:** Used for initial brainstorming, prompt engineering techniques, and structuring the business intelligence output requirements.
- **Cursor:** Leveraged as the primary AI-powered code editor to accelerate frontend development and component styling.
- **Gemini (Google):** The core intelligence engine powering the backend. Used specifically (Gemini 2.5 Flash) to generate the dynamic business reports via API.
- **Antigravity:** Used for autonomous debugging, fixing environment-specific server issues, rewriting server code, and refining prompt structures dynamically.
- **Perplexity:** Utilized for rapid research and fact-checking market data concepts to inform the prompt design.

## 4. Challenges Faced

- **Path and Environment Issues:** Encountered issues with the Vercel CLI development server crashing due to space characters in the Windows directory path (`Cannot find module...`), resulting in environment variables failing to load.
- **Static/Mocked Data Generation:** Initially, the LLM prompt's JSON template contained hardcoded values (e.g., `aiReadiness: 80`, `impact: High`). The model ended up copying these placeholder values instead of generating dynamic, company-specific intelligence, leading to identical numbers for every company. Furthermore, the `agentTrace` logs were originally hardcoded on the backend.
- **JSON Formatting Instability:** The Gemini API would sometimes wrap responses in markdown blocks or return slightly malformed JSON, breaking the frontend rendering.

## 5. How Challenges Were Solved

- **Server Rewrite:** Bypassed the Vercel CLI space bug by creating a native `server.js` Express backend that manually loads `.env` variables using `dotenv` and handles the API requests smoothly on local environments without crashing.
- **Dynamic Prompt Engineering:** Re-engineered the prompt in `api/analyze.js` by removing all hardcoded numbers and strings from the JSON template (replacing them with `0` or `""`). Added a critical system directive forcing the model to generate completely unique, highly specific data for all fields, including the `agentTrace` logs.
- **Robust JSON Parsing:** Implemented a `parseGeminiJSON` utility in the backend that aggressively strips out markdown wrappers (e.g., ```json) and applies regex-based repairs to trailing commas, ensuring the frontend always receives clean, valid JSON.
