import { buttonVariants } from '@affine/admin/components/ui/button';
import { cn } from '@affine/admin/utils';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

import { UserDropdown } from './user-dropdown';

export interface NavProp {
  title: string;
  label?: string;
  icon: LucideIcon;
  variant: 'default' | 'ghost';
}

export function Nav({ links }: { links: NavProp[] }) {
  return (
    <div className="group flex flex-col gap-4 py-2 justify-between flex-grow">
      <nav className="grid gap-1 px-2">
        {links.map((link, index) => (
          <Link
            key={index}
            to="#"
            className={cn(
              buttonVariants({ variant: link.variant, size: 'sm' }),
              link.variant === 'default' &&
                'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
              'justify-start'
            )}
          >
            <link.icon className="mr-2 h-4 w-4" />
            {link.title}
            {link.label && (
              <span
                className={cn(
                  'ml-auto',
                  link.variant === 'default' &&
                    'text-background dark:text-white'
                )}
              >
                {link.label}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <UserDropdown />
    </div>
  );
}
