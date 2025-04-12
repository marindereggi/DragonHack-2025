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
import { Upload, Loader2, Check, X, Bot, User, Send, Save, Microscope, Maximize2, RotateCcw } from "lucide-react"
import { useChat, Message } from "@ai-sdk/react"

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

export default function StitchMaster() {
  const router = useRouter()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string>("")
  const [analysis, setAnalysis] = useState<SutureAnalysis | null>(null)
  const [notes, setNotes] = useState<string>("")
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    onError: (error) => {
      console.error("Chat API error:", error);
    }
  });
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null)

  // Add this useEffect to handle ESC key press for full screen mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullScreen) {
        closeFullScreen();
      }
    };

    if (isFullScreen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullScreen]);

  // Add useEffect for debug logging
  useEffect(() => {
    console.log("Current messages:", messages);
  }, [messages]);

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
            data.analysis.sutures.forEach((suture: Suture) => {
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

            // Add initial AI messages for analysis feedback
            const initialMessages: Message[] = [
              {
                id: "1",
                role: "assistant",
                content: "I've analyzed your suture image and here are the results:",
              },
              {
                id: "2",
                role: "assistant",
                content: `• Sutures detected: ${data.analysis.sutureCount}\n• Parallel sutures: ${data.analysis.isParallel ? "Yes" : "No"}\n• Equal spacing: ${data.analysis.isEquallySpaced ? "Yes" : "No"}\n• Overall score: ${data.analysis.score}/100`,
              },
              {
                id: "3",
                role: "assistant",
                content: data.analysis.feedback.join("\n"),
              },
              {
                id: "4",
                role: "assistant",
                content:
                  "Do you have any questions about the assessment or would you like specific advice on how to improve?",
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
              role: "assistant", 
              content: "An error occurred while analyzing the image. Please try uploading a different image.",
            },
          ] as Message[]);
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
            role: "assistant", 
            content: "An error occurred while analyzing the image. Please try uploading a different image.",
          },
        ] as Message[]);
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

  const openFullScreen = (imageUrl: string) => {
    setFullScreenImage(imageUrl)
    setIsFullScreen(true)
  }

  const closeFullScreen = () => {
    setIsFullScreen(false)
    setFullScreenImage(null)
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
            {...(processedImage ? {} : getRootProps())}
            className={cn(
              "border-2 rounded-lg p-6 flex flex-col items-center justify-center transition-colors flex-grow",
              processedImage
                ? "border-gray-300 dark:border-gray-700 bg-gray-50/20 dark:bg-gray-900/10"  // Changed from teal to gray
                : isDragActive
                  ? "border-dashed border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-950/20"
                  : "border-dashed border-gray-300 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-400 cursor-pointer",
            )}
          >
            {!processedImage && <input {...getInputProps()} disabled={isProcessing} />}

            {originalImage && !processedImage ? (
              <div className="relative w-full h-[400px] flex-shrink-0 group">
                <Image
                  src={originalImage || "/placeholder.svg"}
                  alt="Original suture image"
                  fill
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-start justify-end p-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFullScreen(originalImage);
                    }}
                    size="sm"
                    variant="ghost"
                    className="opacity-40 hover:opacity-100 transition-opacity p-1 h-auto bg-black/10 backdrop-blur-sm"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-white" />
                  </Button>
                </div>
              </div>
            ) : processedImage ? (
              <div className="relative w-full h-[400px] flex-shrink-0 group">
                <Image
                  src={processedImage || "/placeholder.svg"}
                  alt="Analyzed suture image"
                  fill
                  className="object-contain"
                />
                <div className="absolute inset-0 flex items-start justify-end p-1">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      openFullScreen(processedImage);
                    }}
                    size="sm"
                    variant="ghost"
                    className="opacity-40 hover:opacity-100 transition-opacity p-1 h-auto bg-black/10 backdrop-blur-sm"
                  >
                    <Maximize2 className="h-3.5 w-3.5 text-white" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center h-[400px] flex flex-col items-center justify-center">
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
                    className={`h-2.5 rounded-full ${analysis.score >= 80
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

          {processedImage && (
            <Button
              onClick={() => {
                setProcessedImage(null);
                setOriginalImage(null);
                setAnalysis(null);
                setMessages([]);
              }}
              variant="outline"
              className="mt-4 text-sm"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2 text-gray-700 dark:text-gray-300" />
              <div className="text-gray-700 dark:text-gray-300">
              Clear
              </div>
            </Button>
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
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="h-8 w-8 bg-teal-100 dark:bg-teal-900 shrink-0 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </Avatar>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${msg.role === "user"
                      ? "bg-teal-600 dark:bg-teal-800 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="h-8 w-8 bg-gray-200 dark:bg-gray-700 shrink-0 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Avatar>
                  )}
                </div>
              ))
            )}
            {isLoading && (
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

          <form onSubmit={(e) => {
            console.log("Form submitted");
            handleSubmit(e);
          }} className="flex gap-2 mt-auto">
            <Input
              placeholder="Ask for feedback or advice..."
              value={input}
              onChange={(e) => {
                console.log("Input changed:", e.target.value);
                handleInputChange(e);
              }}
              disabled={!analysis || isLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || !analysis}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </Card>
      </div>

      {/* Full screen image modal */}
      {isFullScreen && fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center" onClick={closeFullScreen}>
          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh]">
            <Image
              src={fullScreenImage}
              alt="Full screen image"
              fill
              className="object-contain"
            />
            <Button
              onClick={closeFullScreen}
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4 opacity-80 hover:opacity-100"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
