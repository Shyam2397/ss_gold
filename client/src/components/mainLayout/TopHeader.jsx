import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiBell, FiChevronDown, FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import { cn } from '../../lib/utils';
import { useUser } from '../UserInterface/UserContext';
import UserAvatar from '../UserInterface/UserAvatar';
import { displayName } from '../../utils/permissions';

const TopHeader = ({ setLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, canAccess, signOut } = useUser();

  const [now, setNow] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const rightClusterRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  // Close the dropdowns on any click outside the header's right cluster
  useEffect(() => {
    const onPointerDown = (event) => {
      if (rightClusterRef.current && !rightClusterRef.current.contains(event.target)) {
        setMenuOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const name = displayName(user);
  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Staff';
  const canOpenSettings = canAccess('/settings');

  const formattedDate = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const go = (path) => {
    setMenuOpen(false);
    setNotifOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut();
    setLoggedIn?.(false);
  };

  return (
    <header className="relative z-30 flex h-16 flex-shrink-0 items-center gap-3 border-b border-hairline bg-white px-4 pl-16 sm:px-6 md:pl-6">
      <p className="min-w-0 truncate text-xs font-semibold text-gold-dark sm:text-sm">
        Accurate Testing <span className="mx-1 font-normal text-gold-dark">|</span> Trusted results
        <span className="mx-1 font-normal text-gold-dark">|</span> Pure gold assurance
      </p>

      <div ref={rightClusterRef} className="ml-auto flex items-center gap-2 sm:gap-3">
        <div className="mr-1 hidden flex-col items-end lg:flex">
          <span className="text-sm font-medium tabular-nums text-ink">{formattedTime}</span>
          <span className="text-xs text-muted">{formattedDate}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-ivory hover:text-ink"
          >
            <FiBell className="h-5 w-5" />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gold ring-2 ring-white" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-hairline bg-white p-4 shadow-lg">
              <p className="text-sm font-semibold text-ink">Notifications</p>
              <div className="mt-3 flex flex-col items-center justify-center rounded-lg bg-ivory px-3 py-6 text-center">
                <FiBell className="mb-2 h-5 w-5 text-muted" />
                <p className="text-xs text-muted">You're all caught up.</p>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            aria-label="Account menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-ivory sm:pr-2"
          >
            <UserAvatar username={name} src={user?.profileImage} size="sm" ringClassName="ring-2 ring-gold/40" />
            <div className="hidden text-left sm:block">
              <p className="max-w-[9rem] truncate text-sm font-medium leading-tight text-ink">{name}</p>
              <p className="text-xs leading-tight text-muted">{roleLabel}</p>
            </div>
            <FiChevronDown className={cn('hidden h-4 w-4 text-muted transition-transform sm:block', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-hairline bg-white shadow-lg">
              <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
                <UserAvatar username={name} src={user?.profileImage} size="md" ringClassName="ring-2 ring-gold/40" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{name}</p>
                  <p className="truncate text-xs text-muted">{roleLabel}</p>
                </div>
              </div>
              <div className="p-1.5">
                <button
                  type="button"
                  onClick={() => go('/user')}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-ivory"
                >
                  <FiUser className="h-4 w-4 text-muted" />
                  My Account
                </button>
                {canOpenSettings && (
                  <button
                    type="button"
                    onClick={() => go('/settings')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-ivory"
                  >
                    <FiSettings className="h-4 w-4 text-muted" />
                    Settings
                  </button>
                )}
              </div>
              <div className="border-t border-hairline p-1.5">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-branddanger transition-colors hover:bg-red-50"
                >
                  <FiLogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
