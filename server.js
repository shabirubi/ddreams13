const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// טעינת הגדרות מקובץ config.json
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const app = express();
const PORT = config.server.port || 3000;

// ============================================
// Middleware
// ============================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging
app.use((req, res, next) => {
  console.log(`\n📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// Health Check
// ============================================
app.get('/', (req, res) => {
  console.log('✅ Health check');
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
// Chat Endpoint
// ============================================
app.post('/ask', async (req, res) => {
  const startTime = Date.now();
  console.log('🚀 ========== בקשת צ\'אט חדשה ==========');

  try {
    const { question } = req.body;

    // בדיקת שאלה ריקה
    if (!question || question.trim() === '') {
      console.log('❌ שאלה ריקה');
      return res.status(400).json({
        success: false,
        error: config.messages.errors.empty_question
      });
    }

    console.log(`📝 שאלה: "${question.substring(0, 50)}..."`);

    // בדיקת API Key
    const apiKey = process.env.GROQ_API_KEY || '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';
    
    if (!apiKey) {
      console.log('❌ API Key חסר');
      return res.status(500).json({
        success: false,
        error: config.messages.errors.missing_api_key
      });
    }

    console.log('📡 שולח בקשה ל-Groq API...');

    // Timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.server.timeout);

    // בקשה ל-Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: config.ai.temperature,
        max_tokens: config.ai.max_tokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📊 סטטוס תשובה: ${response.status}`);

    // טיפול בשגיאות API
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ שגיאת API:', errorData);

      if (response.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'מפתח API לא תקין'
        });
      }

      if (response.status === 429) {
        return res.status(429).json({
          success: false,
          error: config.messages.errors.rate_limit
        });
      }

      return res.status(response.status).json({
        success: false,
        error: config.messages.errors.api_error
      });
    }

    // פענוח התשובה
    const data = await response.json();
    const htmlContent = data.choices[0]?.message?.content;

    if (!htmlContent) {
      console.log('❌ תשובה ריקה');
      return res.status(500).json({
        success: false,
        error: 'לא התקבל תוכן מה-AI'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ תשובה התקבלה בהצלחה!`);
    console.log(`⏱️ זמן עיבוד: ${duration}ms`);
    console.log(`📄 אורך HTML: ${htmlContent.length} תווים`);

    // שליחת התשובה
    res.json({
      success: true,
      html: htmlContent,
      message: config.messages.success.generated,
      stats: {
        duration: `${duration}ms`,
        length: htmlContent.length
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    // Timeout
    if (error.name === 'AbortError') {
      console.log('❌ Timeout');
      return res.status(504).json({
        success: false,
        error: config.messages.errors.timeout
      });
    }

    // שגיאה כללית
    console.error('❌ שגיאה:', error.message);
    res.status(500).json({
      success: false,
      error: config.messages.errors.server_error,
      details: error.message
    });
  }
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: 'נתיב לא נמצא',
    availableEndpoints: {
      health: 'GET /',
      chat: 'POST /ask'
    }
  });
});

// ============================================
// Error Handler
// ============================================
app.use((error, req, res, next) => {
  console.error('🚨 שגיאה גלובלית:', error);
  res.status(500).json({
    success: false,
    error: 'שגיאת שרת פנימית'
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log('\n============================================');
  console.log('🎓 שרת הצ\'אט לתיקי עבודות הופעל!');
  console.log('============================================');
  console.log(`🌐 כתובת: http://localhost:${PORT}`);
  console.log(`🏥 בדיקת תקינות: http://localhost:${PORT}/`);
  console.log(`💬 צ\'אט: POST http://localhost:${PORT}/ask`);
  console.log('============================================\n');
});
