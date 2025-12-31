const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get("/", (req, res) => {
  res.json({ status: "🚀 Server Online" });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.json({ success: false, error: "חסרה שאלה" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.json({ success: false, error: "API key לא מוגדר" });
    }

    const systemPrompt = `אתה מפתח אתרים מקצועי ברמה עולמית. תפקידך לבנות אתרי HTML מלאים ומושקעים.

⚠️ חוקים קריטיים - חובה לעמוד בהם:

1. **תמונות חובה:**
   - כל תמונה חייבת להיות מ-https://images.unsplash.com/
   - דוגמאות תקינות:
     * https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800
     * https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200
     * https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600
   - השתמש במילות חיפוש מדויקות ב-URL
   - לפחות 10 תמונות באתר

2. **קוד מינימלי:**
   - מינימום 1500 שורות HTML מלא
   - כלול את כל הספריות הנדרשות
   - HTML מושלם עם סגירת תגיות

3. **עיצוב מושקע:**
   - Tailwind CSS מתקדם
   - Gradients: bg-gradient-to-r from-blue-600 to-indigo-700
   - Shadows: shadow-2xl, shadow-lg
   - Hover effects על כל אלמנט
   - אנימציות: data-aos="fade-up"

4. **מבנה חובה:**
   - <nav> sticky עם לוגו ותפריט
   - <section id="hero"> בגובה מלא עם תמונת רקע
   - <section id="about"> עם תמונות וטקסט
   - <section id="services"> עם 6+ כרטיסים
   - <section id="gallery"> עם 8+ תמונות
   - <section id="testimonials"> עם 3+ המלצות
   - <section id="contact"> עם טופס מלא
   - <footer> עשיר עם קישורים
   - כפתורי WhatsApp וגלילה למעלה

5. **ספריות חובה בראש:**
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>אתר מקצועי</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
  <style>
    * { font-family: 'Heebo', sans-serif; }
  </style>
</head>

6. **JavaScript חובה לפני סגירת body:**
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
<script>
  AOS.init({ duration: 1000, once: true });
</script>

7. **תוכן עברי איכותי:**
   - כתוב תוכן מקצועי בעברית
   - לא "לורם איפסום"
   - תוכן רלוונטי לנושא

8. **אלמנטים צפים:**
   - WhatsApp: <a href__="https://wa.me/972501234567" class="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl z-50 transition"><i class="fab fa-whatsapp text-2xl"></i></a>
   - גלילה למעלה: <button onclick="window.scrollTo({top:0,behavior:'smooth'})" class="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-2xl z-50 transition"><i class="fas fa-arrow-up"></i></button>

⛔ אסור:
- להחזיר קוד חלקי
- להשתמש בתמונות placeholder
- לכתוב markdown
- לתת הסברים
- לדלג על ספריות

✅ החזר רק:
<!DOCTYPE html>
<html dir="rtl" lang="he">
...1500+ שורות קוד מלא...
</html>`;

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
        error: `שגיאת API: ${response.status}` 
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.json({ 
        success: false, 
        error: "אין תשובה מה-AI" 
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
  console.log(`🚀 Server running on port ${PORT}`);
});
