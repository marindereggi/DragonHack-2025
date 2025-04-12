import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Stethoscope } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Header() {
  return (
    <header className="border-b bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <span className="font-bold text-xl text-teal-800 dark:text-teal-300">StitchMaster</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400 font-medium">
            Assessment
          </Link>
          <Link href="/history" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400 font-medium">
            Progress History
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button>My Account</Button>
        </div>
      </div>
    </header>
  )
}
