import React, { useState } from 'react';
import { FiUser } from 'react-icons/fi';
import { cn } from '../../lib/utils';

const AVATAR_SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
};

export const getInitials = (value = '') => {
  const parts = String(value)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const UserAvatar = ({ username, src, size = 'md', className, ringClassName }) => {
  const initials = getInitials(username);
  const [imageFailed, setImageFailed] = useState(false);

  // Fall back to initials when there is no photo, or if the stored one will not load
  const showImage = Boolean(src) && !imageFailed;

  return (
    <div
      className={cn(
        'flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 font-bold text-white select-none',
        AVATAR_SIZES[size] || AVATAR_SIZES.md,
        ringClassName || 'ring-2 ring-amber-200',
        className
      )}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          {initials ? <span className="truncate px-1">{initials}</span> : <FiUser className="h-1/2 w-1/2" />}
        </>
      )}
    </div>
  );
};

export default UserAvatar;
