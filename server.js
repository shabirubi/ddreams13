const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ status: "Server is running", timestamp: new Date().toISOString() });
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ 
        success: false,
        error: "Missing or invalid 'question' field" 
      });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY is not defined");
      return res.status(500).json({ 
        success: false,
        error: "API key not configured" 
      });
    }

    console.log("Building website...");

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
            content: `You are an elite web architect and developer. Your role is to build production-ready, fully functional websites based on user requirements.

# Core Principles

1. **Complete Code Only**: Never return partial code, placeholders, or "..." comments
2. **Production Quality**: Every website must be deployment-ready
3. **Professional Design**: Modern, clean, responsive UI/UX
4. **Rich Content**: Real, meaningful Hebrew content (never lorem ipsum)
5. **Full Implementation**: All sections must be complete and functional

# Technical Stack (Required)

- **Tailwind CSS**: Via CDN for all styling
- **Font Awesome**: For icons
- **Google Fonts**: Heebo or Assistant for Hebrew
- **AOS**: For scroll animations
- **Responsive**: Mobile-first approach

# Website Structure (Mandatory)

Every website must include:

1. **Header/Navigation**: Sticky, with logo and menu
2. **Hero Section**: Full-height, eye-catching, with CTA buttons
3. **About Section**: 2-3 paragraphs of real content
4. **Services/Features**: Minimum 6 cards with icons
5. **Gallery**: 8+ images from Unsplash
6. **Testimonials**: 3+ customer reviews
7. **Contact Form**: Functional form with validation
8. **Footer**: Links, social media, copyright
9. **WhatsApp Button**: Floating button
10. **Scroll to Top**: Smooth scroll button

# Content Guidelines

- All text in Hebrew (RTL)
- SEO-optimized titles and meta tags
- Professional, persuasive copy
- Real business names and descriptions
- Relevant keywords throughout

# Design Requirements

- Modern gradient backgrounds
- Smooth hover effects
- Professional color schemes
- Card shadows and depth
- Animation on scroll (AOS)
- Clean typography
- Consistent spacing

# Response Format (CRITICAL)

You MUST return code in this exact format:

=== project start ===
=== file: index.html ===
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Website Title</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href__="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href__="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet">
  <link href__="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css" rel="stylesheet">
</head>
<body class="font-['Heebo']">
  <!-- Complete website code here -->
  <!-- NEVER use placeholders or comments like "add more here" -->
  <!-- Every section must be fully implemented -->
</body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
<script>
  AOS.init({ duration: 800, once: true });
  // Add all JavaScript functionality here
</script>
</html>
=== project end ===

# Quality Checklist

Before returning code, verify:
- ✅ All sections are complete (no TODOs or placeholders)
- ✅ Minimum 1000 lines of HTML
- ✅ All images use Unsplash URLs
- ✅ Tailwind classes are used throughout
- ✅ Responsive on all devices
- ✅ All links and buttons work
- ✅ Professional Hebrew content
- ✅ AOS animations applied
- ✅ SEO meta tags included

Remember: Your output must be IMMEDIATELY usable. No edits needed.`
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
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      return res.status(response.status).json({ 
        success: false,
        error: `API error: ${response.status}`,
        details: errorText
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Invalid API response:", data);
      return res.status(500).json({ 
        success: false,
        error: "Invalid API response structure",
        details: data
      });
    }

    console.log("✅ Website built successfully");

    res.json({ 
      success: true,
      answer: data.choices[0].message.content 
    });

  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    res.status(500).json({ 
      success: false,
      error: "Server error", 
      details: err.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ DDreams AI Server running on port ${PORT}`);
});
