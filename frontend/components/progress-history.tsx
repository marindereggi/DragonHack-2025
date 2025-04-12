"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Calendar, Clock, BarChart4, FileText, ArrowUpRight, History, LayoutDashboard, Pencil } from "lucide-react"
import { Loader2 } from "lucide-react"
import { ClipboardX } from "lucide-react"

export default function ProgressHistory() {
  const [pastAssessments, setPastAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Pridobi zgodovino ob nalaganju komponente
  useEffect(() => {
    fetchHistory();
  }, []);

  // Funkcija za pridobivanje zgodovine iz API-ja
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/get-history');
      
      if (!response.ok) {
        throw new Error('Error retrieving history');
      }
      
      const data = await response.json();
      
      // Pretvori podatke v obliko, ki jo komponenta uporablja
      const formattedHistory = data.history.map(item => ({
        id: item.id,
        date: new Date(item.timestamp).toLocaleDateString('en-US'),
        time: new Date(item.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit', 
          minute: '2-digit'
        }),
        score: item.score,
        parallelism: item.score > 75, // Za demonstracijo - v pravi aplikaciji bi uporabljali dejanske podatke
        spacing: item.score > 80,     // Za demonstracijo - v pravi aplikaciji bi uporabljali dejanske podatke
        sutureCount: Math.floor(Math.random() * 5) + 5, // Za demonstracijo
        notes: "Assessment notes from the database would be here.",
        imageSrc: item.imageUrl || "/placeholder.svg?height=300&width=400",
        feedback: [
          "Good tension on the suture material.",
          "Spacing is generally consistent but could be improved.",
          "Consider working on maintaining parallel stitches."
        ]
      }));
      
      setPastAssessments(formattedHistory);
      
      // Izberi najnovejšo oceno kot privzeto
      if (formattedHistory.length > 0) {
        setSelectedAssessment(formattedHistory[formattedHistory.length - 1]);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setError("An error occurred while retrieving history. Please try again.");
      setLoading(false);
    }
  };

  // Podatki za grafe
  const scoreData = pastAssessments.map((assessment) => ({
    date: assessment.date,
    score: assessment.score,
  }));

  const attributeData = pastAssessments.map((assessment) => ({
    date: assessment.date,
    parallelism: assessment.parallelism ? 100 : 0,
    spacing: assessment.spacing ? 100 : 0,
  }));

  // Prikaz nalaganja
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading history...</p>
        </div>
      </div>
    );
  }

  // Prikaz napake
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchHistory} variant="outline">Try again</Button>
      </div>
    );
  }

  // Prikaz če ni zgodovine
  if (pastAssessments.length === 0) {
    return (
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <p className="text-gray-600 mb-4">No assessments saved yet. Complete an assessment to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Charts */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 text-teal-800 dark:text-teal-300 flex items-center gap-2">
          <BarChart4 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          Progress Overview
        </h2>

        <Tabs defaultValue="score" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="score">Score Progression</TabsTrigger>
            <TabsTrigger value="attributes">Technique Attributes</TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={scoreData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="date" 
                  className="fill-gray-600 dark:fill-gray-400" 
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="fill-gray-600 dark:fill-gray-400" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0d9488" 
                  strokeWidth={2} 
                  activeDot={{ r: 8 }} 
                  className="dark:stroke-teal-400" 
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="attributes" className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={attributeData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis 
                  dataKey="date" 
                  className="fill-gray-600 dark:fill-gray-400" 
                />
                <YAxis 
                  domain={[0, 100]} 
                  className="fill-gray-600 dark:fill-gray-400" 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }} 
                />
                <Bar 
                  dataKey="parallelism" 
                  name="Parallelism" 
                  fill="#0d9488" 
                  className="dark:fill-teal-600" 
                />
                <Bar 
                  dataKey="spacing" 
                  name="Equal Spacing" 
                  fill="#14b8a6" 
                  className="dark:fill-teal-500" 
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <h3 className="font-medium text-foreground mb-2">Key Insights</h3>
          <ul className="space-y-1 text-sm text-foreground/70">
            <li className="flex items-start gap-2">
              <div className="rounded-full bg-teal-100 dark:bg-teal-900 p-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              </div>
              Your overall score has improved by 19 points since your first assessment.
            </li>
            <li className="flex items-start gap-2">
              <div className="rounded-full bg-teal-100 dark:bg-teal-900 p-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              </div>
              You've consistently maintained good parallelism in your sutures.
            </li>
            <li className="flex items-start gap-2">
              <div className="rounded-full bg-teal-100 dark:bg-teal-900 p-1 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-teal-600 dark:text-teal-400" />
              </div>
              Your spacing technique has shown significant improvement after your second session.
            </li>
          </ul>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List of Past Assessments */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="p-4 bg-muted/50 border-b">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Past Assessments
              </h3>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-2" />
                  <p className="text-muted-foreground">Loading assessments...</p>
                </div>
              ) : pastAssessments.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground mb-1">No assessments found</p>
                  <p className="text-sm text-muted-foreground">
                    Complete an assessment to see your history
                  </p>
                </div>
              ) : (
                pastAssessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${
                      selectedAssessment?.id === assessment.id ? "bg-muted/40" : ""
                    }`}
                    onClick={() => setSelectedAssessment(assessment)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{assessment.date}</span>
                          <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                          <span className="text-sm text-muted-foreground">{assessment.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${
                              assessment.score >= 80 
                                ? "bg-green-500 dark:bg-green-600" 
                                : assessment.score >= 70 
                                  ? "bg-yellow-500 dark:bg-yellow-600" 
                                  : "bg-red-500 dark:bg-red-600"
                            }`}
                          >
                            Score: {assessment.score}
                          </Badge>
                          <Badge variant="outline" className="border-border text-foreground/70">
                            {assessment.sutureCount} sutures
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Badge
                          variant="outline"
                          className={`${
                            assessment.parallelism
                              ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20"
                              : "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
                          }`}
                        >
                          {assessment.parallelism ? "Parallel" : "Non-parallel"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${
                            assessment.spacing
                              ? "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20"
                              : "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
                          }`}
                        >
                          {assessment.spacing ? "Even spacing" : "Uneven spacing"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Assessment Details */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          {!selectedAssessment ? (
            <div className="bg-card border rounded-lg p-8 h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">No Assessment Selected</h3>
                <p className="text-muted-foreground mb-6">
                  Select an assessment from the list to view detailed information and analysis.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-card border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-4">Assessment Details</h3>

              <div className="relative h-48 mb-4 rounded overflow-hidden">
                <Image
                  src={selectedAssessment.imageSrc || "/placeholder.svg"}
                  alt={`Suture assessment from ${selectedAssessment.date}`}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart4 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h4 className="font-medium text-foreground">Score Breakdown</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Overall Score:</span>{" "}
                      <span className="font-medium text-foreground">{selectedAssessment.score}/100</span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Suture Count:</span>{" "}
                      <span className="font-medium text-foreground">{selectedAssessment.sutureCount}</span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Parallelism:</span>{" "}
                      <span
                        className={`font-medium ${selectedAssessment.parallelism ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {selectedAssessment.parallelism ? "Passed" : "Failed"}
                      </span>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <span className="text-muted-foreground">Equal Spacing:</span>{" "}
                      <span
                        className={`font-medium ${selectedAssessment.spacing ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {selectedAssessment.spacing ? "Passed" : "Failed"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h4 className="font-medium text-foreground">Feedback</h4>
                  </div>
                  <div className="bg-muted/50 p-3 rounded text-sm">
                    <ul className="list-disc list-inside space-y-1 text-foreground/90">
                      {selectedAssessment.feedback && selectedAssessment.feedback.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {selectedAssessment.notes && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Pencil className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <h4 className="font-medium text-foreground">Personal Notes</h4>
                    </div>
                    <div className="bg-muted/50 p-3 rounded text-sm text-foreground/90">
                      <p>{selectedAssessment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
