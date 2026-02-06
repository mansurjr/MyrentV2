import React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface FormSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

export function FormSidebar({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md border-l border-border/50 shadow-2xl p-0 flex flex-col">
        <div className="pb-0">
          <SheetHeader className="mb-0">
            <SheetTitle className="text-2xl font-bold tracking-tight">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-muted-foreground mt-1">
                {description}
              </SheetDescription>
            )}
          </SheetHeader>
        </div>
        <div className="flex-1 overflow-hidden px-6 pt-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
