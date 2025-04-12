"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Send, Bot, User } from "lucide-react"

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

// Predefined analysis results
const initialAnalysis: Message[] = [
  {
    id: "1",
    content: "I've analyzed your image and detected the following elements:",
    sender: "ai",
    timestamp: new Date(),
  },
  {
    id: "2",
    content:
      "• Image resolution: 1920x1080px\n• Format: JPEG\n• Color profile: sRGB\n• Dominant colors: #3a86ff, #8338ec, #ff006e",
    sender: "ai",
    timestamp: new Date(),
  },
  {
    id: "3",
    content: "Would you like me to suggest any enhancements for this image?",
    sender: "ai",
    timestamp: new Date(),
  },
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialAnalysis)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      let responseContent = ""

      if (input.toLowerCase().includes("enhance") || input.toLowerCase().includes("suggestion")) {
        responseContent =
          "I recommend increasing the contrast by 10%, applying a subtle sharpening filter, and adjusting the white balance to make the colors pop more."
      } else if (input.toLowerCase().includes("color") || input.toLowerCase().includes("palette")) {
        responseContent =
          "The image contains a vibrant color palette with cool blues and purples contrasted with warm pinks. This creates a dynamic visual tension that draws the viewer's eye."
      } else if (input.toLowerCase().includes("export") || input.toLowerCase().includes("format")) {
        responseContent =
          "For web use, I recommend exporting as WebP for the best balance of quality and file size. For print, use TIFF or high-quality PNG."
      } else {
        responseContent =
          "I'm here to help with your image analysis. You can ask me about colors, composition, technical details, or enhancement suggestions."
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        content: responseContent,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000)
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Bot className="h-5 w-5" />
        Image Analysis
      </h2>

      <div className="h-80 overflow-y-auto mb-4 border rounded-lg p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 mb-4 ${message.sender === "user" ? "justify-end" : ""}`}
          >
            {message.sender === "ai" && (
              <Avatar className="h-8 w-8 bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </Avatar>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-line text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {message.sender === "user" && (
              <Avatar className="h-8 w-8 bg-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </Avatar>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-8 w-8 bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </Avatar>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex gap-1">
                <span
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Ask about your image analysis..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSendMessage()
            }
          }}
        />
        <Button onClick={handleSendMessage} disabled={!input.trim() || isTyping}>
          <Send className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </Card>
  )
}
