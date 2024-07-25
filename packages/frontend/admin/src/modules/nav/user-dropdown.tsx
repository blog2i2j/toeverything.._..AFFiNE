import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@affine/admin/components/ui/avatar';
import { Button } from '@affine/admin/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@affine/admin/components/ui/dropdown-menu';
import { useQuery } from '@affine/core/hooks/use-query';
import { FeatureType, getCurrentUserFeaturesQuery } from '@affine/graphql';
import { CircleUser, MoreVertical } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function UserDropdown() {
  const {
    data: { currentUser },
  } = useQuery({
    query: getCurrentUserFeaturesQuery,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/admin/auth');
      return;
    }
    if (!currentUser?.features.includes?.(FeatureType.Admin)) {
      toast.error('You are not an admin, please login the admin account.');
      navigate('/admin/auth');
      return;
    }
  }, [currentUser, navigate]);

  return (
    <div className="flex items-center justify-between px-4 py-3 flex-nowrap">
      <div className="flex items-center gap-2  font-medium text-ellipsis break-words overflow-hidden">
        <Avatar className="w-6 h-6">
          <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
          <AvatarFallback>
            <CircleUser size={24} />
          </AvatarFallback>
        </Avatar>
        {currentUser?.name ? (
          <span className="text-sm text-nowrap text-ellipsis break-words overflow-hidden">
            {currentUser?.name}
          </span>
        ) : (
          // Fallback to email prefix if name is not available
          <span className="text-sm">{currentUser?.email.split('@')[0]}</span>
        )}
        <span
          className="rounded p-1 text-xs"
          style={{
            backgroundColor: 'rgba(30, 150, 235, 0.20)',
            color: 'rgba(30, 150, 235, 1)',
          }}
        >
          Admin
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="ml-2 p-1 h-6">
            <MoreVertical size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{currentUser?.name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
