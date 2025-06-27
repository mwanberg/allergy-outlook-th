import { DebugPanel } from "@/components/debug-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Wind } from "lucide-react"
import Link from "next/link"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-stone-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pt-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AirBuddy
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">AirBuddy Debug</h1>
          </div>
        </div>

        <DebugPanel />
      </div>
    </div>
  )
}
