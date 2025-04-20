"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BotIcon, SendIcon, UserIcon, AlertCircleIcon, HelpCircleIcon, InfoIcon, XIcon } from "lucide-react"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your RBC banking assistant powered by Groq AI. How can I help you with your banking questions today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showHelpPopup, setShowHelpPopup] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Suggested questions
  const suggestions = [
    "What are RBC's mortgage rates?",
    "How do I protect myself from banking fraud?",
    "What's the difference between a TFSA and an RRSP?",
    "How do I set up direct deposit?",
  ]

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return
    setError(null)
    setShowSuggestions(false)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Prepare messages for API (excluding the initial greeting)
      const apiMessages = messages
        .slice(1)
        .concat(userMessage)
        .map(({ role, content }) => ({
          role,
          content,
        }))

      // Call our API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API error:", response.status, errorData)
        throw new Error(errorData.error || "Failed to get response")
      }

      const data = await response.json()

      // Add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content,
        },
      ])
    } catch (err) {
      console.error("Chat error:", err)
      setError("Sorry, there was an error connecting to the AI service. Please try again.")

      // Fallback to client-side response if AI fails
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I'm having trouble connecting to my AI service right now. Please try again later or ask another question.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const toggleHelpPopup = () => {
    setShowHelpPopup(!showHelpPopup)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header with RBC Logo */}
        <div className="flex justify-center mb-6">
          <div className="bg-[#0051A5] text-white py-3 px-6 rounded-full flex items-center shadow-md">
            <div className="mr-2 font-bold text-xl">RBC</div>
            <div className="text-sm">Royal Bank of Canada</div>
          </div>
        </div>

        <Card className="w-full shadow-xl border-blue-100">
          <CardHeader className="bg-gradient-to-r from-[#0051A5] to-[#00338D] text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-full mr-3">
                  <BotIcon size={24} className="text-[#0051A5]" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">RBC Virtual Assistant</CardTitle>
                  <p className="text-blue-100 text-sm mt-1">Powered by AI</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-blue-700 rounded-full"
                onClick={toggleHelpPopup}
                aria-label="Help"
              >
                <HelpCircleIcon size={20} />
              </Button>
            </div>
          </CardHeader>

          {/* Help Popup */}
          {showHelpPopup && (
            <div className="absolute right-4 top-24 w-80 bg-white rounded-xl shadow-lg border border-blue-100 z-10 overflow-hidden">
              <div className="bg-gradient-to-r from-[#0051A5] to-[#00338D] text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold">About This Assistant</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white hover:bg-blue-700 rounded-full p-0"
                  onClick={toggleHelpPopup}
                >
                  <XIcon size={16} />
                </Button>
              </div>
              <div className="p-4 text-sm">
                <p className="mb-3">
                  The RBC Virtual Assistant is designed to help you with banking-related questions and information.
                </p>
                <p className="mb-3">
                  <span className="font-semibold">What it can do:</span>
                </p>
                <ul className="list-disc pl-5 mb-3 space-y-1">
                  <li>Answer general banking questions</li>
                  <li>Provide information about RBC services</li>
                  <li>Explain banking terms and concepts</li>
                  <li>Guide you through common banking procedures</li>
                </ul>
                <p className="mb-3">
                  <span className="font-semibold">What it cannot do:</span>
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access your personal account information</li>
                  <li>Make transactions on your behalf</li>
                  <li>Provide personalized financial advice</li>
                  <li>Handle sensitive personal information</li>
                </ul>
              </div>
            </div>
          )}

          <CardContent className="p-6 h-[400px] overflow-y-auto bg-gradient-to-b from-blue-50/50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 mb-4 ${
                  message.role === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="h-10 w-10 rounded-full bg-[#0051A5] flex items-center justify-center shadow-sm">
                    <BotIcon size={20} className="text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-5 py-3 max-w-[80%] shadow-sm ${
                    message.role === "assistant"
                      ? "bg-white text-slate-800 border border-blue-100"
                      : "bg-[#0051A5] text-white"
                  }`}
                >
                  {/* Use white-space-pre-line to preserve line breaks */}
                  <div className="whitespace-pre-line leading-normal" style={{ textIndent: "0" }}>
                    {message.content}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                    <UserIcon size={20} className="text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-[#0051A5] flex items-center justify-center shadow-sm">
                  <BotIcon size={20} className="text-white" />
                </div>
                <div className="rounded-2xl px-5 py-3 max-w-[80%] bg-white text-slate-800 border border-blue-100 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#0051A5] animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#0051A5] animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#0051A5] animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl flex items-center gap-2 mb-4 border border-red-100 shadow-sm">
                <AlertCircleIcon size={16} />
                {error}
              </div>
            )}

            {showSuggestions && messages.length === 1 && (
              <div className="mt-6 mb-2">
                <div className="text-sm text-gray-500 mb-2 flex items-center">
                  <InfoIcon size={14} className="mr-1" />
                  Suggested questions:
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="bg-white border border-blue-200 hover:bg-blue-50 text-[#0051A5] text-sm py-2 px-3 rounded-full transition-colors shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="border-t border-blue-100 p-4 bg-white rounded-b-xl">
            <form onSubmit={handleSubmit} className="flex w-full gap-2">
              <Input
                placeholder="Ask any banking question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border-blue-200 focus-visible:ring-[#0051A5] rounded-full py-6 px-4 shadow-sm"
                disabled={isLoading}
                ref={inputRef}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-[#0051A5] hover:bg-[#003D7D] text-white rounded-full px-5 shadow-sm"
              >
                <SendIcon size={18} className="mr-2" />
                Send
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© Royal Bank of Canada. All rights reserved. For demonstration purposes only.</p>
          <p className="mt-1">
            This assistant provides general information and is not a substitute for professional financial advice.
          </p>
        </div>
      </div>
    </div>
  )
}
