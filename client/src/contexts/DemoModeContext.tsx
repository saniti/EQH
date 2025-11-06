import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'user' | 'administrator' | 'veterinarian' | 'trainer' | 'owner';

interface DemoModeContextType {
  isDemoMode: boolean;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  availableRoles: UserRole[];
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('user');

  // Check if we're in demo mode on mount
  useEffect(() => {
    const isDemo = localStorage.getItem('demo-mode') === 'true';
    setIsDemoMode(isDemo);
    
    if (isDemo) {
      const savedRole = localStorage.getItem('demo-role') as UserRole | null;
      if (savedRole && availableRoles.includes(savedRole)) {
        setCurrentRole(savedRole);
      }
    }
  }, []);

  // Save role changes to localStorage
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem('demo-role', currentRole);
    }
  }, [currentRole, isDemoMode]);

  const availableRoles: UserRole[] = ['user', 'administrator', 'veterinarian', 'trainer', 'owner'];

  return (
    <DemoModeContext.Provider
      value={{
        isDemoMode,
        currentRole,
        setCurrentRole,
        availableRoles,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within DemoModeProvider');
  }
  return context;
}

