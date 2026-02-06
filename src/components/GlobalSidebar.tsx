import { useSidebarStore } from "@/store/useSidebarStore"
import { FormSidebar } from "./FormSidebar"

export function GlobalSidebar() {
  const { isOpen, title, description, content, closeSidebar } = useSidebarStore()

  return (
    <FormSidebar
      open={isOpen}
      onOpenChange={(open) => !open && closeSidebar()}
      title={title}
      description={description}
    >
      {content}
    </FormSidebar>
  )
}
