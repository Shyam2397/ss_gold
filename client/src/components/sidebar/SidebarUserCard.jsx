import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiChevronRight, FiShield } from 'react-icons/fi';
import { cn } from '../../lib/utils';
import { useSidebar } from './SidebarProvider';
import UserAvatar from '../UserInterface/UserAvatar';
import { displayName } from '../../utils/permissions';

/**
 * Account block shown at the bottom of the menu. Links to the user page where the
 * signed in account can be reviewed and the password updated.
 */
export const SidebarUserCard = memo(({ user, isActive, handleNavigation, isMobile = false }) => {
  const { open, setMobileOpen } = useSidebar();

  const username = displayName(user);
  const mustChangePassword = Boolean(user?.mustChangePassword);
  const isExpanded = open || isMobile;
  const active = isActive('/user');
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Staff';

  return (
    <div className="px-1.5 pb-1">
      <Link
        to="/user"
        onClick={(e) => {
          if (handleNavigation) {
            e.preventDefault();
            handleNavigation('/user');
          }
          if (isMobile) setMobileOpen(false);
        }}
        aria-label="Open my account"
        title={isExpanded ? undefined : username}
        className={cn(
          'group flex items-center gap-2 rounded-xl border px-2 py-3 transition-all duration-200 pl-2.5',
          active
            ? 'border-gold/30 bg-gold/15'
            : 'border-transparent hover:border-white/10 hover:bg-white/5'
        )}
      >
        <UserAvatar
          username={username}
          src={user?.profileImage}
          size="sm"
          ringClassName={active ? 'ring-2 ring-gold' : 'ring-2 ring-white/15'}
        />

        {isExpanded && (
          <>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm font-semibold',
                  active ? 'text-white' : 'text-white/80 group-hover:text-white'
                )}
              >
                {username}
              </p>
              <p
                className={cn(
                  'mt-0.5 flex items-center text-xs',
                  mustChangePassword ? 'text-branddanger' : 'text-white/50'
                )}
              >
                {mustChangePassword ? (
                  <>
                    <FiAlertTriangle className="mr-1 h-3 w-3 flex-shrink-0" />
                    Password change pending
                  </>
                ) : (
                  <>
                    <FiShield className="mr-1 h-3 w-3 flex-shrink-0" />
                    {roleLabel}
                  </>
                )}
              </p>
            </div>
            <FiChevronRight
              className={cn(
                'h-4 w-4 flex-shrink-0 transition-colors',
                active ? 'text-gold' : 'text-white/30 group-hover:text-gold'
              )}
            />
          </>
        )}
      </Link>
    </div>
  );
});

export default SidebarUserCard;