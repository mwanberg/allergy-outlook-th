import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
}

interface WeatherWidgetProps {
  weather: WeatherData
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Weather Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl mb-1">🌡️</div>
            <div className="font-semibold text-gray-800">{weather.temperature}°F</div>
            <div className="text-xs text-gray-500">Temperature</div>
          </div>
          <div>
            <div className="text-3xl mb-1">💧</div>
            <div className="font-semibold text-gray-800">{weather.humidity}%</div>
            <div className="text-xs text-gray-500">Humidity</div>
          </div>
          <div>
            <div className="text-3xl mb-1">💨</div>
            <div className="font-semibold text-gray-800">{weather.windSpeed} mph</div>
            <div className="text-xs text-gray-500">Wind Speed</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
