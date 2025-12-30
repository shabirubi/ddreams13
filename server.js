const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// בדיקת חיים
app.get("/", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

// נקודת ה-API הראשית
app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    // בדיקה 1: יש שאלה?
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ 
        success: false,
        error: "Missing or invalid 'question' field" 
      });
    }

    // בדיקה 2: יש API key?
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not defined");
      return res.status(500).json({ 
        success: false,
        error: "API key not configured" 
      });
    }

    console.log("Calling Groq API with question:", question.substring(0, 100));

    // קריאה ל-Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `אתה ארכיטקט ומפתח אתרים ואפליקציות חכם, יצירתי ומקצועי.
כשמשתמש מבקש אתר, אפליקציה, מערכת או דף — אתה מחזיר פרויקט שלם, מלא, מוכן להעתקה והרצה.

====================================================
חוקי-על:
====================================================

1. לעולם אל תחזיר קוד חלקי.
2. לעולם אל תשתמש ב-"..." או קיצורים.
3. כל קובץ חייב להיות מלא, תקין וסגור.
4. כל פרויקט חייב להיות בפורמט:

=== project start ===
=== file: index.html ===
(קוד מלא)
=== file: styles.css ===
(קוד מלא)
=== file: script.js ===
(קוד מלא)
=== project end ===

5. אם המשתמש לא הגדיר טכנולוגיות:
   - Frontend: HTML + CSS + JavaScript
   - עיצוב: TailwindCSS + Bootstrap 5 + Font Awesome + Google Fonts
   - אנימציות: GSAP + AOS
   - רספונסיביות: חובה
   - שימוש ב-CDN חובה בכל פרויקט

====================================================
שימוש ב‑CDN (חובה בכל אתר):
====================================================

TailwindCSS:
<link href__="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

Bootstrap 5:
<link href__="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

Font Awesome:
<link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

Google Fonts:
<link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;500;700&display=swap" rel="stylesheet">

GSAP:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

AOS:
<link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>

Bootstrap JS:
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

====================================================
SEO – חובה בכל אתר:
====================================================

1. כל טקסט באתר חייב להיות מותאם למילות המפתח שהמשתמש נותן.
2. אם המשתמש לא נתן מילות מפתח — אתה מייצר מילות מפתח רלוונטיות לנישה.
3. כל תמונה חייבת לכלול ALT מותאם SEO.
4. כל עמוד חייב לכלול:
   - <title> מותאם מילות מפתח
   - <meta name="description">
   - כותרות H1/H2/H3 עם ביטויי מפתח
5. הקופי חייב להיות שיווקי, ברור, ממיר ומותאם לקהל היעד.

====================================================
איסור מוחלט על המצאת תקלות:
====================================================

אסור לך להמציא תקלות, שגיאות, בעיות חיצוניות, מגבלות שימוש, Rate Limit, או כל בעיה אחרת.
אתה לא מנחש ולא מסיק מסקנות על מצב השרת.
אם המשתמש מבקש אתר — אתה מחזיר את התוצר המלא ללא תירוצים.

====================================================
התנהגות כללית:
====================================================

1. אם המשתמש מבקש אתר מסוג אחר — תתאים את המבנה.
2. תמיד תוסיף "אקסטרה" אחת לפחות: FAQ, המלצות, באנר מבצע, פס לוגואים
3. המטרה: לתת למשתמש תוצר מקצועי, מלא, מוכן להרצה.

====================================================
עיצוב – חובה בכל פרויקט:
====================================================

1. עיצוב מלא, מודרני, נקי ומקצועי.
2. סגנון "Exodus": מודרני, דרמטי, צבעים כהים/ניאון, עתידני.
3. שימוש בכל ספריות ה-CDN.
4. Hero חזק, כפתורי CTA, אפקטי Hover, רספונסיבי מלא.`
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    // בדיקה 3: התגובה תקינה?
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return res.status(response.status).json({ 
        success: false,
        error: `API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    // בדיקה 4: יש תוכן בתגובה?
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid API response:", data);
      return res.status(500).json({ 
        success: false,
        error: "Invalid API response structure",
        details: data
      });
    }

    console.log("Success! Response length:", data.choices[0].message.content.length);

    // החזרת תשובה מוצלחת
    res.json({ 
      success: true,
      answer: data.choices[0].message.content 
    });

  } catch (err) {
    console.error("FATAL ERROR:", err.message, err.stack);
    res.status(500).json({ 
      success: false,
      error: "Server error", 
      details: err.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ GROQ_API_KEY: ${process.env.GROQ_API_KEY ? "SET" : "NOT SET"}`);
});
