import Link from "next/link"
import { Stethoscope } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Stethoscope className="h-6 w-6 text-teal-600" />
              <span className="font-bold text-xl text-teal-800">SutureAssess</span>
            </Link>
            <p className="text-gray-600 text-sm">
              Advanced suture assessment and feedback powered by computer vision technology.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-800">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Suturing Techniques
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Training Videos
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Best Practices
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-gray-800">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Our Technology
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Research
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-gray-600 hover:text-teal-700">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} SutureAssess. All rights reserved.</p>
          <p className="mt-1">
            This tool is designed for educational purposes only and should be used under proper supervision.
          </p>
        </div>
      </div>
    </footer>
  )
}
