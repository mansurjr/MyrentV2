import type { ColumnDef } from "@tanstack/react-table";
import type { Section } from "../../../types/api-responses";
import { MoreHorizontal, Edit, Trash, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSections } from "../hooks/useSections";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActionCellProps {
  section: Section;
  onEdit: (section: Section) => void;
}

const ActionCell = ({ section, onEdit }: ActionCellProps) => {
  const { deleteSection } = useSections();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteSection.mutateAsync(section.id);
      setIsOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error deleting section:", error);
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
          <DropdownMenuItem
            onClick={() => {
              onEdit(section);
              setMenuOpen(false);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                O'chirish
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Haqiqatan ham o'chirmoqchimisiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu amalni ortga qaytarib bo'lmaydi. Bu bo'limga tegishli barcha ma'lumotlar tizimdan o'chiriladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteSection.isPending}
                >
                  {deleteSection.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      O'chirilmoqda...
                    </>
                  ) : (
                    "Ha, o'chirish"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const columns = (onEdit: (section: Section) => void): ColumnDef<Section>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "name",
    header: "Bo'lim nomi",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: "Tavsif",
    cell: ({ row }) => {
      const desc = row.getValue("description") as string;
      return (
        <div className="text-muted-foreground">
          {desc || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "assignedChecker",
    header: "Tekshiruvchi",
    cell: ({ row }) => {
      const checker = row.original.assignedChecker;
      if (!checker) return <span className="text-muted-foreground italic">Biriktirilmagan</span>;
      return `${checker.firstName || ''} ${checker.lastName || ''}`.trim();
    },
  },
  {
    id: "actions",
    size: 150,
    cell: ({ row }) => <ActionCell section={row.original} onEdit={onEdit} />,
  },
];
