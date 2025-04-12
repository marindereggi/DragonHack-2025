import Link from "next/link"
import { Stethoscope } from "lucide-react"

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Stethoscope className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-xl text-teal-800 dark:text-teal-300">StitchMaster</span>
            </Link>
            <p className="text-foreground/70 text-sm">
              An educational tool that uses computer vision technology to assess suturing techniques.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400">
                  Suturing Techniques
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400">
                  Training Videos
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400">
                  Best Practices
                </Link>
              </li>
              {/* <li>
                <Link href="#" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400">
                  Support
                </Link>
              </li> */}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">About</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-foreground/70 hover:text-teal-700 dark:hover:text-teal-400">
                  Team
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-foreground/70">
          <p>© {new Date().getFullYear()} StitchMaster. All rights reserved.</p>
          <p className="mt-1">
            This tool is designed for educational purposes only and should be used under proper supervision.
          </p>
        </div>
      </div>
    </footer>
  )
}
