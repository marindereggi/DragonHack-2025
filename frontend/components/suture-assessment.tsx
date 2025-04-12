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

    // Create FormData for sending the image
    const formData = new FormData();
    
    // Convert base64 data URL back to File object
    if (originalImage.startsWith('data:')) {
      const arr = originalImage.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1];
      const bstr = atob(arr[arr.length - 1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      const file = new File([u8arr], fileName, { type: mime });
      formData.append('image', file);
    }

    // Send request to API
    fetch('/api/analyze-suture', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error analyzing sutures');
      }
      return response.json();
    })
    .then(data => {
      try {
        // Load image for display
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = data.originalImage;
        
        img.onload = () => {
          // Set canvas dimensions
          const canvas = canvasRef.current;
          if (!canvas) {
            throw new Error("Canvas is not available");
          }

          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("Canvas context is not available");
          }

          // Draw the original image
          ctx.drawImage(img, 0, 0, img.width, img.height);

          // Draw each suture
          data.analysis.sutures.forEach((suture) => {
            // Set line style based on whether the suture is good
            ctx.lineWidth = 4;
            ctx.strokeStyle = suture.isGood ? "#10b981" : "#ef4444"; // Green for good, red for bad

            // Draw the suture line
            ctx.beginPath();
            ctx.moveTo(suture.x1, suture.y1);
            ctx.lineTo(suture.x2, suture.y2);
            ctx.stroke();

            // Draw endpoints
            ctx.fillStyle = suture.isGood ? "#10b981" : "#ef4444";
            ctx.beginPath();
            ctx.arc(suture.x1, suture.y1, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(suture.x2, suture.y2, 5, 0, Math.PI * 2);
            ctx.fill();

            // Add suture number
            ctx.font = "16px Arial";
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            const centerX = (suture.x1 + suture.x2) / 2;
            const centerY = (suture.y1 + suture.y2) / 2;
            ctx.strokeText(`${suture.id + 1}`, centerX, centerY);
            ctx.fillText(`${suture.id + 1}`, centerX, centerY);
          });

          // Convert canvas to image
          const dataUrl = canvas.toDataURL("image/png");
          setProcessedImage(dataUrl);
          setAnalysis(data.analysis);

          // Add initial AI messages
          const initialMessages: Message[] = [
            {
              id: "1",
              content: "I've analyzed your suture image and here are the results:",
              sender: "ai",
              timestamp: new Date(),
            },
            {
              id: "2",
              content: `• Sutures detected: ${data.analysis.sutureCount}\n• Parallel sutures: ${data.analysis.isParallel ? "Yes" : "No"}\n• Equal spacing: ${data.analysis.isEquallySpaced ? "Yes" : "No"}\n• Overall score: ${data.analysis.score}/100`,
              sender: "ai",
              timestamp: new Date(),
            },
            {
              id: "3",
              content: data.analysis.feedback.join("\n"),
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
          ];

          setMessages(initialMessages);
        };
      } catch (error) {
        console.error("Error drawing sutures:", error);
        // Add error message to chat
        setMessages([
          {
            id: "error",
            content: "An error occurred while analyzing the image. Please try uploading a different image.",
            sender: "ai",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    })
    .catch(error => {
      console.error("Error analyzing sutures:", error);
      setIsProcessing(false);
      setMessages([
        {
          id: "error",
          content: "An error occurred while analyzing the image. Please try uploading a different image.",
          sender: "ai",
          timestamp: new Date(),
        },
      ]);
    });
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

    // Send message to API
    fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: input }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error processing message');
      }
      return response.json();
    })
    .then(data => {
      setMessages((prev) => [...prev, data.message])
      setIsTyping(false)
    })
    .catch(error => {
      console.error('Error:', error);
      setIsTyping(false)
      setMessages(prev => [...prev, {
        id: "error",
        content: "An error occurred while processing the message. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      }]);
    });
  }

  // Save assessment to history
  const saveAssessment = () => {
    if (!analysis || !processedImage) return

    setIsProcessing(true)

    // Prepare data for saving
    const assessmentData = {
      assessment: {
        timestamp: new Date().toISOString(),
        filename: fileName,
        image: processedImage,
        analysis: analysis,
        notes: notes,
        messages: messages,
      }
    }

    // Send request to API
    fetch('/api/save-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assessmentData),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error saving assessment');
      }
      return response.json();
    })
    .then(data => {
      setIsProcessing(false);
      // In a real application we might redirect to the history page
      alert("Assessment successfully saved!");
      
      // We can redirect to the history page
      router.push('/history');
    })
    .catch(error => {
      console.error('Error:', error);
      setIsProcessing(false);
      alert("An error occurred while saving the assessment. Please try again.");
    });
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-[600px]">
        {/* Left Column - Image Upload and Analysis */}
        <Card className="p-6 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-teal-800 dark:text-teal-300 flex items-center gap-2">
            <Microscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Suture Image Analysis
          </h2>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors flex-grow",
              isDragActive 
                ? "border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/20" 
                : "border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-400",
            )}
          >
            <input {...getInputProps()} disabled={isProcessing} />

            {originalImage && !processedImage ? (
              <div className="relative w-full h-full flex-grow min-h-[300px]">
                <Image
                  src={originalImage || "/placeholder.svg"}
                  alt="Original suture image"
                  fill
                  className="object-contain"
                />
              </div>
            ) : processedImage ? (
              <div className="relative w-full h-full flex-grow min-h-[300px]">
                <Image
                  src={processedImage || "/placeholder.svg"}
                  alt="Analyzed suture image"
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {isDragActive ? "Drop the image here" : "Drag & drop a suture image here"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">or click to select a file</p>
              </div>
            )}
          </div>

          {originalImage && !processedImage && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <span className="font-medium">Selected file:</span> {fileName}
              </p>
              <Button onClick={analyzeSutures} disabled={isProcessing} className="w-full">
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
            <div className="mt-6 space-y-4 flex-grow overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Parallel Sutures</span>
                    {analysis.isParallel ? (
                      <Badge className="bg-green-500 dark:bg-green-600">
                        <Check className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <X className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Equal Spacing</span>
                    {analysis.isEquallySpaced ? (
                      <Badge className="bg-green-500 dark:bg-green-600">
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

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">Overall Score</h3>
                  <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">{analysis.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      analysis.score >= 80 
                        ? "bg-green-500 dark:bg-green-600" 
                        : analysis.score >= 60 
                          ? "bg-yellow-500 dark:bg-yellow-600" 
                          : "bg-red-500 dark:bg-red-600"
                    }`}
                    style={{ width: `${analysis.score}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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

              <Button 
                onClick={saveAssessment} 
                disabled={isProcessing}
                className="w-full mt-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Assessment...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    Save To History
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </Card>

        {/* Right Column - AI Chat */}
        <Card className="p-6 flex flex-col h-full">
          <h2 className="text-xl font-semibold mb-4 text-teal-800 dark:text-teal-300 flex items-center gap-2">
            <Bot className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            AI Assistant
          </h2>

          <div className="flex-grow mb-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-y-auto flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="text-center py-10 flex-grow flex flex-col justify-center">
                <Bot className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-600 mb-2 flex-shrink-0" />
                <p className="text-gray-500 dark:text-gray-400">Upload an image to get feedback from the AI assistant.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "ai" && (
                    <Avatar className="h-8 w-8 bg-teal-100 dark:bg-teal-900 shrink-0 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      msg.sender === "user"
                        ? "bg-teal-600 dark:bg-teal-800 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar className="h-8 w-8 bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8 bg-teal-100 dark:bg-teal-900 shrink-0 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                </Avatar>
                <div className="rounded-lg p-3 bg-gray-100 dark:bg-gray-800">
                  <div className="flex gap-1 items-center">
                    <div className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
                    <div className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-100"></div>
                    <div className="h-2 w-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 mt-auto">
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
