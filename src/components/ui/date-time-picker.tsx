"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils/index"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useTranslation } from "react-i18next"
import { uz, uzCyrl } from "date-fns/locale"

export interface DateTimePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  placeholder?: string
  showTime?: boolean
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Sanani tanlang",
  showTime = false,
}: DateTimePickerProps) {
  const { i18n } = useTranslation()
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  const [isOpen, setIsOpen] = React.useState(false)

  const currentLocale = i18n.language === "uz_cyr" ? uzCyrl : uz

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleSelect = (newDate: Date | undefined) => {
    if (!newDate) {
      setSelectedDate(undefined)
      setDate(undefined)
      if (!showTime) setIsOpen(false)
      return
    }

    if (date) {
      newDate.setHours(date.getHours())
      newDate.setMinutes(date.getMinutes())
    }

    setSelectedDate(newDate)
    setDate(newDate)
    

    if (!showTime) {
      setIsOpen(false)
    }
  }

  const handleTimeChange = (type: "hours" | "minutes", value: string) => {
    if (!selectedDate) return

    const newDate = new Date(selectedDate)
    if (type === "hours") {
      newDate.setHours(parseInt(value))
    } else {
      newDate.setMinutes(parseInt(value))
    }

    setSelectedDate(newDate)
    setDate(newDate)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-10 border-border/50 bg-background focus:ring-primary/20 hover:bg-accent/50 transition-colors",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
          <span className="truncate">
            {date ? (
              format(date, showTime ? "PPP HH:mm" : "PPP", { locale: currentLocale })
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex flex-col shadow-xl border-border/40" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={currentLocale}
        />
        {showTime && selectedDate && (
          <div className="p-3 border-t border-border/50 flex flex-col gap-3 bg-muted/20">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Vaqtni tanlang</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Select
                    value={selectedDate.getHours().toString().padStart(2, "0")}
                    onValueChange={(v) => handleTimeChange("hours", v)}
                  >
                    <SelectTrigger className="h-9 w-full text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Select
                    value={selectedDate.getMinutes().toString().padStart(2, "0")}
                    onValueChange={(v) => handleTimeChange("minutes", v)}
                  >
                    <SelectTrigger className="h-9 w-full text-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                          {i.toString().padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
