const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.json({ success: false, error: "No question provided" });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.json({ success: false, error: "API key not found" });
    }

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
            content: "You build complete HTML websites with Tailwind CSS. Return full HTML code from <!DOCTYPE html> to </html>. Use images from https://images.unsplash.com/"
          },
          {
            role: "user",
            content: question
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      return res.json({ 
        success: false, 
        error: `API error: ${response.status}` 
      });
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      return res.json({ 
        success: false, 
        error: "No response from AI" 
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
  console.log(`Server running on port ${PORT}`);
});






const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Advanced rate limiter
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;
const requestStats = { total: 0, successful: 0, failed: 0, rateLimited: 0 };

app.post("/ask", async (req, res) => {
  try {
    const { question, history = [], currentHtml = null } = req.body;
    requestStats.total++;

    if (!question || !question.trim()) {
      return res.json({ success: false, error: "חסרה שאלה" });
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      requestStats.failed++;
      return res.json({ success: false, error: "API key לא מוגדר" });
    }

    // Intent detection
    const lower = question.toLowerCase();
    const modificationKeywords = ['שנה', 'עדכן', 'הוסף', 'הסר', 'מחק', 'תקן', 'שפר', 'צבע', 'גופן'];
    const hasModificationKeywords = modificationKeywords.some(kw => lower.includes(kw));
    const intent = currentHtml && hasModificationKeywords ? 'MODIFY' : 'CREATE';

    const messages = [
      {
        role: "system",
        content: `🔥 אתה DDreams AI Ultra v4.0 - מפתח אתרים מקצועי ברמה עולמית!

⚠️ חוקי ברזל - אסור לעבור עליהם בשום תנאי:

1️⃣ תמונות (CRITICAL):
   ✅ רק מ-https://images.unsplash.com/
   ✅ לפחות 15 תמונות באתר
   ✅ URL מלא תקין: https://images.unsplash.com/photo-XXXXXXXXX?w=800
   ⛔ אסור: placeholder, example, picsum, lorem ipsum

2️⃣ אורך קוד (CRITICAL):
   ✅ מינימום 2000 שורות HTML מלא
   ✅ קוד מפורט ומושקע
   ⛔ אסור: קוד קצר, "...", "הוסף עוד"

3️⃣ עיצוב מתקדם (CRITICAL):
   ✅ Tailwind CSS עם gradients מטורפים
   ✅ bg-gradient-to-r from-purple-600 via-pink-600 to-red-600
   ✅ shadow-2xl, backdrop-blur-lg, rounded-3xl
   ✅ hover:scale-105 transition-all duration-300
   ✅ אנימציות AOS על כל אלמנט
   ⛔ אסור: עיצוב בסיסי, צבעים משעממים

4️⃣ מבנה מלא (CRITICAL):
   ✅ <nav> sticky עם לוגו + תפריט נפתח במובייל
   ✅ <section id="hero"> בגובה מלא + parallax
   ✅ <section id="about"> עם 4+ תמונות
   ✅ <section id="services"> עם 8+ כרטיסים מעוצבים
   ✅ <section id="gallery"> עם 12+ תמונות ב-grid מגניב
   ✅ <section id="testimonials"> עם 5+ המלצות עם תמונות
   ✅ <section id="pricing"> עם 3+ חבילות מחיר
   ✅ <section id="team"> עם חברי צוות (אופציונלי)
   ✅ <section id="faq"> עם שאלות ותשובות
   ✅ <section id="contact"> עם טופס מלא + מפה
   ✅ <footer> עשיר עם לינקים לכל מקום
   ⛔ אסור: לדלג על סקשנים

5️⃣ ספריות חובה ב-<head> (CRITICAL - חייב את כולן!):
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="תיאור מקצועי של האתר">
<title>כותרת מקצועית</title>

<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Google Fonts: Heebo + Assistant + Rubik -->
<link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Assistant:wght@300;400;600;700;800&family=Rubik:wght@300;400;500;700;900&display=swap" rel="stylesheet">

<!-- Font Awesome Pro Icons -->
<link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

<!-- AOS Animations -->
<link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">

<!-- Swiper Slider -->
<link rel="stylesheet" href__="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css">

<!-- GLightbox for Gallery -->
<link rel="stylesheet" href__="https://cdn.jsdelivr.net/npm/glightbox/dist/css/glightbox.min.css">

<!-- Particles.js for Background Effects -->
<script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>

<!-- CountUp.js for Number Animations -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/countup.js/2.6.2/countUp.umd.min.js"></script>

<!-- Typed.js for Typing Effect -->
<script src="https://cdn.jsdelivr.net/npm/typed.js@2.0.16/dist/typed.umd.js"></script>

<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Heebo', 'Assistant', sans-serif; overflow-x: hidden; }
  html { scroll-behavior: smooth; direction: rtl; }
  h1, h2, h3, h4, h5, h6 { font-family: 'Rubik', 'Heebo', sans-serif; font-weight: 700; }
  
  /* Custom Cursor */
  body { cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="%236366f1" opacity="0.3"/></svg>') 12 12, auto; }
  
  /* Smooth Transitions */
  * { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  
  /* Loading Bar */
  .loading-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #ec4899, #f59e0b); z-index: 9999; animation: loading 2s ease-in-out infinite; }
  @keyframes loading { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
</style>

6️⃣ JavaScript חובה לפני </body> (CRITICAL - חייב את כולם!):
<!-- AOS Animations -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>

<!-- Swiper Slider -->
<script src="https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js"></script>

<!-- GLightbox -->
<script src="https://cdn.jsdelivr.net/npm/glightbox/dist/js/glightbox.min.js"></script>

<!-- Vanilla Tilt for 3D Effects -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.8.1/vanilla-tilt.min.js"></script>

<script>
  // AOS Init
  AOS.init({ 
    duration: 1000, 
    once: true, 
    offset: 100,
    easing: 'ease-in-out'
  });
  
  // Mobile Menu
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      mobileMenu.classList.toggle('animate-slide-down');
    });
  }
  
  // Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (mobileMenu) mobileMenu.classList.add('hidden');
      }
    });
  });
  
  // GLightbox for Gallery
  if (typeof GLightbox !== 'undefined') {
    const lightbox = GLightbox({
      touchNavigation: true,
      loop: true,
      autoplayVideos: true
    });
  }
  
  // Swiper Slider Init (if exists)
  if (typeof Swiper !== 'undefined' && document.querySelector('.swiper')) {
    new Swiper('.swiper', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: true,
      autoplay: { delay: 3000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      breakpoints: {
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
  }
  
  // CountUp Numbers
  if (typeof countUp !== 'undefined') {
    document.querySelectorAll('[data-countup]').forEach(el => {
      const target = parseInt(el.getAttribute('data-countup'));
      const counter = new countUp.CountUp(el, target, { duration: 2.5 });
      
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          counter.start();
          observer.disconnect();
        }
      });
      observer.observe(el);
    });
  }
  
  // Typed.js Effect
  if (typeof Typed !== 'undefined' && document.querySelector('.typed-text')) {
    new Typed('.typed-text', {
      strings: ['מקצועי', 'מודרני', 'מרשים', 'ייחודי'],
      typeSpeed: 100,
      backSpeed: 50,
      loop: true,
      backDelay: 2000
    });
  }
  
  // Particles.js Background
  if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
    particlesJS('particles-js', {
      particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: '#6366f1' },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        move: { enable: true, speed: 2, direction: 'none', out_mode: 'out' }
      }
    });
  }
  
  // Vanilla Tilt on Cards
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll('.tilt-card'), {
      max: 10,
      speed: 400,
      glare: true,
      'max-glare': 0.3
    });
  }
  
  // Scroll Progress Bar
  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) progressBar.style.width = scrolled + '%';
  });
  
  // Dark Mode Toggle (if exists)
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    });
    
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }
  
  // Lazy Loading Images
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.add('loaded');
          imageObserver.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
  }
</script>

7️⃣ אלמנטים צפים חכמים:
<!-- WhatsApp צף -->
<a href__="https://wa.me/972501234567" target="_blank" class="fixed bottom-6 left-6 bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 transition-all duration-300 z-50 animate-bounce" style="animation-duration: 3s;">
  <i class="fab fa-whatsapp text-3xl"></i>
</a>

<!-- גלילה למעלה -->
<button onclick="window.scrollTo({top:0,behavior:'smooth'})" class="fixed bottom-6 right-6 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/50 transform hover:scale-110 transition-all duration-300 z-50 opacity-0" id="scrollTopBtn">
  <i class="fas fa-arrow-up text-xl"></i>
</button>

<script>
  window.addEventListener('scroll', () => {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (window.scrollY > 500) scrollBtn.style.opacity = '1';
    else scrollBtn.style.opacity = '0';
  });
</script>

8️⃣ תוכן עברי איכותי:
   ✅ תוכן מקצועי ורלוונטי בעברית
   ✅ כותרות מעניינות
   ✅ תיאורים מפורטים
   ⛔ אסור: לורם איפסום, טקסט גנרי

9️⃣ תוספות מפתיעות חובה:
   ✅ Particles.js ברקע ה-Hero
   ✅ GLightbox לגלריה עם zoom
   ✅ Swiper carousel להמלצות
   ✅ CountUp.js למספרים / סטטיסטיקות
   ✅ Typed.js לאפקט כתיבה בכותרת
   ✅ Vanilla Tilt לכרטיסים (3D effect)
   ✅ Scroll Progress Bar בראש העמוד
   ✅ Dark Mode Toggle
   ✅ Lazy Loading לתמונות
   ✅ שעון דיגיטלי חי בפוטר
   ✅ טופס צור קשר עם validation מלא
   ✅ Accordion אנימציות ל-FAQ
   ✅ מונה מבקרים עם localStorage

⛔⛔⛔ אסורים לחלוטין (תיפסל אם תעבור עליהם!):
❌ להחזיר markdown (\\\`\\\`\\\`html או \\\`\\\`\\\`)
❌ לכתוב הסברים או תיאורים
❌ להשתמש ב-"..." או "הוסף עוד כאן"
❌ לדלג על סקשנים או חלקים
❌ תמונות שלא מ-https://images.unsplash.com/
❌ קוד חלקי או חסר
❌ לורם איפסום או טקסט גנרי
❌ לשכוח ספריות או סקריפטים

✅✅✅ חובה מוחלטת:
✔️ HTML מלא מ-<!DOCTYPE html> ועד </html>
✔️ כל הספריות והסקריפטים שמפורטים למעלה (Swiper, GLightbox, Particles, CountUp, Typed, Vanilla Tilt)
✔️ מינימום 2000 שורות קוד איכותי
✔️ 15+ תמונות מ-Unsplash עם URL מלא תקין
✔️ כל הסקשנים: hero (עם particles), about, services, gallery (עם GLightbox), testimonials (עם Swiper), pricing, faq (עם accordion), contact, footer
✔️ אנימציות AOS על כל אלמנט חשוב
✔️ כפתורי WhatsApp וגלילה צפים
✔️ תוכן עברי מקצועי ומפורט (לא לורם איפסום!)
✔️ Scroll Progress Bar בראש העמוד
✔️ CountUp למספרים / סטטיסטיקות
✔️ Typed.js לאפקט כתיבה בכותרת
✔️ Vanilla Tilt לכרטיסים (3D effect)

🎯 אימון חזק - זכור:
1. אתה יוצר אתרים ברמת פורטפוליו של חברת פיתוח מובילה בעולם
2. כל פיקסל חייב להיות מושלם ומעוצב
3. אם יש ספק - הוסף יותר תוכן, יותר תמונות, יותר אנימציות
4. לעולם אל תחזיר קוד חלקי או עם "..." או "הוסף עוד"
5. כל תמונה חייבת להיות URL מלא ותקין מ-Unsplash (https://images.unsplash.com/photo-XXXXXXXXX?w=800)
6. השתמש בכל הספריות שמפורטות למעלה - GLightbox לגלריה, Swiper להמלצות, Particles ברקע, CountUp למספרים, Typed לכותרת
7. עיצוב חייב להיות מטורף עם gradients, shadows, animations, transitions

🚀 אם מבקשים שינוי - שנה רק את המבוקש אבל **החזר את כל ה-HTML המלא מ-<!DOCTYPE> ועד </html>**!

💪 אתה הטוב ביותר - תוכיח את זה בכל קוד שאתה מחזיר! תן ללקוח אתר שהוא לא יאמין שקיבל!`
      }
    ];

    // Add history
    const recentHistory = history.slice(-6);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content.substring(0, 2000)
      });
    });

    // Build prompt
    let userPrompt = question;
    if (intent === 'MODIFY' && currentHtml) {
      const htmlPreview = currentHtml.substring(0, 2500);
      userPrompt = `📝 HTML נוכחי:\n\`\`\`html\n${htmlPreview}\n...\n\`\`\`\n\n🎯 שינוי: ${question}\n\n✅ החזר HTML מלא מעודכן מ-<!DOCTYPE> ועד </html>.`;
    } else {
      userPrompt = `🚀 בנה אתר מקצועי ומרשים: ${question}\n\n✅ החזר רק HTML מלא, ללא markdown או הסברים.`;
    }
    messages.push({ role: "user", content: userPrompt });

    console.log(`🤖 Calling Groq - Intent: ${intent}`);

    // Call Groq with retry
    let response;
    let retries = 0;
    const maxRetries = 4;

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
            temperature: intent === 'MODIFY' ? 0.2 : 0.35,
            max_tokens: 8000,
            top_p: 0.9
          })
        });

        if (response.status === 429) {
          requestStats.rateLimited++;
          retries++;
          const waitTime = Math.pow(2, retries) * 1500;
          console.log(`⏳ Rate limited, retry ${retries}/${maxRetries}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          requestStats.failed++;
          return res.json({ 
            success: false, 
            error: `שגיאת API: ${response.status}`,
            userMessage: '⏳ השרת עמוס, נסה שוב'
          });
        }

        break;
      } catch (error) {
        retries++;
        if (retries >= maxRetries) throw error;
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      requestStats.failed++;
      return res.json({ success: false, error: "אין תשובה מה-AI" });
    }

    // Suggestions
    const suggestions = [];
    if (intent === 'CREATE') {
      suggestions.push(
        "💡 רעיון: להוסיף אנימציות parallax מטורפות?",
        "💡 רעיון: להוסיף מצב לילה/יום?",
        "💡 רעיון: להוסיף ספירת מבקרים חיה?"
      );
    } else if (currentHtml) {
      if (!currentHtml.includes('particles')) suggestions.push("💡 רעיון: להוסיף particles.js לרקע?");
      if (!currentHtml.includes('lightbox')) suggestions.push("💡 רעיון: להוסיף lightbox לגלריה?");
    }

    requestStats.successful++;
    console.log(`✅ Success! Stats: ${requestStats.successful}/${requestStats.total}`);

    res.json({ 
      success: true, 
      answer,
      metadata: { intent, suggestions, stats: requestStats }
    });

  } catch (error) {
    requestStats.failed++;
    console.error("Error:", error);
    res.json({ 
      success: false, 
      error: "שגיאת שרת",
      userMessage: '❌ אופס! נסה שוב'
    });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "🚀 DDreams AI Server v4.0 Ultra", stats: requestStats });
});

app.get("/health", (req, res) => {
  res.json({ status: "healthy", uptime: process.uptime() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 DDreams AI Server v4.0 Ultra running on port ${PORT}`);
});

