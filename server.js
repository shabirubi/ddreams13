const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// הגדרות CORS מורחבות
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ 
    status: "Server Online ✓", 
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "GET /",
      chat: "POST /ask"
    }
  });
});

app.post("/ask", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { question } = req.body;

    // בדיקת תקינות השאלה
    if (!question || typeof question !== 'string' || !question.trim()) {
      console.warn("⚠️ Empty or invalid question received");
      return res.status(400).json({ 
        success: false, 
        error: "שאלה חסרה או לא תקינה" 
      });
    }

    console.log(`📝 Question received: ${question.substring(0, 50)}...`);

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
     <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap" rel="stylesheet">
     <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
     <link href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
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

    console.log("🚀 Sending request to Groq API...");

    // Timeout wrapper
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

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
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      
      // טיפול בשגיאות ספציפיות
      if (response.status === 401) {
        return res.status(401).json({ 
          success: false, 
          error: "API Key לא תקין - בדוק את המפתח" 
        });
      } else if (response.status === 429) {
        return res.status(429).json({ 
          success: false, 
          error: "חרגת ממכסת הבקשות - נסה שוב מאוחר יותר" 
        });
      } else if (response.status === 503) {
        return res.status(503).json({ 
          success: false, 
          error: "שירות Groq לא זמין כרגע - נסה שוב" 
        });
      }
      
      return res.status(response.status).json({ 
        success: false, 
        error: `שגיאת API: ${response.status}`,
        details: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    
    if (!data?.choices?.[0]?.message?.content) {
      console.error("❌ Invalid API Response:", JSON.stringify(data).substring(0, 200));
      return res.status(500).json({ 
        success: false, 
        error: "תשובה לא תקינה מה-API" 
      });
    }

    const answer = data.choices[0].message.content;
    const duration = Date.now() - startTime;

    console.log(`✅ Response generated successfully in ${duration}ms`);
    console.log(`📊 Response length: ${answer.length} characters`);

    return res.json({ 
      success: true, 
      answer: answer,
      metadata: {
        duration_ms: duration,
        model: data.model,
        tokens: data.usage
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("❌ Server Error:", error.message);
    console.error("Stack:", error.stack);
    
    // טיפול בשגיאות timeout
    if (error.name === 'AbortError') {
      return res.status(504).json({ 
        success: false, 
        error: "הבקשה ארכה יותר מדי זמן - נסה שאלה קצרה יותר" 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: "שגיאת שרת פנימית",
      message: error.message,
      duration_ms: duration
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Error:", err);
  res.status(500).json({ 
    success: false, 
    error: "שגיאה לא צפויה בשרת" 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/ask`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
