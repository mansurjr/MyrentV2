import type { ColumnDef } from "@tanstack/react-table";
import type { User } from "../../../types/api-responses";
import { MoreHorizontal, Edit, Trash, Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUsers } from "../hooks/useUsers";
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
import { cn } from "@/lib/utils";

interface ActionCellProps {
  user: User;
  onEdit: (user: User) => void;
}

const ActionCell = ({ user, onEdit }: ActionCellProps) => {
  const { deleteUser, updateUser } = useUsers();
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteUser.mutateAsync(user.id);
      setIsOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        dto: { isActive: !user.isActive },
      });
      setMenuOpen(false);
    } catch (error) {
      console.error("Error toggling status:", error);
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
              onEdit(user);
              setMenuOpen(false);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Tahrirlash
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleToggleStatus} className="cursor-pointer">
            <Power className={cn("mr-2 h-4 w-4", user.isActive ? "text-destructive" : "text-emerald-500")} />
            {user.isActive ? "Faolsizlantirish" : "Faollashtirish"}
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
                  Bu amalni ortga qaytarib bo'lmaydi. Bu foydalanuvchiga tegishli barcha ma'lumotlar tizimdan o'chiriladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteUser.isPending}
                >
                  {deleteUser.isPending ? (
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

export const columns = (onEdit: (user: User) => void): ColumnDef<User>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "firstName",
    header: "F.I.O",
    cell: ({ row }) => {
      const first = row.original.firstName || "";
      const last = row.original.lastName || "";
      const fullName = first || last ? `${first} ${last}`.trim() : "—";
      return (
        <div className="font-medium">
          {fullName}
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {row.getValue("email")}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.original.role;
      if (role === "SUPERADMIN") return null;
      const roleName = role === "CHECKER" ? "Tekshiruvchi" : "Admin";
      return <Badge variant="outline">{roleName}</Badge>;
    },
  },
  {
    accessorKey: "isActive",
    header: "Holati",
    cell: ({ row }) => {
      const isActive = row.original.isActive;
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "Faol" : "Nofaol"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    size: 150,
    cell: ({ row }) => <ActionCell user={row.original} onEdit={onEdit} />,
  },
];
