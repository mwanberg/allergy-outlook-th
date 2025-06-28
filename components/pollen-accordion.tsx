"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Flower2, TreePine, Leaf, Calendar, Palette, Shapes, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatUPI } from "@/lib/pollen-utils"
import type { PollenTypeInfo, PlantInfo } from "@/lib/pollen-utils"

interface PollenAccordionProps {
  pollenTypes: PollenTypeInfo[]
  plants: PlantInfo[]
}

export function PollenAccordion({ pollenTypes, plants }: PollenAccordionProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)

  const getPollenLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "none":
        return "bg-gray-100 text-gray-800"
      case "very low":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "very high":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "TREE":
        return TreePine
      case "GRASS":
        return Leaf
      case "WEED":
        return Flower2
      default:
        return Flower2
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case "TREE":
        return "text-green-600"
      case "GRASS":
        return "text-emerald-600"
      case "WEED":
        return "text-pink-600"
      default:
        return "text-gray-600"
    }
  }

  const getPlantsForType = (typeCode: string) => {
    return plants.filter(
      (plant) => plant.plantDescription?.type === typeCode || (typeCode === "GRASS" && plant.code === "GRAMINALES"),
    )
  }

  const getPluralName = (code: string) => {
    switch (code.toUpperCase()) {
      case "TREE":
        return "Trees"
      case "GRASS":
        return "Grasses"
      case "WEED":
        return "Weeds"
      default:
        return code
    }
  }

  // Image modal component
  const ImageModal = () => {
    if (!selectedImage) return null

    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setSelectedImage(null)}
      >
        <div className="bg-white rounded-xl max-w-sm w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-gray-800">{selectedImage.title}</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelectedImage(null)} className="rounded-full">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🌿</div>
                <p className="text-sm">{selectedImage.title}</p>
                <p className="text-xs mt-1">Image would load here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
              <Flower2 className="w-5 h-5 text-white" />
            </div>
            Pollen Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pollenTypes.map((pollenType) => {
              const Icon = getTypeIcon(pollenType.code)
              const plantsForType = getPlantsForType(pollenType.code)
              const hasPlants = plantsForType.length > 0
              const isZeroUPI = pollenType.indexInfo.value === 0

              const upiValue = pollenType.indexInfo?.value ?? 0
              const upiCategory = pollenType.indexInfo?.category ?? "None"

              // If UPI is 0, render as a non-accordion item
              if (isZeroUPI) {
                return (
                  <div key={pollenType.code} className="border border-stone-100 rounded-xl bg-stone-50/30 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Icon className={cn("w-6 h-6", getTypeColor(pollenType.code))} />
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-gray-800">
                            {getPluralName(pollenType.code)}: {formatUPI(upiValue)} UPI
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "inline-flex items-center rounded-full border font-semibold border-transparent text-xs px-2 py-1",
                            getPollenLevelColor(upiCategory),
                          )}
                        >
                          {upiCategory}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              // Render as accordion for non-zero UPI
              return (
                <Accordion key={pollenType.code} type="multiple">
                  <AccordionItem value={pollenType.code} className="border border-stone-100 rounded-xl bg-stone-50/30">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Icon className={cn("w-6 h-6", getTypeColor(pollenType.code))} />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-gray-800">
                              {getPluralName(pollenType.code)}: {formatUPI(upiValue)} UPI
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {hasPlants && (
                                <span className="text-xs text-gray-600">({plantsForType.length} species)</span>
                              )}
                              {pollenType.inSeason && (
                                <div className="text-xs text-green-600 flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  In Season
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-4">
                          <div
                            className={cn(
                              "inline-flex items-center rounded-full border font-semibold border-transparent text-xs px-2 py-1",
                              getPollenLevelColor(upiCategory),
                            )}
                          >
                            {upiCategory}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-4">
                        {/* Health Recommendations */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center">💡</div>
                            Health Tips
                          </h4>
                          {pollenType.healthRecommendations.map((rec, index) => (
                            <p key={index} className="text-sm text-blue-800">
                              {rec}
                            </p>
                          ))}
                        </div>

                        {/* Plant Species */}
                        {hasPlants && (
                          <div>
                            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                              <Flower2 className="w-4 h-4" />
                              Plant Species ({plantsForType.length})
                            </h4>
                            <div className="space-y-3">
                              {plantsForType.map((plant) => (
                                <div key={plant.code} className="bg-white rounded-lg p-4 border border-stone-100">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h5 className="font-semibold text-gray-800 flex items-center gap-2">
                                        {plant.displayName}
                                        {plant.inSeason && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                                      </h5>
                                      {plant.plantDescription && (
                                        <p className="text-sm text-gray-600 mt-1">{plant.plantDescription.family}</p>
                                      )}
                                    </div>
                                    {plant.indexInfo && (
                                      <div
                                        className={cn(
                                          "inline-flex items-center rounded-full border font-semibold border-transparent text-xs px-2 py-1",
                                          getPollenLevelColor(plant.indexInfo.category),
                                        )}
                                      >
                                        {plant.indexInfo.category}
                                      </div>
                                    )}
                                  </div>

                                  {plant.plantDescription && (
                                    <div className="space-y-3">
                                      {/* Season */}
                                      <div className="flex items-start gap-2">
                                        <Calendar className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">Season: </span>
                                          <span className="text-sm text-gray-600">{plant.plantDescription.season}</span>
                                        </div>
                                      </div>

                                      {/* Special Colors */}
                                      {plant.plantDescription.specialColors !== "None" && (
                                        <div className="flex items-start gap-2">
                                          <Palette className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                          <div>
                                            <span className="text-sm font-medium text-gray-700">Colors: </span>
                                            <span className="text-sm text-gray-600">
                                              {plant.plantDescription.specialColors}
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* Special Shapes */}
                                      <div className="flex items-start gap-2">
                                        <Shapes className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">Shape: </span>
                                          <span className="text-sm text-gray-600">
                                            {plant.plantDescription.specialShapes}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Cross Reactions */}
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">Cross-reactions: </span>
                                          <span className="text-sm text-gray-600">
                                            {plant.plantDescription.crossReaction}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Plant Images */}
                                      {(plant.plantDescription.picture || plant.plantDescription.pictureCloseup) && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                          {plant.plantDescription.picture && (
                                            <div
                                              className="relative h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
                                              onClick={() =>
                                                setSelectedImage({
                                                  url: plant.plantDescription!.picture!,
                                                  title: `${plant.displayName} - Plant View`,
                                                })
                                              }
                                            >
                                              <img
                                                src={plant.plantDescription.picture || "/placeholder.svg"}
                                                alt={`${plant.displayName} - Plant View`}
                                                className="object-cover w-full h-full"
                                                onError={(e: any) => {
                                                  e.target.onerror = null
                                                  e.target.src = "/placeholder-image.png" // Replace with your placeholder image
                                                }}
                                              />
                                            </div>
                                          )}
                                          {plant.plantDescription.pictureCloseup && (
                                            <div
                                              className="relative h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
                                              onClick={() =>
                                                setSelectedImage({
                                                  url: plant.plantDescription!.pictureCloseup!,
                                                  title: `${plant.displayName} - Close-up`,
                                                })
                                              }
                                            >
                                              <img
                                                src={plant.plantDescription.pictureCloseup || "/placeholder.svg"}
                                                alt={`${plant.displayName} - Close-up`}
                                                className="object-cover w-full h-full"
                                                onError={(e: any) => {
                                                  e.target.onerror = null
                                                  e.target.src = "/placeholder-image.png" // Replace with your placeholder image
                                                }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )
            })}
          </div>
        </CardContent>
      </Card>
      <ImageModal />
    </>
  )
}
