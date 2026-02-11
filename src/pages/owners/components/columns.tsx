import type { ColumnDef } from "@tanstack/react-table";
import type { Owner } from "../../../types/api-responses";
import { MoreHorizontal, Edit, RefreshCw, Archive as ArchiveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useOwners } from "../hooks/useOwners";
import { useState } from "react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { OwnerForm } from "./OwnerForm";
import { format } from "date-fns";

export const getColumns = (isArchived: boolean = false): ColumnDef<Owner>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground">
        {row.getValue("id")}
      </span>
    ),
  },
  {
    accessorKey: "fullName",
    header: "F.I.O",
    minSize: 400,
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("fullName")}</div>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Telefon",
    cell: ({ row }) => row.getValue("phoneNumber") || "—",
  },
  {
    accessorKey: "tin",
    header: "STIR (TIN)",
  },
  {
    accessorKey: "address",
    header: "Manzil",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return <div className="text-muted-foreground">{address || "—"}</div>;
    },
  },
  ...(isArchived ? [
    {
      id: "archivedInfo",
      header: "Arxiv ma'lumotlari",
      cell: ({ row }: { row: any }) => {
        const owner = row.original;
        return (
          <div className="text-xs space-y-1">
            {owner.archivedBy && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Kim:</span> {owner.archivedBy.firstName} {owner.archivedBy.lastName}
              </p>
            )}
            {owner.archivedAt && (
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Qachon:</span> {format(new Date(owner.archivedAt), "dd.MM.yyyy HH:mm")}
              </p>
            )}
          </div>
        );
      },
    }
  ] : []),

  {
    id: "actions",
    size: 150,
    cell: ({ row }) => {
      const owner = row.original;
      const { deleteOwner, updateOwner } = useOwners();
      const { openSidebar, closeSidebar } = useSidebarStore();
      const [menuOpen, setMenuOpen] = useState(false);

      const handleEdit = () => {
        openSidebar({
          title: "Egani tahrirlash",
          content: (
            <OwnerForm
              owner={owner}
              onSuccess={() => {
                closeSidebar();
                setMenuOpen(false);
              }}
              onCancel={closeSidebar}
            />
          ),
        });
      };

      const handleRestore = async () => {
        try {
          await updateOwner.mutateAsync({ id: owner.id, dto: { isActive: true } });
          setMenuOpen(false);
        } catch (error) {
          console.error("Error restoring owner:", error);
        }
      };

      const handleArchive = async () => {
        try {
          await deleteOwner.mutateAsync(owner.id);
          setMenuOpen(false);
        } catch (error) {
          console.error("Error archiving owner:", error);
        }
      };

      return (
        <div className="flex items-center justify-end">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Amallar</DropdownMenuLabel>
              {!isArchived ? (
                <>
                  <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                    <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                    Tahrirlash
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchive} className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                    <ArchiveIcon className="mr-2 h-4 w-4" />
                    Arxivlash
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={handleRestore} className="cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tiklash
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
