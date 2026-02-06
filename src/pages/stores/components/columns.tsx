import type { ColumnDef } from "@tanstack/react-table";
import type { Store } from "../../../types/api-responses";
import { MoreHorizontal, Edit, Trash, Loader2, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useStores } from "../hooks/useStores";
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
  store: Store;
  onEdit: (store: Store) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
const ActionCell = ({ store, onEdit }: ActionCellProps) => {
  const { deleteStore, terminateContract } = useStores();
  const [isOpen, setIsOpen] = useState(false);
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeContract = store.contracts?.find(c => c.isActive);

  const handleDelete = async () => {
    try {
      await deleteStore.mutateAsync(store.id);
      setIsOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error deleting store:", error);
    }
  };

  const handleEmptyStore = async () => {
    if (!activeContract) return;
    try {
      await terminateContract.mutateAsync(activeContract.id);
      setEmptyDialogOpen(false);
      setMenuOpen(false);
    } catch (error) {
      console.error("Error emptying store:", error);
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
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel>Amallar</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              onEdit(store);
              setMenuOpen(false);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            Tahrirlash
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {store.isOccupied && activeContract && (
            <>
              <AlertDialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-orange-600 cursor-pointer focus:bg-orange-50 focus:text-orange-700"
                  >
                    <UserMinus className="mr-2 h-4 w-4" />
                    Do'konni bo'shatish
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Do'konni bo'shatmoqchimisiz?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bu amal natijasida amaldagi shartnoma yakunlanadi va do'kon bo'sh holatga o'tadi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleEmptyStore}
                      className="bg-orange-600 text-white hover:bg-orange-700"
                      disabled={terminateContract.isPending}
                    >
                      {terminateContract.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Bo'shatilmoqda...
                        </>
                      ) : (
                        "Ha, bo'shatish"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DropdownMenuSeparator />
            </>
          )}

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
                  Bu amalni ortga qaytarib bo'lmaydi. Bu do'konga tegishli barcha ma'lumotlar tizimdan o'chiriladi.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteStore.isPending}
                >
                  {deleteStore.isPending ? (
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

export const columns = (onEdit: (store: Store) => void): ColumnDef<Store>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.getValue("id")}</span>,
  },
  {
    accessorKey: "storeNumber",
    header: "Do'kon raqami",
    cell: ({ row }) => (
      <div className="font-medium">
        <Badge 
          variant="outline" 
          className="bg-primary/10 text-primary border-primary/20 text-sm font-bold py-1 px-3 shadow-sm"
        >
          {row.getValue("storeNumber")}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "Section",
    header: "Bo'lim",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.Section?.name || "—"}
      </div>
    ),
  },
  {
    accessorKey: "area",
    header: "Yuza (kv.m)",
    cell: ({ row }) => `${row.getValue("area")} kv.m`,
  },
  {
    accessorKey: "isOccupied",
    header: "Holati",
    cell: ({ row }) => {
      const isOccupied = row.getValue("isOccupied") as boolean;
      return (
        <Badge variant={isOccupied ? "destructive" : "default"} className="font-medium">
          {isOccupied ? "Band" : "Bo'sh"}
        </Badge>
      );
    },
  },
  {
    id: "owner",
    header: "Tadbirkor",
    cell: ({ row }) => {
      const isOccupied = row.original.isOccupied;
      const activeContract = row.original.contracts?.find(c => c.isActive);
      const ownerName = activeContract?.owner?.fullName;

      if (!isOccupied || !ownerName) return "—";

      return (
        <div className="font-medium text-sm">
          {ownerName}
        </div>
      );
    },
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
    id: "actions",
    size: 80,
    cell: ({ row }) => <ActionCell store={row.original} onEdit={onEdit} />,
  },
];
