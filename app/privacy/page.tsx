import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Wind } from "lucide-react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-green-50 to-stone-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
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
            <h1 className="text-lg font-bold text-gray-800">AirBuddy</h1>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-4">
            <p className="text-gray-600">
              <em>Last updated: {new Date().toLocaleDateString()}</em>
            </p>

            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Information We Collect</h3>
                <p className="text-gray-600">
                  AirBuddy is designed with privacy in mind. We collect minimal information to provide you with accurate
                  pollen and air quality data.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  <li>Location data (only when you provide it or grant permission)</li>
                  <li>App usage analytics (anonymized)</li>
                  <li>Device information for app optimization</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
                <p className="text-gray-600">
                  Your information is used solely to provide personalized pollen and air quality information for your
                  area.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Sharing</h3>
                <p className="text-gray-600">
                  We do not sell, trade, or share your personal information with third parties except as necessary to
                  provide our services.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Storage</h3>
                <p className="text-gray-600">
                  Location preferences are stored locally on your device. We use secure, encrypted connections for all
                  data transmission.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Your Rights</h3>
                <p className="text-gray-600">
                  You have the right to access, update, or delete your information at any time. You can also opt out of
                  location services through your device settings.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Us</h3>
                <p className="text-gray-600">
                  If you have questions about this privacy policy, please contact us at privacy@airbuddy.app
                </p>
              </section>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pb-4">
          <Link href="/" className="hover:text-gray-700 underline">
            Return to AirBuddy
          </Link>
        </div>
      </div>
    </div>
  )
}
