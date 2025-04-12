"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar } from "@/components/ui/avatar"
import { Loader2, Upload, Bot, User, Send, ArrowLeft, Download, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

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

export default function ImageProcessor() {
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [isViewingOriginal, setIsViewingOriginal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [fileName, setFileName] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>(initialAnalysis)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simulate image processing
  const processImage = () => {
    if (!currentImage) return

    setIsProcessing(true)
    setOriginalImage(currentImage) // Store the original image

    // Simulate processing delay
    setTimeout(() => {
      // In a real app, you would send the image to a backend for processing
      // Here we're just using the same image as the "processed" version
      // but in a real app, this would be replaced with the actual processed image
      setIsProcessing(false)
      setIsViewingOriginal(false)
      setAnalysisComplete(true)
    }, 2000)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = () => {
        setCurrentImage(reader.result as string)
        setOriginalImage(null)
        setIsViewingOriginal(false)
        setAnalysisComplete(false)
        setMessages(initialAnalysis)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
  })

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
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Image Area - Takes 3 columns on large screens */}
        <Card className="p-6 lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {!currentImage
                ? "Upload Image"
                : isViewingOriginal
                  ? "Original Image"
                  : analysisComplete
                    ? "Processed Image"
                    : "Image Preview"}
            </h2>

            {analysisComplete && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsViewingOriginal(!isViewingOriginal)}>
                  {isViewingOriginal ? (
                    <>
                      <RefreshCw className="mr-1 h-4 w-4" />
                      View Processed
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      View Original
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative",
              isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50",
              "h-[400px]",
              analysisComplete && "cursor-default",
            )}
          >
            <input {...getInputProps()} disabled={isProcessing || analysisComplete} />

            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center rounded-lg z-10">
                <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
                <p className="text-white font-medium">Processing your image...</p>
              </div>
            )}

            {currentImage && (isViewingOriginal ? originalImage : currentImage) ? (
              <div className="relative w-full h-full">
                <Image
                  src={isViewingOriginal ? originalImage! : currentImage}
                  alt={isViewingOriginal ? "Original image" : "Processed image"}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-1">
                  {isDragActive ? "Drop the image here" : "Drag & drop an image here"}
                </p>
                <p className="text-xs text-gray-500">or click to select a file</p>
              </div>
            )}
          </div>

          <div className="mt-4">
            {currentImage && !analysisComplete && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Selected file:</span> {fileName}
                </p>
                <Button onClick={processImage} disabled={isProcessing} className="w-full">
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Process Image"
                  )}
                </Button>
              </>
            )}

            {analysisComplete && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // In a real app, this would download the processed image
                    const link = document.createElement("a")
                    link.href = currentImage!
                    link.download = `processed-${fileName}`
                    link.click()
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Result
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setCurrentImage(null)
                    setOriginalImage(null)
                    setFileName("")
                    setIsViewingOriginal(false)
                    setAnalysisComplete(false)
                    setMessages(initialAnalysis)
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Image
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Chat Interface - Takes 2 columns on large screens, only visible after processing */}
        {analysisComplete && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Image Analysis
            </h2>

            <div className="h-[350px] overflow-y-auto mb-4 border rounded-lg p-4">
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
        )}
      </div>
    </div>
  )
}
