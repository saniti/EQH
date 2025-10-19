import React, { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { SupportedLocale, LOCALE_FORMATS } from "@/lib/i18n";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  formats: typeof LOCALE_FORMATS[SupportedLocale];
  formatDate: (date: Date | string, format?: "date" | "time" | "datetime") => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<SupportedLocale>(
    (user?.locale as SupportedLocale) || "en-GB"
  );

  const updateUserLocale = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Locale updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update locale");
    },
  });

  // Sync locale with i18n and user profile
  useEffect(() => {
    if (user?.locale && user.locale !== locale) {
      setLocaleState(user.locale as SupportedLocale);
      i18n.changeLanguage(user.locale);
    }
  }, [user?.locale]);

  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale, i18n]);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);
    
    // Update user profile if logged in
    if (user) {
      updateUserLocale.mutate({ locale: newLocale });
    }
  };

  const formats = LOCALE_FORMATS[locale];

  const formatDate = (
    date: Date | string,
    format: "date" | "time" | "datetime" = "date"
  ): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = 
      format === "date"
        ? { year: "numeric", month: "2-digit", day: "2-digit" }
        : format === "time"
        ? { hour: "2-digit", minute: "2-digit" }
        : { 
            year: "numeric", 
            month: "2-digit", 
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          };

    return new Intl.DateTimeFormat(formats.numberFormat, options).format(dateObj);
  };

  const formatNumber = (
    value: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return new Intl.NumberFormat(formats.numberFormat, options).format(value);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(formats.numberFormat, {
      style: "currency",
      currency: formats.currencyCode,
    }).format(value);
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        formats,
        formatDate,
        formatNumber,
        formatCurrency,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

