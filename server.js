import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// נתיב בדיקה ל‑Render
app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();

    // אם Groq מחזיר שגיאה — נציג אותה
    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({
        error: "Groq API error",
        details: data
      });
    }

    res.json({ answer: data.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));


