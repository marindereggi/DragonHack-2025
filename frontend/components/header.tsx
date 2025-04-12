import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Stethoscope } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-teal-600" />
          <span className="font-bold text-xl text-teal-800">StitchMaster</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-teal-700 font-medium">
            Assessment
          </Link>
          <Link href="/history" className="text-gray-600 hover:text-teal-700 font-medium">
            Progress History
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button>My Account</Button>
        </div>
      </div>
    </header>
  )
}
