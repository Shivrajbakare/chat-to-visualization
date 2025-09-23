// components/Chat.js
import { useState } from "react";
import axios from "axios";
import Visualization from "./Visualization";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5001/api/answers", {
        question: input,
      });

      const aiMessage = {
        role: "ai",
        text: res.data.text,
        visualization: res.data.visualization,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error fetching answer" },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={msg.role === "user" ? "message user" : "message ai"}
          >
            {msg.text}
            {msg.visualization && <Visualization layers={msg.visualization.layers} />}
          </div>
        ))}
        {loading && <div className="message ai">AI is typing...</div>}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
