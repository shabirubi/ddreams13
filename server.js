const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/', (req, res) => {
  res.json({ status: 'Server Online' });
});

// Chat Endpoint
app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'שאלה חסרה' });
    }

    const apiKey = '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';

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'אתה מפתח אתרים. החזר HTML מלא בעברית עם Tailwind CSS.' },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'שגיאת API' });
    }

    const data = await response.json();
    const html = data.choices[0]?.message?.content;

    res.json({ success: true, html });

  } catch (error) {
    console.error('שגיאה:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
