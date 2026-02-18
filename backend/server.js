
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const Groq = require("groq-sdk");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Path to MinGW bin (so spawned executables can find libstdc++/libgcc DLLs)
const MINGW_BIN = "C:\\Users\\NEEHARIKA\\AppData\\Local\\Microsoft\\WinGet\\Packages\\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\\mingw64\\bin";


console.log("🔍 Environment Check:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✓ Set" : "✗ Not Set");
console.log("GROQ_API_KEY:", process.env.GROQ_API_KEY ? "✓ Set" : "✗ Not Set");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✓ Set" : "✗ Not Set");
console.log("");

const app = express();
app.use(cors());
app.use(express.json());


// =========================
// AUTH MIDDLEWARE
// =========================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // Allow in development mode without token
  if (!authHeader) {
    if (process.env.NODE_ENV !== "production") {
      req.user = { id: "dev-user", email: "dev@local" };
      return next();
    }
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET || "dev-secret";
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      req.user = { id: "dev-user", email: "dev@local" };
      return next();
    }
    res.status(401).json({ message: "Invalid token" });
  }
};


// =========================
// OPTIMIZE CODE ENDPOINT
// =========================
app.post("/optimize", authMiddleware, async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!groq) {
      return res.status(503).json({ message: "Code optimization unavailable. GROQ_API_KEY not configured." });
    }
    const prompt = `Optimize this ${language} code for best performance. Return ONLY the optimized code.\n\n${code}`;
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });
    const optimizedCode = response.choices[0].message.content;
    res.json({ optimizedCode });
  } catch (err) {
    console.error("OPTIMIZE ERROR:", err);
    res.status(500).json({ message: "Failed to optimize code." });
  }
});

// =========================
// EXPLAIN CODE ENDPOINT
// =========================
app.post("/explain", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!groq) return res.status(503).json({ explanation: "AI explanation unavailable. GROQ_API_KEY not configured." });
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 2000
    });
    const explanation = response.choices?.[0]?.message?.content || "";
    res.json({ explanation });
  } catch (err) {
    res.status(500).json({ explanation: "Failed to get explanation." });
  }
});

// =========================
// HISTORY ENDPOINT
// =========================
app.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await History.find({ userId }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history." });
  }
});

/* =========================
    MONGODB CONNECTION (OPTIONAL)
========================= */

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✓ MongoDB Connected"))
    .catch((err) => console.log("✗ MongoDB Connection Error:", err.message));
} else {
  console.log("⚠️  MONGO_URI not set - database features disabled");
}

/* =========================
   MODELS
========================= */

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

const HistorySchema = new mongoose.Schema(
  {
    userId: String,
    code: String,
    language: String,
    review: String,
    suggestions: String,
    refactoredCode: String,
    critical: Number,
    high: Number,
    medium: Number,
    low: Number,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const History = mongoose.model("History", HistorySchema);

/* =========================
   GROQ CLIENT
========================= */

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn("⚠️  GROQ_API_KEY not set. Code review features will be unavailable.");
}

/* =========================
   AUTH MIDDLEWARE
========================= */



/* =========================
   REGISTER
========================= */

app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashed,
    });

    res.json({ message: "Registration successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   LOGIN
========================= */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "dev-secret", {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
/* =========================
   ANALYZE
========================= */

app.post("/analyze", authMiddleware, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: "No code provided" });
    }

    if (!groq) {
      return res.status(503).json({ message: "Code review feature unavailable. GROQ_API_KEY not configured." });
    }

    const prompt = `
You are a professional senior code reviewer.

STRICTLY return VALID JSON ONLY.
DO NOT add markdown.
DO NOT add explanations outside JSON.

Return in this exact format:

{
  "critical": number,
  "high": number,
  "medium": number,
  "low": number,
  "review": "ONLY quality review analysis. NO suggestions here.",
  "suggestions": "ONLY improvement suggestions. NO review here."
}

Analyze this ${language} code:

${code}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 2000
    });

    let content = response.choices?.[0]?.message?.content || "";

    // Remove accidental markdown
    content = content.replace(/```json/g, "")
                     .replace(/```/g, "")
                     .trim();

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("JSON PARSE ERROR:", err);
      return res.status(500).json({
        message: "AI did not return valid JSON"
      });
    }

    // Force clean structure
    const cleanResponse = {
      critical: Number(parsed.critical) || 0,
      high: Number(parsed.high) || 0,
      medium: Number(parsed.medium) || 0,
      low: Number(parsed.low) || 0,
      review: parsed.review || "",
      suggestions: parsed.suggestions || ""
    };

    await History.create({
      userId: req.user.id,
      code,
      language,
      review: cleanResponse.review,
      suggestions: cleanResponse.suggestions,
      critical: cleanResponse.critical,
      high: cleanResponse.high,
      medium: cleanResponse.medium,
      low: cleanResponse.low
    });

    res.json(cleanResponse);

  } catch (err) {
    console.error("ANALYZE ERROR:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

/* =========================
   REFACTOR
========================= */

app.post("/refactor", authMiddleware, async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!groq) {
      return res.status(503).json({ message: "Code refactor feature unavailable. GROQ_API_KEY not configured." });
    }

    const prompt = `
Rewrite this ${language} code with improvements.
Return ONLY the improved code.

${code}
`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const refactoredCode = response.choices[0].message.content;

    await History.create({
      userId: req.user.id,
      code,
      language,
      refactoredCode,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    });

    res.json({ refactoredCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   RUN CODE (STABLE VERSION)
========================= */
app.post("/run", authMiddleware, async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code) {
      return res.status(400).json({ message: "No code provided" });
    }

    let child;
    let output = "";

    if (language === "python") {
      child = spawn("python", ["-X", "utf8", "-c", code]);
    }
    else if (language === "javascript") {
      child = spawn("node", ["-e", code]);
    }
    else if (language === "c") {
      const tempDir = os.tmpdir();
      const timestamp = Date.now() + Math.random().toString(36).substring(7);
      const codeFile = path.join(tempDir, `code_${timestamp}.c`);
      const exeFile = path.join(tempDir, `code_${timestamp}.exe`);
      fs.writeFileSync(codeFile, code);
      try {
        const gccPath = "C:\\Users\\NEEHARIKA\\AppData\\Local\\Microsoft\\WinGet\\Packages\\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\\mingw64\\bin\\gcc.exe";
        const compileResult = spawnSync(gccPath, [codeFile, "-o", exeFile, "-static-libgcc"], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (compileResult.error) {
          return res.status(400).json({ output: "GCC Error: " + compileResult.error?.message });
        }
        if (compileResult.stderr && compileResult.stderr.trim()) {
          return res.status(400).json({ output: "Compilation Error:\n" + compileResult.stderr });
        }
        child = spawn(exeFile, [], { env: { ...process.env, PATH: (process.env.PATH || process.env.Path || '') + ';' + MINGW_BIN } });
      } catch (e) {
        return res.status(500).json({ output: "GCC execution failed: " + e.message });
      }
    }
    else if (language === "cpp") {
      const tempDir = os.tmpdir();
      const timestamp = Date.now() + Math.random().toString(36).substring(7);
      const codeFile = path.join(tempDir, `code_${timestamp}.cpp`);
      const exeFile = path.join(tempDir, `code_${timestamp}.exe`);
      fs.writeFileSync(codeFile, code);
      try {
        const gppPath = "C:\\Users\\NEEHARIKA\\AppData\\Local\\Microsoft\\WinGet\\Packages\\BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\\mingw64\\bin\\g++.exe";
        const compileResult = spawnSync(gppPath, [codeFile, "-o", exeFile, "-static-libgcc", "-static-libstdc++"], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (compileResult.error) {
          return res.status(400).json({ output: "G++ Error: " + compileResult.error?.message });
        }
        if (compileResult.stderr && compileResult.stderr.trim()) {
          return res.status(400).json({ output: "Compilation Error:\n" + compileResult.stderr });
        }
        child = spawn(exeFile, [], { env: { ...process.env, PATH: (process.env.PATH || process.env.Path || '') + ';' + MINGW_BIN } });
      } catch (e) {
        return res.status(500).json({ output: "G++ execution failed: " + e.message });
      }
    }
    else if (language === "java") {
      const tempDir = os.tmpdir();
      const className = code.match(/public class (\w+)/)?.[1] || "Main";
      const codeFile = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(codeFile, code);
      try {
        const javacPath = "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.10.7-hotspot\\bin\\javac.exe";
        const javaPath = "C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.10.7-hotspot\\bin\\java.exe";
        const compileResult = spawnSync(javacPath, [codeFile], { encoding: 'utf-8', cwd: tempDir, stdio: ['pipe', 'pipe', 'pipe'] });
        if (compileResult.error) {
          return res.status(400).json({ output: "JAVAC Error: " + compileResult.error?.message });
        }
        if (compileResult.stderr && compileResult.stderr.trim()) {
          return res.status(400).json({ output: "Compilation Error:\n" + compileResult.stderr });
        }
        child = spawn(javaPath, [className], { cwd: tempDir });
      } catch (e) {
        return res.status(500).json({ output: "Java execution failed: " + e.message });
      }
    }
    else {
      return res.status(400).json({ message: "Unsupported language" });
    }

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      output += data.toString();
    });

    child.on("error", (err) => {
      console.error("Process error:", err);
      res.status(500).json({ output: "Execution error: " + err.message });
    });

    child.on("close", () => {
      res.json({ output });
    });

    // Send input properly
    if (input) {
      child.stdin.write(input + "\n");
    }

    child.stdin.end();

  } catch (err) {
    console.error("RUN ERROR:", err);
    res.status(500).json({ message: "Execution failed" });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(8000, () => {
  console.log("Server running on port 8000");
});