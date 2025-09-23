import React, { useState, useEffect } from "react";
import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5001";


function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [visualization, setVisualization] = useState(null);

  // SSE: optional for real-time updates
  useEffect(() => {
    const evtSource = new EventSource(`${BASE_URL}/api/stream`);
    evtSource.addEventListener("answer_created", (e) => {
      const data = JSON.parse(e.data);
      setChat((prev) => [...prev, { role: "ai", text: data.answer.text }]);
      setVisualization(data.answer.visualization);
    });
    return () => evtSource.close();
  }, []);

  const sendMessage = async () => {
    if (!message) return;

    setChat([...chat, { role: "user", text: message }]);
    const q = message;
    setMessage("");

    try {
      // send question to backend
      const res = await axios.post(`${BASE_URL}/api/questions`, {
        userId: "u1",
        question: q,
      });

      // get answer
      const ansRes = await axios.get(
        `${BASE_URL}/api/answers/${res.data.answerId}`
      );
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
      {/* Left: Visualization */}
      <div style={{ flex: 1, background: "#f0f0f0", padding: 20 }}>
        <h3>Visualization</h3>
        {visualization ? (
          <pre>{JSON.stringify(visualization, null, 2)}</pre>
        ) : (
          <p>No visualization yet</p>
        )}
      </div>

      {/* Right: Chat */}
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
