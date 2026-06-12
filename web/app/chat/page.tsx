"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RotateCcw, Bot, User, FileText, Send, Download, MessageSquareShare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuestionnaireStore } from "@/lib/store";
import { QUESTIONS, getNextQuestion } from "@/lib/questions";
import { rankSchemes } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Message = {
  id: string;
  role: "ai" | "user";
  text?: string;
  hindiText?: string;
  questionId?: string;
  options?: any[];
  isFinal?: boolean;
};

export default function ChatPage() {
  const router = useRouter();
  const {
    currentQuestionId,
    profile,
    results,
    setAnswer,
    goToQuestion,
    setResults,
    reset,
  } = useQuestionnaireStore();

  // Calculate total potential benefits
  const potentialBenefit = results?.reduce((acc, curr) => {
    if (!curr.monetary_benefit) return acc;
    const num = parseInt(curr.monetary_benefit.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(num)) return acc + num;
    return acc;
  }, 0) || 0;

  const [messages, setMessages] = useState<Message[]>([]);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [isTyping, setIsTyping] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            id: "greeting",
            role: "ai",
            text: "Hello! I am Saarthi. I'll ask you a few simple questions to find the best government schemes for you.",
            hindiText: "नमस्ते! मैं सारथी हूँ। मैं आपके लिए सर्वश्रेष्ठ सरकारी योजनाओं को खोजने के लिए आपसे कुछ सरल प्रश्न पूछूंगा।",
          },
        ]);
        setTimeout(() => {
          askQuestion(currentQuestionId);
          setIsTyping(false);
        }, 1000);
      }, 500);
    }
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function askQuestion(qId: string) {
    const q = QUESTIONS[qId];
    if (!q) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `q-${qId}-${Date.now()}`,
        role: "ai",
        text: q.prompt,
        hindiText: q.hindiPrompt,
        questionId: qId,
        options: q.options,
      },
    ]);
  }

  async function handleOptionSelect(qId: string, value: any, label: string, hindiLabel?: string) {
    // Remove options from the previous message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.questionId === qId ? { ...msg, options: undefined } : msg
      )
    );

    // Add user response
    setMessages((prev) => [
      ...prev,
      {
        id: `a-${qId}-${Date.now()}`,
        role: "user",
        text: label,
        hindiText: hindiLabel || label,
      },
    ]);

    const q = QUESTIONS[qId];
    const nextId = getNextQuestion(qId, value);
    setAnswer(q.profileKey as string, value);

    if (nextId === null) {
      // Terminal
      setIsTyping(true);
      try {
        const finalProfile = { ...profile, [q.profileKey as string]: value };
        const result = await rankSchemes(finalProfile as any);
        setResults(result.schemes, result.total, result.profile_summary);
        
        setTimeout(() => {
          setIsTyping(false);
          setSummaryGenerated(true);
          setMessages((prev) => [
            ...prev,
            {
              id: `final-${Date.now()}`,
              role: "ai",
              text: "I have found some schemes that match your profile perfectly!",
              hindiText: "मुझे कुछ ऐसी योजनाएं मिली हैं जो आपकी प्रोफ़ाइल से पूरी तरह मेल खाती हैं!",
              isFinal: true,
            },
          ]);
        }, 1500);

      } catch (e) {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "ai",
            text: "Oops, I encountered an error while searching for schemes.",
            hindiText: "क्षमा करें, योजनाएं खोजते समय एक त्रुटि हुई।",
          },
        ]);
      }
    } else {
      setIsTyping(true);
      setTimeout(() => {
        goToQuestion(nextId);
        askQuestion(nextId);
        setIsTyping(false);
      }, 600);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-warm-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-neutral-500 hover:text-neutral-800 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-india-green-light/30 flex items-center justify-center text-india-green">
              <Bot size={18} />
            </div>
            <div>
              <h1 className="font-bold text-neutral-800 leading-none">Saarthi</h1>
              <p className="text-xs text-neutral-500">Government Scheme Assistant</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "hi")}
            className="text-xs border border-neutral-200 rounded-md px-2 py-1 bg-neutral-50 text-neutral-700 focus:outline-none focus:border-india-green cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
          <button
            onClick={() => {
              reset();
              setMessages([]);
              setSummaryGenerated(false);
            }}
            className="text-neutral-500 hover:text-saffron transition-colors"
            title="Start Over"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-india-green text-white flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                    <Bot size={16} />
                  </div>
                )}
                
                <div className="flex flex-col gap-2 max-w-[85%] sm:max-w-[75%]">
                  {/* Bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-india-green text-white rounded-tr-sm"
                        : "bg-white border border-neutral-200 text-neutral-800 rounded-tl-sm"
                    }`}
                  >
                    <p>{language === "hi" && msg.hindiText ? msg.hindiText : msg.text}</p>
                  </div>

                  {/* Options */}
                  {msg.options && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleOptionSelect(msg.questionId!, opt.value, opt.label, opt.hindiLabel)}
                          className="bg-white border border-india-green/30 text-india-green hover:bg-india-green-light/20 font-medium text-sm px-4 py-2 rounded-full transition-colors shadow-sm active:scale-95"
                        >
                          {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
                          {language === "hi" && opt.hindiLabel ? opt.hindiLabel : opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Final Summary Card */}
                  {msg.isFinal && summaryGenerated && (
                    <div className="mt-4 bg-white border border-neutral-200 rounded-2xl p-5 shadow-card w-full sm:w-[400px]">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                        <Sparkles size={18} className="text-saffron" />
                        <h3 className="font-bold text-neutral-900">Conversation Summary</h3>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wide mb-1">About You</p>
                          <div className="bg-neutral-50 rounded-xl p-3 text-sm text-neutral-700 grid grid-cols-2 gap-2">
                            {profile.age && <div><span className="text-neutral-400">Age:</span> {profile.age}</div>}
                            {profile.occupation && <div className="capitalize"><span className="text-neutral-400">Job:</span> {profile.occupation}</div>}
                            {profile.state && <div className="col-span-2"><span className="text-neutral-400">Location:</span> {profile.state}</div>}
                            {profile.income_band && <div className="col-span-2"><span className="text-neutral-400">Income:</span> {profile.income_band.replace(/_/g, " ")}</div>}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-neutral-500 uppercase font-semibold tracking-wide mb-1">Results</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-xl">
                              <div className="text-saffron-dark font-bold text-xl">
                                {results?.length || 0}
                              </div>
                              <p className="text-xs text-neutral-600 font-medium leading-tight">
                                Schemes<br/>Found
                              </p>
                            </div>
                            {potentialBenefit > 0 && (
                              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-xl">
                                <div className="text-green-700 font-bold text-lg">
                                  ₹{potentialBenefit.toLocaleString("en-IN")}
                                </div>
                                <p className="text-xs text-green-700 font-medium leading-tight">
                                  Potential<br/>Benefits
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => router.push("/results")}
                          className="w-full mt-2 flex justify-center items-center gap-2 bg-saffron hover:bg-saffron-dark text-white font-bold py-3 px-4 rounded-xl transition-colors"
                        >
                          View Recommended Schemes <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0 ml-3 mt-1 shadow-sm">
                    <User size={16} />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-india-green text-white flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="px-4 py-4 rounded-2xl bg-white border border-neutral-200 flex items-center gap-1 shadow-sm rounded-tl-sm">
                <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
