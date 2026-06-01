import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialize standard GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGenAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is currently empty. Please go to Settings > Secrets in the workspace, add your GEMINI_API_KEY value, and reload.");
    }
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Google Site Verification Endpoint
  app.get("/googleb8fa65557eccd013.html", (req, res) => {
    res.type("text/html");
    res.send("google-site-verification: googleb8fa65557eccd013.html");
  });

  // Dynamic Google AdSense ads.txt Verification Endpoint
  app.get("/ads.txt", (req, res) => {
    res.type("text/plain");
    let publisherId = process.env.ADSENSE_PUBLISHER_ID || "";
    
    // Check if custom config exists dynamically
    const configPath = path.join(process.cwd(), "adsense-config.json");
    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (configData.publisherId) {
          publisherId = configData.publisherId;
        }
      } catch (e) {
        // Safe skip fallback
      }
    }
    
    // Clean and validate format
    let cleanId = publisherId.trim();
    if (cleanId) {
      if (!cleanId.startsWith("pub-")) {
        cleanId = "pub-" + cleanId;
      }
      res.send(`google.com, ${cleanId}, DIRECT, f08c47fec0942fa0\n`);
    } else {
      // If no custom ID is set, check if a static file exists in public directory
      const publicPath = path.join(process.cwd(), "public", "ads.txt");
      if (fs.existsSync(publicPath)) {
        res.sendFile(publicPath);
      } else {
        // Default instructive template which AdSense crawlers can read or user can update
        res.send(`google.com, pub-741309597469, DIRECT, f08c47fec0942fa0\n# Replace the above publisher ID with your actual Google AdSense Publisher ID in the VideoForge Help & Guides AdSense Setup Panel.\n`);
      }
    }
  });

  // GET AdSense Settings
  app.get("/api/adsense-config", (req, res) => {
    let publisherId = process.env.ADSENSE_PUBLISHER_ID || "";
    const configPath = path.join(process.cwd(), "adsense-config.json");
    if (fs.existsSync(configPath)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
        if (configData.publisherId) {
          publisherId = configData.publisherId;
        }
      } catch (e) {}
    }
    res.json({ publisherId });
  });

  // POST AdSense Settings
  app.post("/api/adsense-config", (req, res) => {
    const { publisherId } = req.body;
    let cleanId = (publisherId || "").trim();
    
    // Extract pub- prefix in case user adds full line or copy/pastes
    if (cleanId.includes("pub-")) {
      const match = cleanId.match(/pub-\d+/);
      if (match) cleanId = match[0];
    } else if (/^\d+$/.test(cleanId)) {
      cleanId = "pub-" + cleanId;
    }

    try {
      const configPath = path.join(process.cwd(), "adsense-config.json");
      fs.writeFileSync(configPath, JSON.stringify({ publisherId: cleanId }, null, 2), "utf8");
      res.json({ success: true, publisherId: cleanId });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Direct Sitemap, Robots.txt, and Bing Auth Routes for Search Console/Indexing Reliability
  app.get("/robots.txt", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "robots.txt"));
  });

  app.get("/sitemap.xml", (req, res) => {
    try {
      const sitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
      let content = fs.readFileSync(sitemapPath, "utf8");

      // Determine client host dynamically
      const host = req.get("host") || "thevideoforge.com";
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const baseUrl = `${protocol}://${host}`;

      // Dynamically replace the default/previous domain references with the current domain
      content = content.replace(/https:\/\/videoforge\.app/g, baseUrl);

      res.header("Content-Type", "application/xml");
      res.send(content);
    } catch (err) {
      res.sendFile(path.join(process.cwd(), "public", "sitemap.xml"));
    }
  });

  app.get("/BingSiteAuth.xml", (req, res) => {
    res.sendFile(path.join(process.cwd(), "public", "BingSiteAuth.xml"));
  });

  // API Route for Gemini AI Forge features
  app.post("/api/ai-forge", async (req, res) => {
    try {
      const { type, prompt } = req.body;
      
      // Attempt to retrieve and check standard GenAI client
      const genAI = getGenAI();

      if (type === 'image') {
        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                text: prompt || 'A futuristic vibrant digital matte painting of a sci-fi cyber world, ultra high quality b-roll',
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: "16:9"
            }
          }
        });

        let imageBase64 = null;
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            break;
          }
        }

        if (!imageBase64) {
          throw new Error("Gemini completed content gen, but didn't return visual image pixel nodes. Please refine your scene prompt.");
        }

        return res.json({
          success: true,
          type: 'image',
          url: `data:image/png;base64,${imageBase64}`,
          name: prompt ? (prompt.length > 25 ? prompt.substring(0, 25) + '...' : prompt) : "AI Scene"
        });
      }

      if (type === 'voiceover') {
        const response = await genAI.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: `Say naturally, clearly and with cinematic depth: ${prompt}` }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioBase64) {
          throw new Error("TTS voiceover synthesis completed but returned an empty voice stream. Try shorter speech texts.");
        }

        return res.json({
          success: true,
          type: 'voiceover',
          url: `data:audio/wav;base64,${audioBase64}`,
          name: prompt ? (prompt.length > 22 ? prompt.substring(0, 22) + '...' : prompt) : "AI Speech Track"
        });
      }

      if (type === 'script') {
        const response = await genAI.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Create a timeline storyboard video scripts for topic: "${prompt}".
Generate EXACTLY a plain JSON array containing timed captions following this exact TS structure:
[
  { "text": "Opening intro subtitle", "time": 0.5, "duration": 3.0 },
  { "text": "Secondary plot point detail", "time": 4.0, "duration": 3.5 }
]
Keep standard timings, limits of 5 total captions, text length short and sweet. Return ONLY the plain JSON array data, NO markdown code blocks, NO text headers.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  time: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER }
                },
                required: ["text", "time", "duration"]
              }
            }
          }
        });

        const rawText = response.text || "[]";
        let scriptJson = [];
        try {
          scriptJson = JSON.parse(rawText.trim());
        } catch {
          // If fallback fails JSON schema formatting
          scriptJson = [{ text: prompt, time: 0.0, duration: 4.0 }];
        }

        return res.json({
          success: true,
          type: 'script',
          script: scriptJson
        });
      }

      return res.status(400).json({ success: false, error: "Unsupported operation requested." });
    } catch (error: any) {
      console.error("AI Forge Server Engine Failure:", error.message);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Communications with Gemini failed. Verify your GEMINI_API_KEY environment variable setup." 
      });
    }
  });

  // Hot module and static express files routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

startServer();
