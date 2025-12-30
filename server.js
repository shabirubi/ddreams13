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

// Analytics storage
const analytics = {
  totalRequests: 0,
  successfulBuilds: 0,
  failedBuilds: 0,
  averageResponseTime: 0,
  popularRequests: []
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
    timestamp: new Date().toISOString()
  });
});

// Main AI endpoint
app.post("/ask", async (req, res) => {
  const startTime = Date.now();
  analytics.totalRequests++;
  
  try {
    const { question, history = [], currentHtml = null, sessionId = 'default' } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: "חסרה שאלה" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      analytics.failedBuilds++;
      return res.status(500).json({ success: false, error: "API key לא מוגדר" });
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
        content: `אתה DDreams AI Ultra - בוט בניית אתרים מתקדם ומקצועי עם אישיות חמה.

🎯 **אישיות:**
- דובר עברית חמה, חברותית וסבלנית
- מסביר בבהירות מה אתה עושה
- שואל שאלות כשצריך הבהרות
- מציע רעיונות יצירתיים
- מחמיא למשתמש על בחירות טובות

🛠️ **יכולות:**
1. **בניית אתרים חדשים** - HTML מלא עם Tailwind CSS
2. **עריכת אתרים קיימים** - שינויים מדויקים
3. **ייעוץ ועזרה** - מענה על שאלות טכניות
4. **הצעות שיפור** - ריקומנדציות אוטומטיות

📋 **כללי קוד:**
- תמיד החזר HTML מלא עם <!DOCTYPE html>
- הכלל: <script src="https://cdn.tailwindcss.com"></script>
- הכלל: <link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
- הכלל: <link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet">
- הכלל: <link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
- dir="rtl" lang="he"
- תמונות רק מ-https://images.unsplash.com/
- מינימום 1000 שורות קוד

🎨 **מבנה חובה:**
- ניווט עליון sticky עם לוגו
- Hero מרשים בגובה מלא
- אודות עם תמונות
- שירותים (6+ כרטיסים עם אייקונים)
- גלריה (8+ תמונות)
- המלצות לקוחות
- טופס יצירת קשר
- פוטר עשיר
- כפתור WhatsApp צף: <a href__="https://wa.me/972501234567" class="fixed bottom-6 left-6 bg-green-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition z-50"><i class="fab fa-whatsapp text-2xl"></i></a>
- כפתור גלילה למעלה: <button onclick="window.scrollTo({top:0,behavior:'smooth'})" class="fixed bottom-6 right-6 bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition z-50"><i class="fas fa-arrow-up"></i></button>

💬 **תקשורת:**
- אם בונה/משנה אתר - החזר רק HTML
- אם צריך הבהרה - שאל שאלה בעברית
- אם משתמש מתלונן - התנצל ושפר
- אם משתמש מרוצה - המשך להוסיף ערך

🔥 **קסם נוסף:**
- הוסף אנימציות AOS
- השתמש ב-gradients יפים
- הוסף hover effects
- כלול JavaScript לאינטראקטיביות
- וודא responsive מלא

📝 **פורמט תשובה:**
כשבונה אתר - החזר רק:
<!DOCTYPE html>
<html dir="rtl" lang="he">
...קוד מלא...
</html>

אל תשתמש ב-markdown, אל תסביר - רק קוד!`
      }
    ];

    // Add cleaned history
    const cleanedHistory = cleanHistory(history, 8);
    cleanedHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.substring(0, 2000) // Limit message size
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

    // Call Groq API
    console.log(`🤖 Calling Groq API... (${messages.length} messages)`);
    
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Groq error: ${response.status}`);
      analytics.failedBuilds++;
      return res.status(response.status).json({ 
        success: false, 
        error: `שגיאת API: ${response.status}` 
      });
    }

    const data = await response.json();
    let answer = data.choices[0]?.message?.content;

    if (!answer) {
      analytics.failedBuilds++;
      return res.status(500).json({ success: false, error: "אין תשובה מה-AI" });
    }

    // Extract and validate HTML if building
    let extractedHtml = null;
    if (intent === 'CREATE' || intent === 'MODIFY') {
      extractedHtml = extractHTML(answer);
      
      // Ensure essential CDNs
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
        sessionId
      }
    });

  } catch (err) {
    analytics.failedBuilds++;
    console.error("💥 FATAL ERROR:", err.message);
    res.status(500).json({ 
      success: false, 
      error: "שגיאת שרת פנימית", 
      details: err.message 
    });
  }
});

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
  const MAX_AGE = 3600000; // 1 hour
  
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
╚═══════════════════════════════════════╝
  `);
});
