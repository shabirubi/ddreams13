const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get("/", (req, res) => {
  res.json({ status: "Server Online" });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.json({ success: false, error: "No question" });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OLLAMA_API_KEY;
    if (!apiKey) {
      return res.json({ success: false, error: "API key missing" });
    }

    const systemPrompt = `You are a professional web developer. Build complete HTML websites with Tailwind CSS.

RULES:
1. Images: Only from https://images.unsplash.com/ (real photo IDs)
2. Minimum 1000 lines of HTML
3. Include in <head>:
   - <script src="https://cdn.tailwindcss.com"></script>
   - <link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap" rel="stylesheet">
   - <link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
   - <link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
4. Before </body>:
   - <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
   - <script>AOS.init({duration:1000,once:true});</script>
5. Structure: nav, hero, about, services, gallery, testimonials, contact, footer
6. Hebrew RTL content (dir="rtl" lang="he")
7. Floating WhatsApp and scroll-to-top buttons
8. Advanced Tailwind: gradients, shadows, hover effects, animations

Return ONLY complete HTML from <!DOCTYPE html> to </html>. No markdown, no explanations.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      return res.json({ 
        success: false, 
        error: `API Error: ${response.status}` 
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.json({ 
        success: false, 
        error: "No response from AI" 
      });
    }

    return res.json({ 
      success: true, 
      answer: answer 
    });

  } catch (error) {
    return res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
