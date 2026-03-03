"use client";

import { Bell, Sun, Wind, CloudRain, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export function Topbar({ title, subtitle }: TopbarProps) {
  // Mock weather — in production fetch from weather API
  const weather = {
    condition: "clear",
    temp: 72,
    wind: 8,
    status: "OPERATIONAL",
  };

  const weatherIcon =
    weather.wind > 25 ? (
      <Wind className="h-4 w-4 text-yellow-500" />
    ) : weather.condition === "rain" ? (
      <CloudRain className="h-4 w-4 text-blue-400" />
    ) : (
      <Sun className="h-4 w-4 text-yellow-400" />
    );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-white/95 backdrop-blur px-6 shadow-sm">
      {/* Title */}
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings, guests..."
          className="w-64 pl-8 text-sm"
        />
      </div>

      {/* Weather pill */}
      <div className="hidden items-center gap-1.5 rounded-full border bg-slate-50 px-3 py-1.5 text-xs font-medium sm:flex">
        {weatherIcon}
        <span>{weather.temp}°F</span>
        <span className="text-muted-foreground">·</span>
        <Wind className="h-3 w-3 text-muted-foreground" />
        <span>{weather.wind} mph</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-green-600 font-semibold">{weather.status}</span>
      </div>

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
        >
          2
        </Badge>
      </Button>

      {/* Avatar */}
      <button className="flex h-9 w-9 items-center justify-center rounded-full bg-skyline-600 text-sm font-semibold text-white">
        MT
      </button>
    </header>
  );
}
