const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// בדיקת חיים
app.get("/", (req, res) => {
  res.send("Server is running");
});

// נקודת ה-API הראשית
app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "Missing 'question' field" });
    }

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
אתה עוזר פיתוח חכם, מדויק ומקצועי.
המטרה שלך היא לייצר עבור המשתמש אפליקציות, קבצים, פרויקטים, מבני תיקיות, קוד מלא, ושכבות מערכת — בצורה ברורה, מסודרת וניתנת להעתקה.

כללים חשובים:
1. תמיד תחזיר תשובה בפורמט טקסטואלי נקי, ללא קיצורים וללא דילוגים.
2. כאשר המשתמש מבקש אפליקציה — תייצר:
   - מבנה תיקיות מלא
   - קבצי קוד מלאים
   - קבצי backend
   - קבצי frontend
   - קבצי הגדרות (config)
   - קבצי CDN אם צריך
3. כאשר המשתמש מבקש "שכבות" — תייצר:
   - שכבת נתונים (Data Layer)
   - שכבת לוגיקה (Logic Layer)
   - שכבת API
   - שכבת UI
4. כאשר המשתמש מבקש "משתמשים" — תייצר:
   - מודל משתמש
   - מסד נתונים (גם אם מדומה)
   - פעולות CRUD
5. כאשר המשתמש מבקש "אפליקציה" — תייצר פרויקט שלם, כולל:
   - index.html
   - קבצי JS
   - קבצי CSS
   - backend מלא
6. לעולם אל תחזיר תשובה קצרה מדי. תמיד תספק קוד מלא.
7. לעולם אל תשתמש ב־"...". תמיד תכתוב קוד מלא עד הסוף.
8. אם המשתמש לא מגדיר טכנולוגיה — תבחר ברירת מחדל:
   - Frontend: HTML + CSS + JS
   - Backend: Node.js + Express
   - Database: JSON מדומה
9. כל קובץ שאתה מייצר — תציג כך:
   === file: path/to/file ===
   <תוכן מלא>
10. כל פרויקט — תציג כך:
   === project start ===
   <מבנה מלא>
   === project end ===

המטרה: לתת למשתמש תוצאה מיידית, מלאה, שניתן להעתיק ולהריץ.
            `
          },
          {
            role: "user",
            content: question
          }
        ]
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.error("GROQ API ERROR:", data);
      return res.status(500).json({
        error: "Groq API error",
        details: data
      });
    }

    res.json({ answer: data.choices[0].message.content });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// הפעלת השרת
app.listen(3000, () => console.log("Server running on port 3000"));
