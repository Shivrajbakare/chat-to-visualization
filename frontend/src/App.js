import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [visualization, setVisualization] = useState(null);

  const sendMessage = async () => {
    if (!message) return;

    setChat([...chat, { role: "user", text: message }]);
    const q = message;
    setMessage("");

    try {
      // 1️⃣ POST question
      const res = await axios.post(`${BASE_URL}/api/questions`, {
        userId: "u1",
        question: q,
      });

      const answerId = res.data.answerId;

      // 2️⃣ GET answer
      const ansRes = await axios.get(`${BASE_URL}/api/answers/${answerId}`);
      setChat((prev) => [
        ...prev,
        { role: "ai", text: ansRes.data.text },
      ]);
      setVisualization(ansRes.data.visualization);
    } catch (err) {
      console.error(err);
      setChat((prev) => [...prev, { role: "ai", text: "Error fetching answer" }]);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, background: "#f0f0f0", padding: 20 }}>
        <h3>Visualization</h3>
        {visualization ? (
          <pre>{JSON.stringify(visualization, null, 2)}</pre>
        ) : (
          <p>No visualization yet</p>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>
        <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
          {chat.map((c, i) => (
            <p key={i}>
              <b>{c.role}:</b> {c.text}
            </p>
          ))}
        </div>

        <div style={{ display: "flex" }}>
          <input
            style={{ flex: 1, padding: 10 }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your question..."
          />
          <button onClick={sendMessage} style={{ padding: 10 }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
