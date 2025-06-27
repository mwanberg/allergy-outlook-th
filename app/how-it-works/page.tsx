import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Wind, ExternalLink, Flower2, TreePine, Leaf } from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
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

        {/* How It Works Content */}
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">How This App Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-600">
              AirBuddy helps you stay informed about pollen levels in your area so you can plan your outdoor activities
              and manage allergies effectively.
            </p>

            {/* Data Sources Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">📊</div>
                Data Sources
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-gray-700">Our pollen and location data comes from reliable Google Maps services:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-800">Google Maps Pollen API</strong>
                      <p className="text-sm text-gray-600">
                        Provides detailed pollen information including plant species data
                      </p>
                      <a
                        href="https://developers.google.com/maps/documentation/pollen"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 mt-1"
                      >
                        Learn more <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <strong className="text-gray-800">Google Maps Geocoding API</strong>
                      <p className="text-sm text-gray-600">
                        Converts addresses to coordinates and provides location search functionality
                      </p>
                      <a
                        href="https://developers.google.com/maps/documentation/geocoding"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1 mt-1"
                      >
                        Learn more <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Understanding Pollen Types */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Flower2 className="w-6 h-6 text-amber-600" />
                Understanding Pollen Types
              </h3>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TreePine className="w-6 h-6 text-green-600" />
                      <h4 className="font-semibold text-gray-800">Tree Pollen</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Common in spring. Includes oak, birch, maple, and pine. Often causes the most severe allergic
                      reactions.
                    </p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Leaf className="w-6 h-6 text-emerald-600" />
                      <h4 className="font-semibold text-gray-800">Grass Pollen</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Peak season is late spring through summer. Includes common grasses found in lawns and fields.
                    </p>
                  </div>

                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Flower2 className="w-6 h-6 text-pink-600" />
                      <h4 className="font-semibold text-gray-800">Weed Pollen</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      Most common in late summer and fall. Ragweed is the biggest culprit, but includes many other
                      weeds.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* UPI Scale */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Universal Pollen Index (UPI)</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  The Universal Pollen Index measures pollen concentration on a scale from 0 to 5+:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-gray-100 rounded text-xs flex items-center justify-center font-medium">
                      0
                    </div>
                    <span className="text-sm text-gray-600">None - No pollen detected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-blue-100 text-blue-800 rounded text-xs flex items-center justify-center font-medium">
                      0-1
                    </div>
                    <span className="text-sm text-gray-600">Very Low - Minimal symptoms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-green-100 text-green-800 rounded text-xs flex items-center justify-center font-medium">
                      1-2
                    </div>
                    <span className="text-sm text-gray-600">Low - Mild symptoms possible</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center justify-center font-medium">
                      2-3
                    </div>
                    <span className="text-sm text-gray-600">Moderate - Noticeable symptoms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-orange-100 text-orange-800 rounded text-xs flex items-center justify-center font-medium">
                      3-4
                    </div>
                    <span className="text-sm text-gray-600">High - Significant symptoms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-6 bg-red-100 text-red-800 rounded text-xs flex items-center justify-center font-medium">
                      4+
                    </div>
                    <span className="text-sm text-gray-600">Very High - Severe symptoms</span>
                  </div>
                </div>
              </div>
            </section>

            {/* How We Calculate Average UPI */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">🧮</div>
                How We Calculate Your Overall Pollen Count
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <p className="text-gray-700">
                  The Google Maps Pollen API provides individual UPI values for each pollen type (Trees, Grasses,
                  Weeds), but doesn't give us a single "overall" pollen count. Here's how we create that number for you:
                </p>

                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Our Calculation Method:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <div>
                        <strong>Get individual values:</strong> We receive separate UPI values for Trees, Grasses, and
                        Weeds from the API
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <div>
                        <strong>Add them together:</strong> We sum all three pollen type values
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <div>
                        <strong>Calculate average:</strong> We divide by 3 to get the average UPI across all pollen
                        types
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        4
                      </span>
                      <div>
                        <strong>Round for clarity:</strong> We round to one decimal place for easy reading
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-100 rounded-lg p-3 border border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
                    <span>💡</span> Example Calculation
                  </h4>
                  <p className="text-sm text-amber-800">
                    If Trees = 1.5 UPI, Grasses = 2.0 UPI, and Weeds = 0.5 UPI
                    <br />
                    Overall UPI = (1.5 + 2.0 + 0.5) ÷ 3 = <strong>1.3 UPI</strong>
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  <strong>Why we do this:</strong> Having a single number makes it easier to quickly understand your
                  overall pollen exposure at a glance, while still providing detailed breakdowns for each pollen type
                  below.
                </p>
              </div>
            </section>

            {/* Tips Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Managing Pollen Allergies</h3>
              <div className="bg-amber-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    Check pollen levels before planning outdoor activities
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    Keep windows closed during high pollen days
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    Shower and change clothes after spending time outdoors
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    Consider taking allergy medication before symptoms start
                  </li>
                </ul>
              </div>
            </section>

            {/* Placeholder for future images */}
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Visual Guide</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-2">🌳</div>
                  <p className="text-sm text-gray-600">Tree pollen identification guide</p>
                  <p className="text-xs text-gray-500 mt-1">(Image placeholder)</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="text-4xl mb-2">🌾</div>
                  <p className="text-sm text-gray-600">Grass pollen seasonal chart</p>
                  <p className="text-xs text-gray-500 mt-1">(Image placeholder)</p>
                </div>
              </div>
            </section>
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
