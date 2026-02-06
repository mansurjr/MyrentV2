import * as React from "react"
import { useTranslation } from "react-i18next"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"

const data = {
  navMain: [
    {
      title: "nav.main",
      items: [
        {
          title: "nav.dashboard",
          url: "/dashboard",
        },
        {
          title: "nav.statistics",
          url: "/statistics",
        },
        {
          title: "nav.map",
          url: "/map",
        },
      ],
    },
    {
      title: "nav.market_management",
      items: [
        {
          title: "nav.sale_types",
          url: "/sale-types",
        },
        {
          title: "nav.sections",
          url: "/sections",
        },
        {
          title: "nav.owners",
          url: "/owners",
        },
        {
          title: "nav.stores",
          url: "/stores",
        },
        {
          title: "nav.stalls",
          url: "/stalls",
        },
        {
          title: "nav.contracts",
          url: "/contracts",
        },
      ],
    },
    {
      title: "nav.finance",
      items: [
        {
          title: "nav.transactions",
          url: "/transactions",
        },
        {
          title: "nav.reconciliation",
          url: "/reconciliation",
        },
        {
          title: "nav.attendances",
          url: "/attendances",
        },
      ],
    },
    {
      title: "nav.system",
      items: [
        {
          title: "nav.users",
          url: "/users",
        },
      ],
    },
    {
      title: "nav.archive",
      items: [
        {
          title: "nav.owners_archive",
          url: "/owners/archive",
        },
        {
          title: "nav.contracts_archive",
          url: "/contracts/archive",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Sidebar {...props}>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup className="my-0" key={group.title}>
            <SidebarGroupLabel>{t(group.title)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                      <Link to={item.url}>{t(item.title)}</Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
