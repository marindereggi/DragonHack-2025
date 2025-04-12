import type { Metadata } from "next"
import ProgressHistory from "@/components/progress-history"
import Header from "@/components/header"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "Progress History | Surgical Suture Assessment",
  description: "Track your progress and review past suture assessments",
}

export default function HistoryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <section className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-teal-800 dark:text-teal-300">Progress History</h1>
          <p className="text-lg text-foreground/70 max-w-3xl">
            Review your past assessments, track improvements, and identify areas for continued practice.
          </p>
        </section>

        <ProgressHistory />
      </main>
      <Footer />
    </div>
  )
}
