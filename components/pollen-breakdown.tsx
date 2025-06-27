import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flower2, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PollenType {
  name: string
  value: number
  level: string
  icon: LucideIcon
  color: string
}

interface PollenBreakdownProps {
  total: number
  level: string
  types: PollenType[]
}

export function PollenBreakdown({ total, level, types }: PollenBreakdownProps) {
  const getPollenLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
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

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center">
            <Flower2 className="w-5 h-5 text-white" />
          </div>
          Pollen Count
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">{total}</div>
          <Badge className={getPollenLevelColor(level)}>{level}</Badge>
        </div>

        <div className="space-y-3">
          {types.map((type, index) => {
            const Icon = type.icon
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-stone-50/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Icon className={cn("w-6 h-6", type.color)} />
                  </div>
                  <span className="font-medium text-gray-800">{type.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{type.value}</div>
                  <Badge className={cn("text-xs", getPollenLevelColor(type.level))}>{type.level}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
