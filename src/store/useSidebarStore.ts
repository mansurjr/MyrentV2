import { create } from "zustand"

type SidebarStore = {
  isOpen: boolean
  title: string
  description?: string
  content: React.ReactNode | null
  openSidebar: (params: { title: string; description?: string; content: React.ReactNode }) => void
  closeSidebar: () => void
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  title: "",
  description: "",
  content: null,
  openSidebar: ({ title, description, content }) =>
    set({ isOpen: true, title, description, content }),
  closeSidebar: () => set({ isOpen: false, content: null }),
}))
