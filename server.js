import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

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
        model: "mixtral-8x7b-32768",
        messages: [
          { role: "user", content: question }
        ]
      })
    });

    const data = await response.json();
    res.json({ answer: data.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
