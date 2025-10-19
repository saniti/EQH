import { useAuth } from "@/_core/hooks/useAuth";
import { useLocale } from "@/contexts/LocaleContext";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SUPPORTED_LOCALES, SupportedLocale } from "@/lib/i18n";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";


export default function Profile() {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();

  
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    locale: locale,
  });

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("profile.changesSaved"));
    },
    onError: (error) => {
      toast.error(error.message || t("errors.generic"));
    },
  });

  const handleSave = () => {
    const updates: any = {};
    
    if (formData.name !== user?.name) updates.name = formData.name;
    if (formData.email !== user?.email) updates.email = formData.email;
    if (formData.locale !== locale) {
      updates.locale = formData.locale;
      setLocale(formData.locale);
    }

    if (Object.keys(updates).length > 0) {
      updateProfile.mutate(updates);
    } else {
      toast.info("No changes to save");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.personalInfo")}</CardTitle>
          <CardDescription>
            Your basic account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>{t("common.role")}</Label>
              <Input
                value={user?.role === "admin" ? t("users.administrator") : t("users.user")}
                disabled
              />
            </div>
            <div>
              <Label>{t("common.type")}</Label>
              <Input
                value={user?.userType === "veterinarian" ? t("users.veterinarian") : t("users.standard")}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.preferences")}</CardTitle>
          <CardDescription>
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Locale Selection */}
          <div>
            <Label htmlFor="locale">{t("profile.locale")}</Label>
            <Select
              value={formData.locale}
              onValueChange={(value: SupportedLocale) =>
                setFormData({ ...formData, locale: value })
              }
            >
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUPPORTED_LOCALES).map(([code, { name, flag }]) => (
                  <SelectItem key={code} value={code}>
                    {flag} {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Language and date/number formatting
            </p>
          </div>

          {/* Locale Preview */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="text-sm font-medium mb-2">Format Preview</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Date: {new Intl.DateTimeFormat(formData.locale).format(new Date())}</p>
              <p>Time: {new Intl.DateTimeFormat(formData.locale, { hour: "2-digit", minute: "2-digit" }).format(new Date())}</p>
              <p>Number: {new Intl.NumberFormat(formData.locale).format(1234567.89)}</p>
              <p>
                Currency: {new Intl.NumberFormat(formData.locale, {
                  style: "currency",
                  currency: formData.locale === "es" ? "EUR" : formData.locale === "en-AU" ? "AUD" : "GBP"
                }).format(1234.56)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? t("common.loading") : t("profile.saveChanges")}
        </Button>
      </div>
    </div>
  );
}

