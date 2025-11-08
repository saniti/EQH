import { useDemoMode, type UserRole } from '@/contexts/DemoModeContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const roleLabels: Record<UserRole, string> = {
  user: 'User',
  administrator: 'Administrator',
  veterinarian: 'Veterinarian',
  trainer: 'Trainer',
  owner: 'Owner',
};

const roleDescriptions: Record<UserRole, string> = {
  user: 'Standard user access',
  administrator: 'Full admin access',
  veterinarian: 'Veterinary professional access',
  trainer: 'Horse trainer access',
  owner: 'Horse owner access',
};

export function DemoModeRoleSwitcher() {
  const { isDemoMode, currentRole, setCurrentRole, setIsDemoMode, availableRoles } = useDemoMode();

  return (
    <div className="px-3 py-2 border-t space-y-2">
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={`cursor-pointer ${isDemoMode ? 'bg-blue-50' : 'bg-gray-50'}`}
          onClick={() => setIsDemoMode(!isDemoMode)}
        >
          {isDemoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF'}
        </Badge>
      </div>
      {isDemoMode && (
        <div className="space-y-2">
          <Select value={currentRole} onValueChange={(value) => setCurrentRole(value as UserRole)}>
            <SelectTrigger className="w-full h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((role) => (
                <SelectItem key={role} value={role} className="text-xs">
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{roleDescriptions[currentRole]}</p>
        </div>
      )}
    </div>
  );
}
