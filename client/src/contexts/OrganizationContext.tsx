import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface OrganizationContextType {
  selectedOrgId: number | null;
  setSelectedOrgId: (id: number | null) => void;
  organizations: Array<{ id: number; name: string }>;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const { data: organizations, isLoading } = trpc.organizations.list.useQuery();

  // Set first organization as default when loaded
  useEffect(() => {
    if (organizations && organizations.length > 0 && selectedOrgId === null) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrgId,
        setSelectedOrgId,
        organizations: organizations || [],
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}

