// ============================================
// 🎓 שרת צ'אט לבניית תיקי עבודות לסטודנטים
// ============================================
// שרת Node.js עם Express לתקשורת עם Groq API
// ליצירת דפי HTML מעוצבים עם Tailwind CSS
// ============================================

// 📦 ייבוא ספריות נדרשות
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// 🚀 יצירת אפליקציית Express
const app = express();
const PORT = process.env.PORT || 3000;

// ⏱️ הגדרת timeout לבקשות API (60 שניות)
const API_TIMEOUT = 60000;

// ============================================
// 🔧 הגדרות Middleware
// ============================================

// 🌐 הגדרת CORS - מאפשר גישה מכל מקור
app.use(cors({
    origin: '*', // בפרודקשן, הגבל לדומיינים ספציפיים
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📝 פענוח JSON בבקשות
app.use(express.json());

// 📊 Middleware לתיעוד בקשות
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📨 [${timestamp}] ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log(`📋 Body:`, JSON.stringify(req.body).substring(0, 100) + '...');
    }
    next();
});

// ============================================
// 🤖 System Prompt - הוראות ל-AI
// ============================================
const SYSTEM_PROMPT = `אתה מומחה בבניית אתרי HTML מרהיבים עם Tailwind CSS לתיקי עבודות של סטודנטים.

📋 הנחיות חשובות:
1. תמיד החזר קוד HTML מלא ותקין בלבד - ללא הסברים, ללא markdown, רק HTML טהור
2. השתמש ב-Tailwind CSS דרך CDN
3. כל התוכן חייב להיות בעברית עם כיוון RTL
4. השתמש בתמונות מ-Unsplash (https://source.unsplash.com/random/800x600?keyword)
5. הוסף אייקונים מ-Font Awesome
6. הוסף אנימציות עם AOS (Animate On Scroll)
7. עיצוב מודרני, נקי ומקצועי
8. תמיכה מלאה במובייל (responsive)

📦 CDN Links להוספה ב-head:
- Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- Font Awesome: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
- AOS CSS: <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
- AOS JS: <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

🎨 סגנון עיצוב:
- צבעים מודרניים וגרדיאנטים
- צללים עדינים (shadow-lg, shadow-xl)
- פינות מעוגלות (rounded-xl, rounded-2xl)
- מרווחים נדיבים
- טיפוגרפיה ברורה

⚠️ חשוב: החזר רק את קוד ה-HTML, ללא \`\`\`html או כל תוספת אחרת!`;

// ============================================
// 🏥 נקודת קצה: בדיקת תקינות השרת
// ============================================
app.get('/', (req, res) => {
    console.log('✅ Health check requested');
    res.json({
        status: 'Server Online',
        message: '🎓 שרת הצ\'אט לתיקי עבודות פעיל!',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: 'GET /',
            chat: 'POST /ask'
        }
    });
});

// ============================================
// 💬 נקודת קצה: שליחת שאלה ל-AI
// ============================================
app.post('/ask', async (req, res) => {
    const startTime = Date.now();
    console.log('\n🚀 ========== בקשת צ\'אט חדשה ==========');
    
    try {
        // 📝 שליפת השאלה מהבקשה
        const { question } = req.body;
        
        // ✅ בדיקת תקינות - שאלה ריקה
        if (!question || question.trim() === '') {
            console.log('❌ שגיאה: שאלה ריקה');
            return res.status(400).json({
                error: 'שאלה ריקה',
                message: 'נא להזין שאלה או תיאור לדף שברצונך ליצור',
                code: 'EMPTY_QUESTION'
            });
        }
        
        console.log(`📝 שאלה: "${question.substring(0, 50)}..."`);
        
        // 🔑 בדיקת API Key
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.log('❌ שגיאה: API Key חסר');
            return res.status(500).json({
                error: 'שגיאת הגדרות שרת',
                message: 'מפתח API לא מוגדר',
                code: 'MISSING_API_KEY'
            });
        }
        
        // 🌐 יצירת בקשה ל-Groq API עם timeout
        console.log('📡 שולח בקשה ל-Groq API...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: question }
                ],
                temperature: 0.7,
                max_tokens: 8000
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // 📊 בדיקת סטטוס התשובה
        console.log(`📊 סטטוס תשובה: ${response.status}`);
        
        // ❌ טיפול בשגיאות לפי קוד סטטוס
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // 🔐 שגיאת אימות (401)
            if (response.status === 401) {
                console.log('❌ שגיאת אימות - API Key לא תקין');
                return res.status(401).json({
                    error: 'שגיאת אימות',
                    message: 'מפתח ה-API אינו תקין. נא לבדוק את ההגדרות.',
                    code: 'INVALID_API_KEY'
                });
            }
            
            // ⏳ הגבלת קצב (429)
            if (response.status === 429) {
                console.log('❌ הגבלת קצב - יותר מדי בקשות');
                return res.status(429).json({
                    error: 'הגבלת קצב',
                    message: 'יותר מדי בקשות. נא להמתין מספר שניות ולנסות שוב.',
                    code: 'RATE_LIMITED'
                });
            }
            
            // 🔧 שרת לא זמין (503)
            if (response.status === 503) {
                console.log('❌ שירות לא זמין');
                return res.status(503).json({
                    error: 'שירות לא זמין',
                    message: 'שירות ה-AI אינו זמין כרגע. נא לנסות שוב מאוחר יותר.',
                    code: 'SERVICE_UNAVAILABLE'
                });
            }
            
            // 🚨 שגיאה כללית מה-API
            console.log('❌ שגיאה מה-API:', errorData);
            return res.status(response.status).json({
                error: 'שגיאת API',
                message: errorData.error?.message || 'שגיאה בתקשורת עם שירות ה-AI',
                code: 'API_ERROR'
            });
        }
        
        // ✅ פענוח התשובה
        const data = await response.json();
        const htmlContent = data.choices[0]?.message?.content;
        
        if (!htmlContent) {
            console.log('❌ תשובה ריקה מה-API');
            return res.status(500).json({
                error: 'תשובה ריקה',
                message: 'לא התקבל תוכן מה-AI. נא לנסות שוב.',
                code: 'EMPTY_RESPONSE'
            });
        }
        
        // 📊 סטטיסטיקות
        const duration = Date.now() - startTime;
        const tokens = data.usage?.total_tokens || 'N/A';
        
        console.log(`✅ תשובה התקבלה בהצלחה!`);
        console.log(`⏱️ זמן עיבוד: ${duration}ms`);
        console.log(`🔢 טוקנים: ${tokens}`);
        console.log(`📄 אורך HTML: ${htmlContent.length} תווים`);
        
        // 📤 שליחת התשובה
        res.json({
            success: true,
            html: htmlContent,
            stats: {
                duration: `${duration}ms`,
                tokens: tokens
            }
        });
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        // ⏱️ טיפול ב-Timeout
        if (error.name === 'AbortError') {
            console.log('❌ Timeout - הבקשה ארכה יותר מדי זמן');
            return res.status(504).json({
                error: 'Timeout',
                message: 'הבקשה ארכה יותר מדי זמן (מעל 60 שניות). נא לנסות שאלה קצרה יותר.',
                code: 'TIMEOUT'
            });
        }
        
        // 🚨 שגיאה כללית
        console.error('❌ שגיאה לא צפויה:', error.message);
        console.error('📋 Stack:', error.stack);
        
        res.status(500).json({
            error: 'שגיאת שרת',
            message: 'אירעה שגיאה בעיבוד הבקשה. נא לנסות שוב.',
            code: 'SERVER_ERROR',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ============================================
// 🚫 טיפול בנתיבים לא קיימים
// ============================================
app.use((req, res) => {
    console.log(`⚠️ נתיב לא נמצא: ${req.method} ${req.path}`);
    res.status(404).json({
        error: 'נתיב לא נמצא',
        message: `הנתיב ${req.path} אינו קיים`,
        availableEndpoints: {
            health: 'GET /',
            chat: 'POST /ask'
        }
    });
});

// ============================================
// 🚨 טיפול בשגיאות גלובלי
// ============================================
app.use((error, req, res, next) => {
    console.error('🚨 שגיאה גלובלית:', error);
    res.status(500).json({
        error: 'שגיאת שרת פנימית',
        message: 'אירעה שגיאה לא צפויה',
        code: 'INTERNAL_ERROR'
    });
});

// ============================================
// 🎬 הפעלת השרת
// ============================================
app.listen(PORT, () => {
    console.log('\n============================================');
    console.log('🎓 שרת הצ\'אט לתיקי עבודות הופעל!');
    console.log('============================================');
    console.log(`🌐 כתובת: http://localhost:${PORT}`);
    console.log(`🏥 בדיקת תקינות: http://localhost:${PORT}/`);
    console.log(`💬 צ\'אט: POST http://localhost:${PORT}/ask`);
    console.log('============================================');
    console.log(`⏱️ Timeout: ${API_TIMEOUT / 1000} שניות`);
    console.log(`🔑 API Key: ${process.env.GROQ_API_KEY ? '✅ מוגדר' : '❌ חסר!'}`);
    console.log('============================================\n');
});
