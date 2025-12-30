const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session storage (in-memory for demo, use Redis for production)
const sessions = new Map();
const MAX_SESSION_SIZE = 100;

// Queue system for rate limiting
const requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

// Analytics storage
const analytics = {
  totalRequests: 0,
  successfulBuilds: 0,
  failedBuilds: 0,
  averageResponseTime: 0,
  popularRequests: [],
  rateLimitHits: 0,
  queuedRequests: 0
};

// Helper: Clean session history
function cleanHistory(history, maxMessages = 10) {
  if (history.length <= maxMessages) return history;
  return history.slice(-maxMessages);
}

// Helper: Extract HTML from various formats
function extractHTML(text) {
  // Try project format
  const projectMatch = text.match(/===\s*file:\s*index\.html\s*===\s*([\s\S]*?)(?:===\s*project\s*end|$)/i);
  if (projectMatch) return projectMatch[1].trim();
  
  // Try markdown
  const markdownMatch = text.match(/```html\s*([\s\S]*?)```/i) || text.match(/```\s*(<!DOCTYPE[\s\S]*?<\/html>)\s*```/i);
  if (markdownMatch) return markdownMatch[1].trim();
  
  // Try direct HTML
  const htmlMatch = text.match(/<!DOCTYPE[\s\S]*<\/html>/i);
  if (htmlMatch) return htmlMatch[0].trim();
  
  return null;
}

// Helper: Detect user intent
function detectIntent(question, hasCurrentHtml) {
  const lower = question.toLowerCase();
  
  if (!hasCurrentHtml) return 'CREATE';
  
  const modificationKeywords = [
    'שנה', 'עדכן', 'הוסף', 'הסר', 'מחק', 'הזז', 'הקטן', 'הגדל',
    'שפר', 'תקן', 'צבע', 'גופן', 'רקע', 'תמונה'
  ];
  
  if (modificationKeywords.some(kw => lower.includes(kw))) {
    return 'MODIFY';
  }
  
  const questionKeywords = ['מה', 'איך', 'למה', 'האם', 'מתי', 'כמה'];
  if (questionKeywords.some(kw => lower.includes(kw))) {
    return 'QUESTION';
  }
  
  return 'CREATE';
}

// Helper: Generate smart suggestions
function generateSuggestions(intent, currentHtml) {
  if (intent === 'CREATE') {
    return [
      "💡 רעיון: אוכל להוסיף אנימציות מגניבות",
      "💡 רעיון: אוכל להוסיף מצב כהה/בהיר",
      "💡 רעיון: אוכל להוסיף טופס חכם עם וולידציה"
    ];
  }
  
  if (intent === 'MODIFY' && currentHtml) {
    const suggestions = [];
    if (!currentHtml.includes('aos')) suggestions.push("💡 רעיון: להוסיף אנימציות בגלילה?");
    if (!currentHtml.includes('whatsapp')) suggestions.push("💡 רעיון: להוסיף כפתור WhatsApp?");
    if (!currentHtml.includes('gradient')) suggestions.push("💡 רעיון: לשפר עם gradients?");
    return suggestions;
  }
  
  return [];
}

// Helper: Process queue with rate limiting
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    const { req, res, resolve: resolveRequest } = requestQueue.shift();
    lastRequestTime = Date.now();
    
    try {
      await handleAIRequest(req, res);
      resolveRequest();
    } catch (error) {
      res.json({ success: false, error: error.message, userMessage: '❌ שגיאה בעיבוד הבקשה' });
      resolveRequest();
    }
  }
  
  isProcessingQueue = false;
}

// Root endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "🚀 DDreams AI Server v3.0 ULTRA",
    uptime: process.uptime(),
    analytics: {
      totalRequests: analytics.totalRequests,
      successRate: analytics.totalRequests > 0 
        ? ((analytics.successfulBuilds / analytics.totalRequests) * 100).toFixed(2) + '%'
        : '0%'
    }
  });
});

// Analytics endpoint
app.get("/analytics", (req, res) => {
  res.json({
    ...analytics,
    activeSessions: sessions.size,
    queueLength: requestQueue.length,
    isProcessing: isProcessingQueue,
    timestamp: new Date().toISOString()
  });
});

// Main AI endpoint with queue
app.post("/ask", async (req, res) => {
  analytics.totalRequests++;
  analytics.queuedRequests++;
  
  // Add to queue
  await new Promise((resolve) => {
    requestQueue.push({ req, res, resolve });
    processQueue();
  });
});

// Actual AI request handler
async function handleAIRequest(req, res) {
  const startTime = Date.now();
  
  try {
    const { question, history = [], currentHtml = null, sessionId = 'default' } = req.body;

    if (!question || !question.trim()) {
      return res.json({ success: false, error: "חסרה שאלה" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      analytics.failedBuilds++;
      return res.json({ success: false, error: "API key לא מוגדר" });
    }

    // Detect intent
    const intent = detectIntent(question, currentHtml);
    console.log(`📊 Intent: ${intent} | Question: ${question.substring(0, 50)}...`);

    // Get or create session
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { history: [], createdAt: Date.now() });
    }
    const session = sessions.get(sessionId);

    // Build messages with context
    const messages = [
      {
        role: "system",
        content: `אתה מפתח אתרים מקצועי ברמה עולמית. תפקידך לבנות אתרי HTML מלאים ומושקעים.

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
</html>

אם מבקשים שינוי - שנה רק את המבוקש ושמור על כל השאר!`
      }
    ];

    // Add cleaned history
    const cleanedHistory = cleanHistory(history, 8);
    cleanedHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.substring(0, 2000)
      });
    });

    // Build smart prompt based on intent
    let userPrompt = question;
    
    if (intent === 'MODIFY' && currentHtml) {
      const htmlPreview = currentHtml.substring(0, 3000);
      userPrompt = `HTML נוכחי (קטע):\n\`\`\`\n${htmlPreview}...\n\`\`\`\n\nשינוי מבוקש: ${question}\n\nבצע את השינוי והחזר HTML מלא מעודכן.`;
    } else if (intent === 'CREATE') {
      userPrompt = `בנה אתר מלא ומקצועי: ${question}\n\nהחזר רק HTML, ללא הסברים.`;
    }

    messages.push({ role: "user", content: userPrompt });

    // Call Groq API with retry logic
    console.log(`🤖 Calling Groq API... (${messages.length} messages)`);
    
    let response;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages,
            temperature: intent === 'MODIFY' ? 0.3 : 0.4,
            max_tokens: 8000
          })
        });

        if (response.status === 429) {
          analytics.rateLimitHits++;
          retries++;
          const waitTime = Math.pow(2, retries) * 1000;
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry ${retries}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Groq error: ${response.status}`);
          analytics.failedBuilds++;
          return res.json({ 
            success: false, 
            error: `שגיאת API: ${response.status}`,
            userMessage: response.status === 429 
              ? '⏳ השרת עמוס, נסה שוב בעוד כמה שניות'
              : 'שגיאה בתקשורת עם השרת'
          });
        }

        break;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const data = await response.json();
    let answer = data.choices[0]?.message?.content;

    if (!answer) {
      analytics.failedBuilds++;
      return res.json({ success: false, error: "אין תשובה מה-AI" });
    }

    // Extract and validate HTML if building
    let extractedHtml = null;
    if (intent === 'CREATE' || intent === 'MODIFY') {
      extractedHtml = extractHTML(answer);
      
      if (extractedHtml) {
        if (!extractedHtml.includes('tailwindcss')) {
          extractedHtml = extractedHtml.replace('</head>', '  <script src="https://cdn.tailwindcss.com"></script>\n</head>');
        }
        if (!extractedHtml.includes('font-awesome')) {
          extractedHtml = extractedHtml.replace('</head>', '  <link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">\n</head>');
        }
      }
    }

    // Generate smart suggestions
    const suggestions = generateSuggestions(intent, extractedHtml || currentHtml);

    // Update session
    session.history.push({ role: 'user', content: question });
    session.history.push({ role: 'assistant', content: answer });
    if (session.history.length > MAX_SESSION_SIZE) {
      session.history = session.history.slice(-MAX_SESSION_SIZE);
    }

    // Update analytics
    analytics.successfulBuilds++;
    const responseTime = Date.now() - startTime;
    analytics.averageResponseTime = 
      (analytics.averageResponseTime * (analytics.totalRequests - 1) + responseTime) / analytics.totalRequests;

    console.log(`✅ Success in ${responseTime}ms`);

    res.json({ 
      success: true, 
      answer,
      metadata: {
        intent,
        responseTime: responseTime + 'ms',
        hasHtml: !!extractedHtml,
        suggestions,
        sessionId,
        queuePosition: requestQueue.length
      }
    });

  } catch (err) {
    analytics.failedBuilds++;
    console.error("💥 FATAL ERROR:", err.message);
    res.json({ 
      success: false, 
      error: "שגיאת שרת פנימית", 
      details: err.message,
      userMessage: '❌ אופס! משהו השתבש. נסה שוב בעוד רגע'
    });
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime() 
  });
});

// Clear session endpoint
app.post("/clear-session", (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.delete(sessionId);
  res.json({ success: true, message: "Session cleared" });
});

// Cleanup old sessions every hour
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 3600000;
  
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > MAX_AGE) {
      sessions.delete(id);
      console.log(`🧹 Cleaned session: ${id}`);
    }
  }
}, 3600000);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 DDreams AI Server v3.0 ULTRA    ║
║  Port: ${PORT}                          ║
║  Status: 🟢 Online                   ║
║  Features:                           ║
║    ✅ Smart Intent Detection         ║
║    ✅ Session Management             ║
║    ✅ Auto Suggestions               ║
║    ✅ Analytics Tracking             ║
║    ✅ HTML Validation                ║
║    ✅ Context Awareness              ║
║    ✅ Rate Limit Protection          ║
║    ✅ Queue System                   ║
╚═══════════════════════════════════════╝
  `);
});
