// server.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // load .env

const OpenAI = require("openai");

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage
let questions = [];
let answers = [];
let clients = [];

// SSE stream
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
  });
});

// Helper: broadcast to SSE clients
function broadcast(event, data) {
  clients.forEach((client) =>
    client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  );
}

// Initialize OpenAI client (new SDK)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

// Generate real explanation + visualization
async function generateLLMAnswer(question) {
  const prompt = `
Explain the following concept in simple terms. Also generate a JSON visualization spec for a canvas animation.
Return the output as valid JSON in this format:

{
  "text": "<your explanation>",
  "visualization": {
    "id": "<unique_id>",
    "duration": 4000,
    "fps": 30,
    "layers": [
      {
        "id": "layer1",
        "type": "circle",
        "props": { "x": 100, "y": 200, "r": 20, "fill": "#3498db" },
        "animations": [
          { "property": "x", "from": 100, "to": 400, "start": 0, "end": 3000 }
        ]
      }
    ]
  }
}

Question: ${question}
`;

  const response = await openai.chat.completions.create({
    model: "llama-3.3-70b-versatile", // faster & cheaper than gpt-4
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const text = response.choices[0].message.content;

  // Try parsing GPT response as JSON
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    console.error("⚠️ GPT did not return valid JSON, using fallback.", err);
    json = {
      text: text,
      visualization: {
        id: "vis_" + Date.now(),
        duration: 3000,
        fps: 30,
        layers: [],
      },
    };
  }

  return {
    id: "a_" + Date.now(),
    text: json.text,
    visualization: json.visualization,
  };
}

// POST /api/questions
app.post("/api/questions", async (req, res) => {
  try {
    const { userId, question } = req.body;
    const questionId = "q_" + Date.now();

    const q = { id: questionId, userId, question };
    questions.push(q);

    // Call OpenAI LLM
    const a = await generateLLMAnswer(question);
    a.questionId = questionId;
    answers.push(a);

    broadcast("question_created", { question: q });
    broadcast("answer_created", { answer: a });

    res.json({ questionId, answerId: a.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/questions
app.get("/api/questions", (req, res) => {
  res.json(questions);
});

// GET /api/answers/:id
app.get("/api/answers/:id", (req, res) => {
  const answer = answers.find((a) => a.id === req.params.id);
  if (!answer) return res.status(404).json({ error: "Not found" });
  res.json(answer);
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
