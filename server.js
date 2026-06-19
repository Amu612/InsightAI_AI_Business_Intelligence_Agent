import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import analyzeHandler from './api/analyze.js';

dotenv.config(); // Reads from .env
dotenv.config({ path: '.env.local' }); // Fallback to .env.local if it exists

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Map the Vercel API endpoint handler to Express
app.post('/api/analyze', async (req, res) => {
  // Mocking Vercel's req/res for our local express server if needed
  // Express req/res are usually close enough to Vercel's for basic usage
  try {
    await analyzeHandler(req, res);
  } catch (error) {
    console.error('Error in analyzeHandler:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

const server = app.listen(PORT, () => {
  console.log(`Ready! Available at http://localhost:${PORT}`);
});

function gracefulShutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
