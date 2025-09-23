// llm.js
// A small LLM service abstraction.
// - If OPENAI_API_KEY is set, it will call OpenAI (completion/chat).
// - Otherwise it uses a deterministic demo generator for 3 topics.

const axios = require('axios');

const DEMO_GENERATORS = {
  "newton's first law": (question) => ({
    text:
      "Newton’s First Law (in simple terms): an object at rest stays at rest and an object in motion stays in motion at constant speed and straight line, unless a net external force acts on it.",
    visualization: {
      id: "vis_newton_1",
      duration: 4000,
      fps: 60,
      layers: [
        {
          id: "ball_rest",
          type: "circle",
          props: { x: 120, y: 200, r: 20, fill: "#3498db" },
          animations: []
        },
        {
          id: "ball_push",
          type: "circle",
          props: { x: 100, y: 320, r: 20, fill: "#2ecc71" },
          animations: [
            { property: "x", from: 100, to: 520, start: 400, end: 3000 }
          ]
        },
        {
          id: "arrow_force",
          type: "arrow",
          props: { x: 80, y: 320, dx: 30, dy: 0, color: "#e74c3c" },
          animations: []
        }
      ]
    }
  }),
  "solar system": (question) => ({
    text:
      "The Solar System has the Sun at the center; planets orbit due to gravity. Orbits are roughly elliptical; smaller planets orbit faster closer in.",
    visualization: {
      id: "vis_solar_1",
      duration: 6000,
      fps: 60,
      layers: [
        { id: "sun", type: "circle", props: { x: 300, y: 260, r: 36, fill: "#f39c12" }, animations: [] },
        {
          id: "mercury", type: "circle",
          props: { x: 300, y: 180, r: 6, fill: "#95a5a6" },
          animations: [{ property: "orbit", centerX: 300, centerY: 260, radius: 80, duration: 2000 }]
        },
        {
          id: "earth", type: "circle",
          props: { x: 300, y: 120, r: 10, fill: "#3498db" },
          animations: [{ property: "orbit", centerX: 300, centerY: 260, radius: 140, duration: 6000 }]
        }
      ]
    }
  }),
  "photosynthesis": (question) => ({
    text:
      "Photosynthesis: plants use sunlight, CO₂ and water to produce glucose and oxygen. Chlorophyll captures light energy to drive this conversion.",
    visualization: {
      id: "vis_photo_1",
      duration: 5000,
      fps: 60,
      layers: [
        {
          id: "sunray", type: "line",
          props: { x1: 50, y1: 50, x2: 200, y2: 180, strokeWidth: 3 },
          animations: [{ property: "opacity", from: 0, to: 1, start: 0, end: 600 }]
        },
        {
          id: "leaf", type: "rect",
          props: { x: 220, y: 160, w: 160, h: 80, rx: 20, fill: "#2ecc71" },
          animations: [{ property: "scale", from: 0.9, to: 1.05, start: 0, end: 2500 }]
        },
        {
          id: "o2", type: "text",
          props: { x: 420, y: 120, text: "O₂", fontSize: 20 },
          animations: [{ property: "y", from: 140, to: 60, start: 1200, end: 3500 }]
        }
      ]
    }
  })
};

async function callOpenAI(question, openaiKey) {
  // A simple Chat completion call using "gpt-4o-mini" or "gpt-4o" template.
  // This function will attempt to parse JSON from the model's output.
  // You can adjust model and prompt for better results.

  const prompt = `
You are an assistant that must produce JSON ONLY with two fields: "text" (a short clear explanation for a general audience)
and "visualization" (a JSON spec describing shapes and animations). The visualization schema should include id, duration (ms), fps,
and layers array. Each layer must have id, type (circle, rect, line, arrow, text), props (shape properties) and animations (array).
Return valid JSON only.

Question: ${question}
`;

  try {
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        }
      }
    );
    const content = resp.data.choices[0].message.content;
    // Try to parse JSON from content
    const jsonStart = content.indexOf('{');
    const jsonText = jsonStart >= 0 ? content.slice(jsonStart) : content;
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (err) {
    console.error("OpenAI error:", err?.response?.data || err.message);
    throw new Error("OpenAI call failed");
  }
}

async function generate(question, options = {}) {
  const qLower = (question || "").toLowerCase().trim();

  if (options.openaiKey) {
    // try openai
    return await callOpenAI(question, options.openaiKey);
  }

  // fallback to demo generator picks
  for (const key of Object.keys(DEMO_GENERATORS)) {
    if (qLower.includes(key)) {
      return DEMO_GENERATORS[key](question);
    }
  }

  // generic fallback explanation + simple visual
  return {
    text: `Short explanation for: ${question}`,
    visualization: {
      id: "vis_generic",
      duration: 4000,
      fps: 60,
      layers: [
        {
          id: "dot",
          type: "circle",
          props: { x: 120, y: 150, r: 18, fill: "#8e44ad" },
          animations: [{ property: "x", from: 120, to: 420, start: 200, end: 3200 }]
        }
      ]
    }
  };
}

module.exports = { generate };
