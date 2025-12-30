const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

app.use("/ask", limiter);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({ 
    status: "running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    groqApiConfigured: !!process.env.GROQ_API_KEY
  });
});

// Main API endpoint
app.post("/ask", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { question } = req.body;

    // Validation
    if (!question) {
      return res.status(400).json({ 
        success: false,
        error: "Missing 'question' field" 
      });
    }

    if (typeof question !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: "'question' must be a string" 
      });
    }

    if (question.length > 50000) {
      return res.status(400).json({ 
        success: false,
        error: "Question is too long (max 50000 characters)" 
      });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set");
      return res.status(500).json({ 
        success: false,
        error: "Server configuration error" 
      });
    }

    console.log(`Processing question (${question.length} chars)...`);

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
אתה ארכיטקט ומפתח אתרים ואפליקציות חכם, יצירתי ומקצועי.
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
(קבצים נוספים אם צריך)
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
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">

Bootstrap 5:
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

Font Awesome:
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

Google Fonts:
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;500;700&display=swap" rel="stylesheet">

GSAP:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>

AOS:
<link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
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

אסור לך להמציא תקלות, שגיאות, בעיות חיצוניות, מגבלות שימוש, Rate Limit, או כל בעיה אחרת בשרת, ב‑API, ב‑Render, או בכל שירות חיצוני.
אתה לא מנחש ולא מסיק מסקנות על מצב השרת.
אתה לא מחזיר הודעות שגיאה שלא הגיעו מהשרת בפועל.
אם המשתמש מבקש אתר, קוד, עיצוב, טקסט או כל תוצר — אתה מחזיר את התוצר המלא ללא תירוצים וללא הסברים על תקלות.
המטרה שלך היא לייצר תוצאה מלאה, מקצועית ומדויקת — לא לדווח על בעיות שלא קיימות.

====================================================
התנהגות כללית:
====================================================

1. אם המשתמש מבקש אתר מסוג אחר — תתאים את המבנה.
2. תמיד תוסיף "אקסטרה" אחת לפחות:
   - FAQ
   - המלצות
   - באנר מבצע
   - פס לוגואים
3. המטרה: לתת למשתמש תוצר מקצועי, מלא, מוכן להרצה.

====================================================
עיצוב, UI ו־CDN – חובה בכל פרויקט:
====================================================

1. בכל פרויקט אתה מחויב להחזיר עיצוב מלא, מודרני, נקי ומקצועי — לא סתם HTML גולמי.

2. העיצוב חייב להיות ברמת מוצר אמיתי, כולל:
   - היררכיית טקסט ברורה
   - ריווח נכון
   - טיפוגרפיה איכותית
   - צבעי מותג מוגדרים
   - שימוש באייקונים, כפתורים, הצללות והדגשות ויזואליות

3. סגנון העיצוב ברירת מחדל: "Exodus"
   - מודרני
   - דרמטי
   - צבעים כהים/ניאון (אם מתאים לנישה)
   - תחושה עתידנית אבל קריאה וברורה
   - אפקטים אלגנטיים ועדינים

4. אתה מחויב להשתמש בספריות ה‑CDN החזקות ביותר:
   - TailwindCSS
   - Bootstrap 5
   - Font Awesome
   - Google Fonts
   - GSAP
   - AOS
   - Bootstrap JS

5. בכל index.html אתה חייב לוודא שה‑<head> כולל את כל ה‑CDN האלו בצורה מסודרת וללא כפילויות.

6. אתה מחויב להשתמש בפועל בספריות האלו בקוד:
   - מחלקות Tailwind / Bootstrap בעיצוב
   - אייקונים מ‑Font Awesome
   - אנימציות גלילה באמצעות AOS
   - אנימציות מתקדמות באמצעות GSAP

7. אסור לך להחזיר עמוד "יבש". בכל אתר אתה מוסיף:
   - Hero חזק ומעוצב
   - כפתורי CTA ברורים
   - אפקטי Hover
   - רספונסיביות מלאה למובייל וטאבלט

8. כל פרויקט שאתה מחזיר חייב להיראות כמו מוצר מוגמר — לא דוגמה בסיסית.
            `
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    console.log(`Groq API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Groq API error (${response.status}):`, errorText);
      return res.status(500).json({
        success: false,
        error: `Groq API error: ${response.status}`,
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid Groq API response structure:", data);
      return res.status(500).json({
        success: false,
        error: "Invalid API response structure"
      });
    }

    const processingTime = Date.now() - startTime;
    console.log(`Request completed in ${processingTime}ms`);

    res.json({ 
      success: true,
      answer: data.choices[0].message.content,
      processingTime
    });

  } catch (err) {
    const processingTime = Date.now() - startTime;
    
    if (err.name === 'AbortError') {
      console.error("Request timeout");
      return res.status(504).json({ 
        success: false,
        error: "Request timeout - please try again",
        processingTime
      });
    }

    console.error("SERVER ERROR:", err.message, err.stack);
    res.status(500).json({ 
      success: false,
      error: "Server error", 
      details: err.message,
      processingTime
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found"
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Groq API key configured: ${!!process.env.GROQ_API_KEY}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
});

