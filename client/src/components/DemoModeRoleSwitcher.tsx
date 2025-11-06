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
  const { isDemoMode, currentRole, setCurrentRole, availableRoles } = useDemoMode();

  if (!isDemoMode) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 border-t">
      <Badge variant="outline" className="bg-blue-50">Demo Mode</Badge>
      <Select value={currentRole} onValueChange={(value) => setCurrentRole(value as UserRole)}>
        <SelectTrigger className="w-[160px] h-8 text-xs">
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
      <span className="text-xs text-muted-foreground">{roleDescriptions[currentRole]}</span>
    </div>
  );
}

