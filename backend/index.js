// index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { generate } = require('./llm');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// in-memory storage
const QUESTIONS = []; // { id, userId, question, answerId }
const ANSWERS = {};   // answerId -> { id, text, visualization, questionId, createdAt }

// SSE clients
const SSE_CLIENTS = new Set();

function broadcastEvent(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of SSE_CLIENTS) {
    try {
      res.write(payload);
    } catch (err) {
      // ignore
    }
  }
}

app.get('/api/stream', (req, res) => {
  // Standard SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  res.write('retry: 3000\n\n');

  SSE_CLIENTS.add(res);

  req.on('close', () => {
    SSE_CLIENTS.delete(res);
  });
});

// POST /api/questions
app.post('/api/questions', async (req, res) => {
  try {
    const { userId, question } = req.body;
    if (!userId || !question) {
      return res.status(400).json({ error: 'userId and question required' });
    }

    const qId = `q_${uuidv4()}`;
    const aId = `a_${uuidv4()}`;
    const createdAt = new Date().toISOString();

    // Save question
    const qObj = { id: qId, userId, question, answerId: aId, createdAt };
    QUESTIONS.unshift(qObj);

    // broadcast question_created
    broadcastEvent('question_created', { question: qObj });

    // generate with llm
    let llmResult;
    try {
      llmResult = await generate(question, { openaiKey: process.env.OPENAI_API_KEY });
    } catch (err) {
      console.error("LLM generation failed:", err);
      llmResult = {
        text: "Sorry, I couldn't generate an explanation at the moment.",
        visualization: { id: 'vis_err', duration: 1000, fps: 30, layers: [] }
      };
    }

    const answer = {
      id: aId,
      text: llmResult.text,
      visualization: llmResult.visualization || { id: 'empty', duration: 1000, fps: 30, layers: [] },
      questionId: qId,
      createdAt: new Date().toISOString()
    };

    ANSWERS[aId] = answer;

    // broadcast answer_created
    broadcastEvent('answer_created', { answer });

    // respond
    return res.json({ questionId: qId, answerId: aId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server error' });
  }
});

// GET /api/questions
app.get('/api/questions', (req, res) => {
  return res.json(QUESTIONS);
});

// GET /api/answers/:id
app.get('/api/answers/:id', (req, res) => {
  const id = req.params.id;
  const ans = ANSWERS[id];
  if (!ans) return res.status(404).json({ error: 'not found' });
  return res.json(ans);
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
  console.log(`SSE: GET http://localhost:${PORT}/api/stream`);
});
