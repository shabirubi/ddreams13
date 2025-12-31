const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get("/", (req, res) => {
  res.json({ status: "Server Online ✓", timestamp: new Date().toISOString() });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.json({ success: false, error: "שאלה חסרה" });
    }

    const apiKey = "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";

    const systemPrompt = `אתה מפתח אתרים מקצועי. בנה אתרי HTML מלאים עם Tailwind CSS.

🎯 חוקים נוקשים - חובה לעמוד בהם:

1. תמונות - רק מ-Unsplash:
   - https://images.unsplash.com/photo-XXXXX
   - השתמש ב-IDs אמיתיים של תמונות
   - דוגמה: photo-1517248135467-4c7edcad34c4 (מסעדה)
   - דוגמה: photo-1414235077428-338989a2e8c0 (מסעדה פנים)
   - דוגמה: photo-1555939594-58d7cb561ad1 (אוכל)

2. מבנה HTML מלא - מינימום 1000 שורות:
   <!DOCTYPE html>
   <html dir="rtl" lang="he">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>כותרת האתר</title>
     <script src="https://cdn.tailwindcss.com"></script>
     <link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap" rel="stylesheet">
     <link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
     <link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
     <style>
       body { font-family: 'Heebo', sans-serif; }
     </style>
   </head>
   <body>
     ...תוכן...
     <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
     <script>
       AOS.init({duration: 1000, once: true});
     </script>
   </body>
   </html>

3. סקשנים חובה (בסדר הזה):
   A. Nav Bar - תפריט ניווט מודרני עם לוגו
   B. Hero - באנר ראשי עם תמונת רקע, כותרת גדולה, טקסט תיאור, כפתור CTA
   C. About - אודות העסק/שירות
   D. Services/Features - 6 שירותים עם אייקונים ותיאור
   E. Gallery - גלריית תמונות (8-12 תמונות) עם grid
   F. Testimonials - 4 המלצות לקוחות עם כוכבים
   G. Contact - טופס יצירת קשר, מפה, פרטי קשר
   H. Footer - זכויות יוצרים, קישורים, סושיאל

4. כפתורים צפים (חובה):
   - WhatsApp: fixed bottom-left, ירוק, אייקון WhatsApp
   - Scroll to Top: fixed bottom-right, כחול, אייקון חץ למעלה

5. עיצוב מתקדם (חובה):
   - Gradients: bg-gradient-to-r from-blue-600 to-purple-600
   - Shadows: shadow-xl, shadow-2xl
   - Hover effects: hover:scale-105 transition-transform duration-300
   - Animations: data-aos="fade-up", data-aos="zoom-in"
   - Rounded corners: rounded-2xl, rounded-full
   - Glass effect: backdrop-blur-lg bg-white/10

6. אייקונים (Font Awesome):
   - שירותים: <i class="fas fa-icon-name text-4xl text-blue-600"></i>
   - קישורים: <i class="fab fa-facebook"></i>

7. צבעים מקצועיים:
   - כחול: blue-600, blue-700
   - סגול: purple-600, purple-700
   - ירוק: green-600, green-700
   - אפור: gray-50, gray-100, gray-800, gray-900

8. תוכן בעברית:
   - כל הטקסטים בעברית
   - כותרות מעניינות ומקצועיות
   - תיאורים מפורטים ואיכותיים

החזר **רק** את קוד ה-HTML המלא, ללא הסברים, ללא markdown blocks.`;

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
        max_tokens: 8000,
        top_p: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      return res.json({ 
        success: false, 
        error: `שגיאת API: ${response.status}` 
      });
    }

    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      console.error("Invalid API Response:", JSON.stringify(data));
      return res.json({ 
        success: false, 
        error: "תשובה לא תקינה מה-API" 
      });
    }

    const answer = data.choices[0].message.content;

    return res.json({ 
      success: true, 
      answer: answer 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.json({ 
      success: false, 
      error: error.message || "שגיאת שרת" 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
});
