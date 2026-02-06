import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useOwners } from "./hooks/useOwners";
import type { ICreateOwnerDto } from "./hooks/useOwners";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

export default function OwnerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { useGetOwner, createOwner, updateOwner } = useOwners();
  const { data: owner, isLoading: isLoadingOwner } = useGetOwner(Number(id) || 0);

  const [formData, setFormData] = useState<ICreateOwnerDto>({
    fullName: "",
    address: "",
    tin: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (owner) {
      setFormData({
        fullName: owner.fullName,
        address: owner.address || "",
        tin: owner.tin,
        phoneNumber: owner.phoneNumber || "",
      });
    }
  }, [owner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateOwner.mutateAsync({ id: Number(id), dto: formData });
      } else {
        await createOwner.mutateAsync(formData);
      }
      navigate("/owners");
    } catch (error) {
      console.error("Error saving owner:", error);
    }
  };

  if (isEdit && isLoadingOwner) {
    return (
      <div className="flex h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSubmitting = createOwner.isPending || updateOwner.isPending;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/owners")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? "Egani tahrirlash" : "Yangi ega qo'shish"}
        </h1>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>{isEdit ? "Ega ma'lumotlari" : "Ma'lumotlarni to'ldiring"}</CardTitle>
          <CardDescription>
            {isEdit 
              ? "Mavjud ega ma'lumotlarini o'zgartirishingiz mumkin." 
              : "Yangi do'kon egasini ro'yxatdan o'tkazish uchun quyidagi maydonlarni to'ldiring."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">F.I.O (To'liq ism)</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Masalan: Eshmatov Toshmat"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tin">STIR (TIN)</Label>
                <Input
                  id="tin"
                  name="tin"
                  placeholder="9 xonali son"
                  value={formData.tin}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefon raqami</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+998 90 123 45 67"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Manzil</Label>
              <Input
                id="address"
                name="address"
                placeholder="Yashash yoki ish manzili"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 bg-muted/30 pt-6">
            <Button type="button" variant="outline" onClick={() => navigate("/owners")}>
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-30">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saqlanmoqda...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Saqlash
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
