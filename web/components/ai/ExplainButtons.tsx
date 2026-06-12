"use client";

import { useState, useRef } from "react";
import { Sparkles, FileText, CheckCircle2, UserCheck, MessageSquare, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export function ExplainButtons({ scheme }: { scheme: any }) {
  const [loading, setLoading] = useState(false);
  const [generatedAnswers, setGeneratedAnswers] = useState<Record<string, string>>({});
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [chatActive, setChatActive] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  
  const answerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  async function handleExplain(intent: string, displayTab: string) {
    if (generatedAnswers[displayTab]) {
      answerRefs.current[displayTab]?.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlightedId(displayTab);
      setTimeout(() => setHighlightedId(null), 2000);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/backend/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheme, intent }),
      });
      const data = await res.json();
      const answer = data.result || data.error || data.detail || "I do not have enough information to answer that question from the available scheme data.";
      setGeneratedAnswers(prev => ({ ...prev, [displayTab]: answer }));
      
      setTimeout(() => {
        answerRefs.current[displayTab]?.scrollIntoView({ behavior: "smooth", block: "start" });
        setHighlightedId(displayTab);
        setTimeout(() => setHighlightedId(null), 2000);
      }, 100);
    } catch (e) {
      console.error("Explanation API Error:", e);
      setGeneratedAnswers(prev => ({ ...prev, [displayTab]: "AI assistance is temporarily unavailable. Please try again." }));
    }
    setLoading(false);
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setLoading(true);
    setChatActive(true);

    try {
      console.log("FOLLOW-UP SUBMIT");
      const payload = { scheme, message: userMsg, history: chatLog };
      console.log("Payload:", payload);

      const res = await fetch("/api/backend/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      console.log(res.status);
      const data = await res.json();
      const answerText = data.result || data.error || data.detail || "Unable to contact Saarthi. Please try again.";
      setChatLog((prev) => [...prev, { role: "ai", text: answerText }]);
      
      setTimeout(() => {
        const el = document.getElementById("chat-answer-bottom");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 200);
    } catch (e) {
      console.error("Chat API Error:", e);
      setChatLog((prev) => [...prev, { role: "ai", text: "AI assistance is temporarily unavailable. Please try again." }]);
    }
    setLoading(false);
  }

  return (
    <div className="mt-6 mb-8 border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="bg-neutral-50 border-b border-neutral-200 p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-1">Saarthi AI Explanation Tools</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExplain("explain", "explain")}
            className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-sm font-semibold px-4 py-2 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <Sparkles size={16} className="text-purple-500" />
            Explain This Scheme
          </button>
          
          <button
            onClick={() => handleExplain("explain", "eligible")}
            className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-sm font-semibold px-4 py-2 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <UserCheck size={16} className="text-indigo-500" />
            Why Am I Eligible?
          </button>

          <button
            onClick={() => handleExplain("documents", "documents")}
            className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-sm font-semibold px-4 py-2 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <FileText size={16} className="text-blue-500" />
            What Documents Do I Need?
          </button>

          <button
            onClick={() => handleExplain("explain", "next")}
            className="inline-flex items-center gap-2 bg-white border border-neutral-300 text-sm font-semibold px-4 py-2 rounded-full hover:bg-neutral-50 transition-colors"
          >
            <CheckCircle2 size={16} className="text-emerald-500" />
            What Should I Do Next?
          </button>
        </div>
      </div>

      {loading && !chatActive && (
        <div className="p-6 flex items-center justify-center text-neutral-500">
          <Loader2 className="animate-spin mr-2" /> Saarthi is thinking...
        </div>
      )}

      {Object.entries(generatedAnswers).map(([tab, answer]) => (
        <div 
          key={tab}
          ref={(el) => { answerRefs.current[tab] = el; }}
          className={`p-6 prose prose-sm max-w-none text-neutral-700 rounded-b-2xl border-t transition-colors duration-1000 ${highlightedId === tab ? 'bg-purple-200 border-purple-300' : 'bg-purple-50/50 border-purple-100/50'}`}
        >
          <ReactMarkdown>{answer}</ReactMarkdown>
        </div>
      ))}

      <div className="border-t border-neutral-100 p-4 bg-white flex flex-col gap-3">
        <p className="text-xs text-neutral-500 italic px-1">Still have another question?</p>
        <button
          onClick={() => setChatActive(true)}
          className="self-start inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold px-4 py-2 rounded-full hover:bg-green-100 transition-colors"
        >
          <MessageSquare size={16} />
          Ask Saarthi
        </button>
      </div>

      {chatActive && (
        <div className="p-6 bg-green-50/30 border-t border-neutral-100">
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
            {chatLog.length === 0 && (
              <p className="text-sm text-neutral-500 italic">
                Ask a specific question about this scheme (e.g. "Am I eligible if my family income is ₹2 lakh?").
              </p>
            )}
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`px-4 py-2 rounded-xl text-sm max-w-[80%] ${msg.role === "user" ? "bg-green-600 text-white" : "bg-white border border-neutral-200 text-neutral-800 shadow-sm"}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {(loading && chatActive) && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-xl bg-white border border-neutral-200 text-neutral-500 text-sm shadow-sm flex items-center">
                  <Loader2 size={14} className="animate-spin mr-2" /> Saarthi is looking up details...
                </div>
              </div>
            )}
            <div id="chat-answer-bottom" />
          </div>
          <form onSubmit={handleChat} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border border-neutral-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-green-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !chatInput.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
