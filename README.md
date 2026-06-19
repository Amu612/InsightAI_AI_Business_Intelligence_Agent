# 🚀 IntelliAgent: AI Business Intelligence Platform

IntelliAgent is a dynamic, multi-agent business intelligence platform powered by **Google Gemini 2.5 Flash**. It takes a company's name and autonomously researches, analyzes, and generates a comprehensive intelligence dashboard—including AI readiness, operational challenges, actionable AI opportunities, a strategic roadmap, and a CEO-ready pitch.

**Web App Link:** insight-ai-ai-business-intelligence.vercel.app

## ✨ Features

- **Multi-Agent Simulation:** Visual workflow simulating 6 specialized agents (Research, Business, Challenge, Opportunity, Roadmap, Pitch).
- **Dynamic AI Generation:** Zero hardcoded data. The Gemini LLM dynamically assesses the specific company and generates tailored, structured JSON insights.
- **Opportunity Matrix:** Automatically graphs identified AI opportunities on a 2x2 matrix (Impact vs. Effort).
- **Executive Pitch Deck:** Generates a concise, high-impact CEO pitch with specific recommendations and a clear call to action.
- **Modern UI:** Built with TailwindCSS, featuring a dark-mode glassmorphism aesthetic, responsive layouts, and fluid micro-animations.

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla JavaScript, TailwindCSS
- **Backend / API:** Node.js, Express.js (for local development), Serverless Functions (for Vercel deployment)
- **AI Model:** Google Gemini 2.5 Flash API

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/insight-ai.git
   cd insight-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the local development server:**
   ```bash
   npm start
   ```
   *Note: We use a custom local Express server (`local-server.js`) to seamlessly test the API endpoints and bypass Windows pathing issues with the Vercel CLI.*

5. **Open the app:**
   Visit `http://localhost:3000` in your browser.

## 🌐 Deployment (Vercel)

This project is fully optimized for zero-config deployment on Vercel.

1. Push your code to GitHub.
2. Import the repository into your Vercel dashboard.
3. In the **Environment Variables** section of Vercel, add your `GEMINI_API_KEY`.
4. Click **Deploy**. Vercel will automatically serve the static frontend and map `api/analyze.js` as a Serverless Function.

## 🧠 Approach & Architecture

The architecture relies heavily on **Prompt Engineering** and **JSON structured generation**. 
Instead of a standard conversational wrapper, the backend dispatches a highly specific prompt to Gemini containing an empty JSON template structure. The LLM acts as an enterprise architect, populating the JSON with custom analysis. This structured data is then securely returned to the frontend where it is normalized and rendered into interactive dashboard components.

## 🏆 Assessment & Challenges Solved

- **Preventing AI Hallucinations & Static Data:** Initially, the LLM relied on placeholder values from the JSON template (returning exactly "80" for AI Readiness every time). We resolved this by explicitly stripping the template of hardcoded values and introducing critical system directives that force completely unique, company-specific generation.
- **Vercel CLI Pathing Issues:** Encountered an issue where Vercel CLI crashed locally on Windows due to space characters in the path. Solved by writing a native Express backend (`local-server.js`) to handle local development smoothly.
- **Vercel Deployment Routing Conflicts:** When deployed to Vercel, having a `server.js` file in the root confused Vercel's zero-config builder into attempting to host a long-lived Express process, causing a `Cannot GET /` error instead of serving the static files. This was solved by renaming the file to `local-server.js` and updating `package.json`, allowing Vercel to cleanly serve the static frontend and the Serverless `api/analyze.js` function.
- **Robust JSON Parsing:** The Gemini API occasionally wraps responses in Markdown code blocks. We implemented a resilient backend parser that aggressively cleanses the text, removes wrappers, and repairs trailing commas to ensure the UI always receives valid JSON.

## 🤝 AI Tools Used
- **ChatGPT & Claude:** Initial brainstorming, framework modeling (2x2 matrices), and prompt structure requirements.
- **Cursor & Antigravity:** Rapid frontend styling, backend routing solutions, and autonomous debugging of local server environment issues.
- **Perplexity:** Fact-checking market data concepts to inform prompt instructions.
- **Gemini (Google):** The core intelligence engine powering the backend (Gemini 2.5 Flash).
