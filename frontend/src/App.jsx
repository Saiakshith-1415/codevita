import { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
function App() {
        // Optimize Code state
        const [optimizedCode, setOptimizedCode] = useState("");
        const [showOptimizeModal, setShowOptimizeModal] = useState(false);

        // Optimize Code handler
        const optimizeCode = async () => {
          try {
            setLoading(true);
            const res = await axios.post(
              "https://codevita.onrender.com",
              { code, language },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setOptimizedCode(res.data.optimizedCode);
            setShowOptimizeModal(true);
          } catch (err) {
            alert("Optimization failed");
          } finally {
            setLoading(false);
          }
        };

        // Optimize Modal
        const OptimizeModal = () => (
          showOptimizeModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-[#1f2937] p-6 rounded-xl w-[600px] max-h-[80vh] overflow-y-auto shadow-lg relative">
                <button className="absolute top-2 right-2 text-gray-400" onClick={() => setShowOptimizeModal(false)}>✖</button>
                <h2 className="text-xl font-bold mb-4 text-blue-500">Optimized Code</h2>
                <SyntaxHighlighter language={language} style={dracula}>
                  {optimizedCode}
                </SyntaxHighlighter>
                <button
                  className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg text-white font-semibold hover:scale-105 transition"
                  onClick={() => { navigator.clipboard.writeText(optimizedCode); }}
                >
                  📋 Copy Optimized Code
                </button>
              </div>
            </div>
          )
        );
      // ...existing code...

      // History Modal UI
      const HistoryModal = () => (
        showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#1f2937] p-6 rounded-xl w-[600px] max-h-[80vh] overflow-y-auto shadow-lg relative">
              <button className="absolute top-2 right-2 text-gray-400" onClick={() => { setShowHistory(false); setSelectedHistory(null); }}>✖</button>
              <h2 className="text-xl font-bold mb-4 text-purple-400">History</h2>
              {!selectedHistory ? (
                <ul>
                  {history.length === 0 ? <li className="text-gray-500">No history found.</li> : history.map((item, idx) => (
                    <li key={item._id} className="mb-2 border-b border-gray-300 dark:border-gray-700 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#232946]" onClick={() => setSelectedHistory(item)}>
                      <span className="font-semibold text-blue-400">{item.language}</span> <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                      <div className="truncate text-sm text-gray-700 dark:text-gray-300">{item.code?.slice(0, 60)}...</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div>
                  <button className="mb-2 text-xs text-blue-400 underline" onClick={() => setSelectedHistory(null)}>← Back to list</button>
                  <div className="mb-2">
                    <span className="font-semibold">Language:</span> {selectedHistory.language}
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Code:</span>
                    <SyntaxHighlighter language={selectedHistory.language} style={dracula}>
                      {selectedHistory.code}
                    </SyntaxHighlighter>
                  </div>
                  {selectedHistory.refactoredCode && (
                    <div className="mb-2">
                      <span className="font-semibold">Refactored Code:</span>
                      <SyntaxHighlighter language={selectedHistory.language} style={dracula}>
                        {selectedHistory.refactoredCode}
                      </SyntaxHighlighter>
                    </div>
                  )}
                  {selectedHistory.review && (
                    <div className="mb-2">
                      <span className="font-semibold">Review:</span> <span className="text-gray-700 dark:text-gray-300">{selectedHistory.review}</span>
                    </div>
                  )}
                  {selectedHistory.suggestions && (
                    <div className="mb-2">
                      <span className="font-semibold">Suggestions:</span> <span className="text-gray-700 dark:text-gray-300">{selectedHistory.suggestions}</span>
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="font-semibold">Result:</span>
                    <ul className="ml-4 text-sm">
                      <li>Critical: {selectedHistory.critical}</li>
                      <li>High: {selectedHistory.high}</li>
                      <li>Medium: {selectedHistory.medium}</li>
                      <li>Low: {selectedHistory.low}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      );
    // History state
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);

    // Fetch history
    const fetchHistory = async () => {
      try {
        const res = await axios.get("http://localhost:8000/history", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data.history);
        setShowHistory(true);
      } catch (err) {
        alert("Failed to fetch history");
      }
    };
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("review");
  const [reviewTab, setReviewTab] = useState("review");
  const [userInput, setUserInput] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [result, setResult] = useState(null);
  const token = localStorage.getItem("token");

  /* ================= AUTH ================= */

  const register = async () => {
    try {
      await axios.post("http://localhost:8000/register", { email, password });
      alert("Registered successfully. Please login.");
      setIsRegister(false);
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  const login = async () => {
    try {
      const res = await axios.post("https://codevita.onrender.com/login", {
        email,
        password,
      });
      localStorage.setItem("token", res.data.token);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const runCode = async () => {
  try {
    const res = await axios.post(
      "https://codevita.onrender.com/run",
      {
        code,
        language,
        input: userInput
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setOutput(res.data.output);
  } catch (err) {
    console.error(err);
    alert("Execution failed");
  }
};



  /* ================= ANALYZE ================= */

  const analyzeCode = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        "https://codevita.onrender.com/analyze",
        { code, language },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      setActiveTab("review");
      setReviewTab("review");
    } catch {
      alert("Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= REFACTOR ================= */

  const refactorCode = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        "https://codevita.onrender.com/refactor",
        { code, language },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult((prev) => ({
        ...prev,
        refactoredCode: res.data.refactoredCode,
      }));

      setActiveTab("rewrite");
    } catch {
      alert("Refactor failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGIN SCREEN ================= */

  if (!token) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-[#0b1120] text-white`}>
        <div className="bg-[#111827] p-8 rounded-xl w-96 border border-gray-800">
          <h2 className="text-xl font-semibold mb-6 text-center">
            {isRegister ? "Register" : "Login"}
          </h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 p-3 bg-[#1f2937] rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-6 p-3 bg-[#1f2937] rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={isRegister ? register : login}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mb-4"
          >
            {isRegister ? "Register" : "Login"}
          </button>
          <div className="text-center text-sm text-gray-400">
            {isRegister
              ? "Already have an account?"
              : "Don't have an account?"}
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="ml-2 text-blue-400"
            >
              {isRegister ? "Login" : "Register"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================= DASHBOARD ================= */

  return (
    <div>
      <HistoryModal />
      <div className={`min-h-screen ${darkMode ? 'bg-[#0b1120] text-white' : 'bg-gray-100 text-black'}`}> 
      {/* TOP NAV */}
      <div className="flex justify-between items-center px-10 py-4 border-b border-gray-800">
        <div className="text-purple-400 font-semibold text-lg">
          🤖 Code Review Agent
        </div>
        <div className="flex items-center gap-4">
          <div className="text-green-400 text-sm bg-green-400/10 px-3 py-1 rounded-full">
            ✓ AI Connected
          </div>
          <button
            onClick={fetchHistory}
            className="px-3 py-1 rounded-full border border-blue-400 text-xs text-blue-400 bg-white/20 hover:bg-white/40 transition-all duration-200 shadow"
          >
            📜 History
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-1 rounded-full border border-gray-400 text-xs">
            {darkMode ? '🌙 Dark' : '☀ Light'}
          </button>
          <button onClick={logout} className="text-red-400 text-sm">
            Logout
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="text-center py-10">
        <h1 className="text-4xl font-bold text-purple-400">
          Intelligent Code Review & Rewrite
        </h1>
      </div>

      {/* TABS */}
      <div className="flex gap-6 px-12 border-b border-gray-800 pb-3 text-sm text-gray-400">
        <button onClick={() => setActiveTab("review")}
          className={activeTab === "review" ? "text-blue-400 border-b border-blue-400 pb-1" : ""}>
          🔍 Code Review
        </button>

        <button onClick={() => setActiveTab("rewrite")}
          className={activeTab === "rewrite" ? "text-blue-400 border-b border-blue-400 pb-1" : ""}>
          ✏ Rewritten Code
        </button>

        <button onClick={() => setActiveTab("how")}
          className={activeTab === "how" ? "text-blue-400 border-b border-blue-400 pb-1" : ""}>
          ℹ How it Works
        </button>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-2 gap-8 px-12 py-8">
        {/* LEFT PANEL */}
        <div className={`${darkMode ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-300'} p-6 rounded-xl border`}>
          <h2 className="mb-4 font-semibold">Your Code</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={`w-full mb-4 p-3 rounded-lg border ${darkMode ? 'bg-[#1f2937] border-gray-700 text-white' : 'bg-gray-100 border-gray-300 text-black'}`}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <Editor
              height="250px"
              language={language}
              theme={darkMode ? "vs-dark" : "light"}
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                wordWrap: "on",
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                tabSize: 2,
              }}
            />
          </div>
          <div className="mt-4">
            <label className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Program Input </label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows="3"
              className={`w-full mt-2 p-3 font-mono rounded-lg border ${darkMode ? 'bg-black text-green-400 border-gray-700' : 'bg-gray-100 text-green-700 border-gray-300'}`}
              placeholder="Enter input for your program here..."
            />
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={analyzeCode}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg"
            >
              {loading ? "Analyzing..." : "Review Code"}
            </button>

            <button
              onClick={refactorCode}
              className="flex-1 bg-green-500 hover:bg-green-600 py-3 rounded-lg font-semibold transition"
            >
              {loading ? "Rewriting..." : "Fix & Rewrite Code"}
            </button>

            <button
              onClick={runCode}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 py-3 rounded-lg font-semibold transition"
            >
              ▶ Run Code
            </button>

            <button
              onClick={optimizeCode}
              className="flex-1 bg-blue-500 hover:bg-blue-600 py-3 rounded-lg font-semibold transition"
            >
              🚀 Optimize Code
            </button>
          </div>
</div>

        {/* RIGHT PANEL */}
        <div className={`${darkMode ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-300'} p-6 rounded-xl border`}>
          <h2 className="mb-4 font-semibold">Review Results</h2>
          {/* OUTPUT SECTION */}
          {output && (
            <>
              <h3 className="text-lg font-semibold mt-6 mb-2">Output</h3>
              <div className={`font-mono p-4 rounded-lg border max-h-60 overflow-y-auto whitespace-pre-wrap ${darkMode ? 'bg-black text-green-400 border-gray-700' : 'bg-gray-100 text-green-700 border-gray-300'}`}>
                {output}
              </div>
            </>
          )}

          <HistoryModal />
          <OptimizeModal />

          {result && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              {["critical", "high", "medium", "low"].map((level) => (
                <div key={level} className={`p-4 rounded-lg text-center ${darkMode ? 'bg-[#1f2937]' : 'bg-gray-200'}`}>
                  <div className={`text-sm capitalize ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{level}</div>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-blue-600'}`}>
                    {result[level] || 0}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REVIEW TAB */}
          {activeTab === "review" && result && (
            <>
              <div className="flex gap-4 mb-4 text-sm">
                <button
                  onClick={() => setReviewTab("review")}
                  className={reviewTab === "review" ? "text-blue-400 border-b border-blue-400" : "text-gray-400"}
                >
                  Review
                </button>

                <button
                  onClick={() => setReviewTab("suggestions")}
                  className={reviewTab === "suggestions" ? "text-blue-400 border-b border-blue-400" : "text-gray-400"}
                >
                  Suggestions
                </button>
              </div>

              <div className="bg-[#0b1120] p-4 rounded-lg border border-gray-700 h-72 overflow-y-auto text-sm whitespace-pre-wrap">
                {reviewTab === "review"
                  ? result.review
                  : result.suggestions}
              </div>
            </>
          )}

<h3 className="text-lg font-semibold mb-2">Original Code</h3>

<div className="rounded-lg border border-gray-700 overflow-hidden mb-6">
  <SyntaxHighlighter
    language={language}
    style={dracula}
    showLineNumbers={true}
    wrapLines={true}
    customStyle={{
      margin: 0,
      padding: "16px",
      fontSize: "14px",
      maxHeight: "18rem",
      overflowY: "auto",
      background: "#282a36"
    }}
  >
    {code}
  </SyntaxHighlighter>
</div>

          {/* REWRITE TAB */}
          {activeTab === "rewrite" &&
  (result?.refactoredCode ? (
    <>
      <h3 className="text-lg font-semibold mb-2">
        Rewritten Code
      </h3>

      <div className="rounded-lg border border-gray-700 overflow-hidden">
  <SyntaxHighlighter
    language={language}
    style={dracula}
    showLineNumbers={true}
    wrapLines={true}
    customStyle={{
      margin: 0,
      padding: "16px",
      background: "#0b1120",
      fontSize: "14px",
      maxHeight: "18rem",
      overflowY: "auto"
    }}
  >
    {result.refactoredCode}
  </SyntaxHighlighter>
</div>

      {/* COPY BUTTON */}
      <button
        onClick={() => navigator.clipboard.writeText(result.refactoredCode)}
        className="w-full mt-4 py-3 bg-[#1f2937] hover:bg-[#273244] rounded-lg transition text-sm"
      >
        📋 Copy Rewritten Code
      </button>
    </>
  ) : (
    <div className="text-gray-400 text-sm">
      No rewritten code yet. Please analyze and rewrite your code.
    </div>
  ))}
          {/* HOW IT WORKS */}
          {activeTab === "how" && (
              <div className="flex flex-col gap-6 mt-8">
                <div className="backdrop-blur-md bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 shadow-lg rounded-2xl p-6 flex items-center gap-4" style={{boxShadow:'0 8px 32px 0 rgba(31, 38, 135, 0.15)', border:'1px solid rgba(255,255,255,0.18)'}}>
                  <span className="text-2xl">1️⃣</span>
                  <span className="font-semibold text-lg">Paste your code</span>
                </div>
                <div className="backdrop-blur-md bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 shadow-lg rounded-2xl p-6 flex items-center gap-4" style={{boxShadow:'0 8px 32px 0 rgba(31, 38, 135, 0.15)', border:'1px solid rgba(255,255,255,0.18)'}}>
                  <span className="text-2xl">2️⃣</span>
                  <span className="font-semibold text-lg">AI analyzes for bugs & best practices</span>
                </div>
                <div className="backdrop-blur-md bg-white/30 dark:bg-white/10 border border-white/30 dark:border-white/10 shadow-lg rounded-2xl p-6 flex items-center gap-4" style={{boxShadow:'0 8px 32px 0 rgba(31, 38, 135, 0.15)', border:'1px solid rgba(255,255,255,0.18)'}}>
                  <span className="text-2xl">3️⃣</span>
                  <span className="font-semibold text-lg">Get production-ready rewrite</span>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;
