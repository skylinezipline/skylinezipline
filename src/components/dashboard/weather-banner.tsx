import { Sun, Wind, CloudRain, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherBannerProps {
  status: string;
  temp: number;
  wind: number;
  condition: string;
}

export function WeatherBanner({ status, temp, wind, condition }: WeatherBannerProps) {
  const isOpen = status === "OPEN";
  const highWind = wind > 25;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-5 py-3.5",
        isOpen && !highWind
          ? "border-green-200 bg-green-50"
          : "border-yellow-200 bg-yellow-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isOpen && !highWind ? "bg-green-100" : "bg-yellow-100"
          )}
        >
          {condition === "RAIN" ? (
            <CloudRain className="h-5 w-5 text-blue-500" />
          ) : highWind ? (
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          ) : (
            <Sun className="h-5 w-5 text-yellow-500" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            Operations Status:{" "}
            <span
              className={
                isOpen && !highWind ? "text-green-700" : "text-yellow-700"
              }
            >
              {isOpen && !highWind ? "OPEN — All Lines Running" : "CAUTION — High Wind Advisory"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {temp}°F · Wind {wind} mph · {condition.charAt(0) + condition.slice(1).toLowerCase()} skies
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isOpen && !highWind ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
        )}
        <span
          className={cn(
            "text-sm font-semibold",
            isOpen && !highWind ? "text-green-700" : "text-yellow-700"
          )}
        >
          {isOpen && !highWind ? "All Clear" : "Monitor Conditions"}
        </span>
      </div>
    </div>
  );
}
