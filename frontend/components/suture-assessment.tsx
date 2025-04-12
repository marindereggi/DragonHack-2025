"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Upload, Loader2, Check, X, Bot, User, Send, Save, Microscope } from "lucide-react"

// Types for our suture analysis
type SutureAnalysis = {
  isParallel: boolean
  isEquallySpaced: boolean
  sutureCount: number
  sutures: Suture[]
  score: number
  feedback: string[]
}

type Suture = {
  id: number
  x1: number
  y1: number
  x2: number
  y2: number
  isGood: boolean
  issues?: string[]
}

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function StitchMaster() {
  const router = useRouter()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string>("")
  const [analysis, setAnalysis] = useState<SutureAnalysis | null>(null)
  const [notes, setNotes] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle file upload
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = () => {
        setOriginalImage(reader.result as string)
        setProcessedImage(null)
        setAnalysis(null)
        setMessages([])
      }
      reader.readAsDataURL(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  })

  // Simulate suture detection and analysis
  const analyzeSutures = () => {
    if (!originalImage || !canvasRef.current) return

    setIsProcessing(true)
    setProcessedImage(null)
    setAnalysis(null)
    setMessages([])

    // Load the image to get dimensions
    const img = new window.Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        // Generate simulated suture data
        const simulatedAnalysis = simulateSutureAnalysis(img.width, img.height)

        // Draw the sutures on a canvas
        const canvas = canvasRef.current
        if (!canvas) {
          throw new Error("Canvas not available")
        }

        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          throw new Error("Canvas context not available")
        }

        // Draw the original image
        ctx.drawImage(img, 0, 0, img.width, img.height)

        // Draw each suture
        simulatedAnalysis.sutures.forEach((suture) => {
          // Set line style based on whether it's a good suture
          ctx.lineWidth = 4
          ctx.strokeStyle = suture.isGood ? "#10b981" : "#ef4444" // Green for good, red for bad

          // Draw the suture line
          ctx.beginPath()
          ctx.moveTo(suture.x1, suture.y1)
          ctx.lineTo(suture.x2, suture.y2)
          ctx.stroke()

          // Draw endpoints
          ctx.fillStyle = suture.isGood ? "#10b981" : "#ef4444"
          ctx.beginPath()
          ctx.arc(suture.x1, suture.y1, 5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(suture.x2, suture.y2, 5, 0, Math.PI * 2)
          ctx.fill()

          // Add suture number
          ctx.font = "16px Arial"
          ctx.fillStyle = "white"
          ctx.strokeStyle = "black"
          ctx.lineWidth = 2
          const centerX = (suture.x1 + suture.x2) / 2
          const centerY = (suture.y1 + suture.y2) / 2
          ctx.strokeText(`${suture.id + 1}`, centerX, centerY)
          ctx.fillText(`${suture.id + 1}`, centerX, centerY)
        })

        // Convert canvas to image
        const dataUrl = canvas.toDataURL("image/png")
        setProcessedImage(dataUrl)
        setAnalysis(simulatedAnalysis)

        // Add initial AI messages
        const initialMessages: Message[] = [
          {
            id: "1",
            content: "I've analyzed your suture practice image and here are the results:",
            sender: "ai",
            timestamp: new Date(),
          },
          {
            id: "2",
            content: `• Sutures detected: ${simulatedAnalysis.sutureCount}\n• Parallel sutures: ${simulatedAnalysis.isParallel ? "Yes" : "No"}\n• Equal spacing: ${simulatedAnalysis.isEquallySpaced ? "Yes" : "No"}\n• Overall score: ${simulatedAnalysis.score}/100`,
            sender: "ai",
            timestamp: new Date(),
          },
          {
            id: "3",
            content: simulatedAnalysis.feedback.join("\n"),
            sender: "ai",
            timestamp: new Date(),
          },
          {
            id: "4",
            content:
              "Do you have any questions about the assessment or would you like specific advice on how to improve?",
            sender: "ai",
            timestamp: new Date(),
          },
        ]

        setMessages(initialMessages)
      } catch (error) {
        console.error("Error analyzing sutures:", error)
        // Add error message to chat
        setMessages([
          {
            id: "error",
            content: "I encountered an error while analyzing the image. Please try uploading a different image.",
            sender: "ai",
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsProcessing(false)
      }
    }

    img.onerror = () => {
      console.error("Error loading image")
      setIsProcessing(false)
      setMessages([
        {
          id: "error",
          content: "I couldn't load the image. Please try uploading a different image.",
          sender: "ai",
          timestamp: new Date(),
        },
      ])
    }

    // Set the source after setting up the handlers
    img.src = originalImage
  }

  // Simulate suture detection and analysis
  const simulateSutureAnalysis = (width: number, height: number): SutureAnalysis => {
    // Number of sutures to generate (5-10)
    const sutureCount = 5 + Math.floor(Math.random() * 6)

    // Generate sutures
    const sutures: Suture[] = []
    const baseY = height * 0.3 // Start around 30% from the top
    const spacing = (height * 0.4) / sutureCount // Distribute in the middle 40% of the image

    // Determine if we want to make them parallel and equally spaced based on random chance
    const makeParallel = Math.random() < 0.5
    const makeEquallySpaced = Math.random() < 0.5

    // Base angle for parallel sutures
    const baseAngle = Math.random() * 20 - 10 // -10 to 10 degrees

    for (let i = 0; i < sutureCount; i++) {
      // Calculate position
      let y = baseY + i * spacing

      // Add variation to spacing if not equally spaced
      if (!makeEquallySpaced) {
        const spacingVariation = spacing * 0.5 * (Math.random() * 2 - 1)
        y += spacingVariation
      }

      // Calculate angle
      let angle = baseAngle
      if (!makeParallel) {
        const angleVariation = 15 * (Math.random() * 2 - 1)
        angle += angleVariation
      }

      // Calculate suture length
      const sutureLength = 50 + Math.random() * 50

      // Calculate endpoints based on angle and length
      const radians = (angle * Math.PI) / 180
      const halfLength = sutureLength / 2
      const centerX = width / 2 + (Math.random() * width * 0.4 - width * 0.2)

      const x1 = centerX - Math.cos(radians) * halfLength
      const x2 = centerX + Math.cos(radians) * halfLength
      const y1 = y - Math.sin(radians) * halfLength
      const y2 = y + Math.sin(radians) * halfLength

      // Determine if this is a "good" suture
      const issues: string[] = []

      if (!makeParallel) {
        issues.push("Not parallel")
      }

      if (!makeEquallySpaced && i > 0) {
        issues.push("Uneven spacing")
      }

      const isGood = issues.length === 0

      sutures.push({
        id: i,
        x1,
        y1,
        x2,
        y2,
        isGood,
        issues: issues.length > 0 ? issues : undefined,
      })
    }

    // Calculate overall analysis results
    const isParallel = makeParallel
    const isEquallySpaced = makeEquallySpaced

    // Calculate score (0-100)
    let score = 60 + Math.floor(Math.random() * 41) // Base score between 60-100
    if (!isParallel) score -= 15
    if (!isEquallySpaced) score -= 15

    // Generate feedback based on analysis
    const feedback: string[] = []

    if (isParallel && isEquallySpaced) {
      feedback.push("Excellent work! Your sutures demonstrate good parallelism and consistent spacing.")
      if (score < 90) {
        feedback.push("Consider working on maintaining consistent tension across all sutures for even better results.")
      }
    } else {
      if (!isParallel) {
        feedback.push(
          "Your sutures could be more parallel. Try using guide marks or focusing on maintaining a consistent angle.",
        )
      }
      if (!isEquallySpaced) {
        feedback.push(
          "The spacing between your sutures is inconsistent. Practice maintaining equal distances between each suture.",
        )
      }
    }

    // Add a general improvement tip
    feedback.push(
      "Remember that consistent practice is key to developing muscle memory for precise suturing technique.",
    )

    return {
      isParallel,
      isEquallySpaced,
      sutureCount,
      sutures,
      score,
      feedback,
    }
  }

  // Handle sending a message in the chat
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

      if (input.toLowerCase().includes("improve") || input.toLowerCase().includes("better")) {
        responseContent =
          "To improve your suturing technique, focus on maintaining a consistent angle for each suture. Try using visual guides or marking the practice pad with equidistant dots. Also, maintain consistent tension on the thread throughout the procedure."
      } else if (input.toLowerCase().includes("parallel") || input.toLowerCase().includes("angle")) {
        responseContent =
          "For better parallelism, try to maintain the same wrist position for each suture. It can help to place your non-dominant hand in a fixed position as a reference point. Practice with deliberate, slow movements until you develop muscle memory."
      } else if (input.toLowerCase().includes("spacing") || input.toLowerCase().includes("distance")) {
        responseContent =
          "To achieve equal spacing, you can pre-mark your practice pad with equidistant points. Alternatively, use the width of your needle holder as a measuring tool between sutures. Consistent spacing is crucial for both aesthetic results and proper wound healing."
      } else if (input.toLowerCase().includes("score") || input.toLowerCase().includes("assessment")) {
        responseContent =
          "Your score reflects several factors: parallelism of sutures, consistent spacing, proper depth, and tension. The computer vision algorithm analyzes these elements to provide an objective assessment of your technique."
      } else {
        responseContent =
          "I'm here to help with your suturing technique. You can ask about specific aspects like improving parallelism, maintaining equal spacing, or general suturing best practices."
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

  // Save assessment to history
  const saveAssessment = () => {
    // In a real app, this would save to a database
    // For this demo, we'll just navigate to the history page
    router.push("/history")
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Image Upload and Analysis */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-teal-800 flex items-center gap-2">
            <Microscope className="h-5 w-5 text-teal-600" />
            Suture Image Analysis
          </h2>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
              isDragActive ? "border-teal-500 bg-teal-50" : "border-gray-300 hover:border-teal-400",
              "h-64",
            )}
          >
            <input {...getInputProps()} disabled={isProcessing} />

            {originalImage && !processedImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={originalImage || "/placeholder.svg"}
                  alt="Original suture image"
                  fill
                  className="object-contain"
                />
              </div>
            ) : processedImage ? (
              <div className="relative w-full h-full">
                <Image
                  src={processedImage || "/placeholder.svg"}
                  alt="Analyzed suture image"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-1">
                  {isDragActive ? "Drop the image here" : "Drag & drop a suture image here"}
                </p>
                <p className="text-xs text-gray-500">or click to select a file</p>
              </div>
            )}
          </div>

          {originalImage && !processedImage && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Selected file:</span> {fileName}
              </p>
              <Button onClick={analyzeSutures} disabled={isProcessing} className="w-full bg-teal-600 hover:bg-teal-700">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Sutures...
                  </>
                ) : (
                  "Analyze Sutures"
                )}
              </Button>
            </div>
          )}

          {analysis && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Parallel Sutures</span>
                    {analysis.isParallel ? (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Equal Spacing</span>
                    {analysis.isEquallySpaced ? (
                      <Badge className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800">Overall Score</h3>
                  <span className="text-2xl font-bold text-teal-600">{analysis.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      analysis.score >= 80 ? "bg-green-500" : analysis.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Add Personal Notes
                </label>
                <Textarea
                  id="notes"
                  placeholder="Add your own observations or notes about this practice session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <Button onClick={saveAssessment} className="w-full bg-teal-600 hover:bg-teal-700">
                <Save className="mr-2 h-4 w-4" />
                Save to History
              </Button>
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </Card>

        {/* Right Column - Chat Interface */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-teal-800 flex items-center gap-2">
            <Bot className="h-5 w-5 text-teal-600" />
            Feedback Assistant
          </h2>

          <div className="h-[500px] overflow-y-auto mb-4 border rounded-lg p-4 bg-gray-50">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 mb-4 ${message.sender === "user" ? "justify-end" : ""}`}
                >
                  {message.sender === "ai" && (
                    <Avatar className="h-8 w-8 bg-teal-100">
                      <Bot className="h-4 w-4 text-teal-600" />
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user" ? "bg-teal-600 text-white" : "bg-white border border-gray-200"
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
                    <Avatar className="h-8 w-8 bg-teal-600">
                      <User className="h-4 w-4 text-white" />
                    </Avatar>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Bot className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg text-gray-500 mb-2">Feedback Assistant</p>
                <p className="text-sm text-gray-500 text-center max-w-md">
                  Upload and analyze a suture image to receive detailed feedback and guidance from our AI assistant.
                </p>
              </div>
            )}

            {isTyping && (
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-8 w-8 bg-teal-100">
                  <Bot className="h-4 w-4 text-teal-600" />
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-lg p-3">
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
              placeholder="Ask for feedback or advice..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage()
                }
              }}
              disabled={!analysis}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isTyping || !analysis}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
