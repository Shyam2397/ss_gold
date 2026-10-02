import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiCalendar,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiLogOut,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiUser,
} from 'react-icons/fi';
import { useUser } from './UserContext';
import UserAvatar from './UserAvatar';
import ChangePasswordForm from './ChangePasswordForm';
import { cn } from '../../lib/utils';
import { fileToProfileImage } from '../../utils/profileImage';
import { displayName } from '../../utils/permissions';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-amber-100 py-2 last:border-b-0">
    <span className="flex items-center text-sm text-amber-700">
      <Icon className="mr-2 h-4 w-4 flex-shrink-0 text-amber-600" />
      {label}
    </span>
    <span className="truncate text-right text-sm font-medium text-amber-900">{value}</span>
  </div>
);

const SectionCard = ({ icon: Icon, title, subtitle, children, action }) => (
  <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-bold text-amber-900">{title}</h2>
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-amber-600">{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

/**
 * Full screen gate shown after install / first login while the account still
 * runs on the shipped default password. The rest of the app stays locked until
 * a new password is set.
 */
const RequiredPasswordChange = ({ onSignOut }) => {
  const { user, changePassword } = useUser();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    async (payload) => {
      setStatus('saving');
      setError('');

      const result = await changePassword(payload);
      setStatus(result.success ? 'saved' : 'idle');

      if (!result.success) {
        setError(result.error || 'Failed to update password');
      }
    },
    [changePassword]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-yellow-100 px-4 py-8">
      <div className="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-lg sm:p-8">
        <div className="flex flex-col items-center text-center">
          <UserAvatar username={user?.username} size="lg" ringClassName="ring-4 ring-amber-100" />
          <h1 className="mt-3 text-xl font-bold text-amber-900">Welcome, {displayName(user)}</h1>
          <p className="mt-1 text-sm text-amber-600">
            Choose a new password to finish setting up this installation.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            This software ships with a default password. The rest of the application stays locked
            until you set a new one.
          </p>
        </div>

        <ChangePasswordForm
          onSubmit={handleSubmit}
          status={status}
          error={error}
          requireCurrentPassword={false}
          isLocked={false}
        />

        <button
          type="button"
          onClick={onSignOut}
          className="flex w-full items-center justify-center rounded-xl border border-amber-200 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
        >
          <FiLogOut className="mr-2 h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
};

/**
 * Lets the signed in user set the name and photo shown across the app.
 */
const ProfileCard = ({ onSaved }) => {
  const { user, updateProfile } = useUser();
  const [fullName, setFullName] = useState(() => user?.fullName || '');
  const [photo, setPhoto] = useState(() => user?.profileImage || null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  // Keep the form in step when the account is refreshed elsewhere
  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhoto(user?.profileImage || null);
  }, [user?.fullName, user?.profileImage]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const handlePick = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    try {
      setPhoto(await fileToProfileImage(file));
    } catch (err) {
      setError(err.message || 'Could not read that image.');
    }
  };

  const handleRemove = () => {
    setPhoto(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('saving');
    setError('');
    setSuccess('');

    const result = await updateProfile({ fullName: fullName.trim(), profileImage: photo });
    setStatus(result.success ? 'saved' : 'idle');

    if (result.success) {
      setSuccess('Profile updated');
      setTimeout(() => setStatus('idle'), 1500);
      onSaved?.();
    } else {
      setError(result.error || 'Failed to update your profile');
    }
  };

  const saving = status === 'saving';

  return (
    <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <UserAvatar
          username={fullName || user?.username}
          src={photo}
          size="lg"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-amber-900">{displayName(user)}</p>
          <p className="text-sm text-amber-600">
            {user?.role === 'admin' ? 'Administrator' : 'Staff'} · @{user?.username}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4 border-t border-amber-100 pt-4">
        <div>
          <label htmlFor="profile-full-name" className="mb-1.5 block text-sm font-medium text-amber-900">
            Display name
          </label>
          <input
            id="profile-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={user?.username}
            maxLength={80}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
          />
          <p className="mt-1 text-xs text-amber-600">
            Leave empty to show your username ({user?.username}).
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-amber-900">Photo</span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
            >
              <FiCamera className="mr-1.5 h-4 w-4" />
              {photo ? 'Change photo' : 'Upload photo'}
            </button>
            {photo && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <FiTrash2 className="mr-1.5 h-4 w-4" />
                Remove
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-amber-600">
            Cropped to a square and stored with your account.
          </p>
        </div>

        {error && (
          <p className="flex items-start text-sm text-red-600">
            <FiAlertTriangle className="mr-1.5 mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-center text-sm text-emerald-700">
            <FiCheckCircle className="mr-1.5 h-4 w-4" />
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-amber-700 hover:to-yellow-600 disabled:opacity-50"
        >
          {saving ? <FiRefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <FiCheckCircle className="mr-1.5 h-4 w-4" />}
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};

/**
 * Account page for the logged in user: shows the account details and lets the
 * user update the password.
 */
const UserAccount = () => {
  const { user, changePassword, refreshUser } = useUser();
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSubmit = useCallback(
    async (payload) => {
      setStatus('saving');
      setError('');
      setSuccess('');

      const result = await changePassword(payload);
      setStatus(result.success ? 'saved' : 'idle');

      if (result.success) {
        setSuccess(result.message || 'Password updated successfully');
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        setError(result.error || 'Failed to update password');
      }
    },
    [changePassword]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await refreshUser();
    setRefreshing(false);

    if (result.success) {
      setSuccess('Account details refreshed');
    } else {
      setError(result.error || 'Failed to refresh account details');
    }
  }, [refreshUser]);

  const username = user?.username || 'User';
  const name = displayName(user);

  const details = useMemo(
    () => [
      { icon: FiUser, label: 'Username', value: username },
      {
        icon: FiShield,
        label: 'Role',
        value: user?.role === 'admin' ? 'Administrator (full access)' : 'Staff'
      },
      {
        icon: FiCheckCircle,
        label: 'Menus available',
        value:
          user?.role === 'admin'
            ? 'All menus'
            : `${user?.permissions?.length || 0} granted`
      },
      { icon: FiCalendar, label: 'Account created', value: formatDateTime(user?.createdAt) },
      { icon: FiClock, label: 'Last sign in', value: formatDateTime(user?.lastLoginAt) },
      { icon: FiShield, label: 'Password last changed', value: formatDateTime(user?.passwordChangedAt) }
    ],
    [user, username]
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">My Account</h1>
          <p className="mt-0.5 text-sm text-amber-600">
            Manage the account you are signed in with and update your password.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center rounded-xl border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
        >
          <FiRefreshCw className={cn('mr-1.5 h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <ProfileCard onSaved={refreshUser} />

          <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-white px-4 py-3 shadow-sm">
            {user?.mustChangePassword ? (
              <>
                <FiAlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">Password change pending</p>
              </>
            ) : (
              <>
                <FiCheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                <p className="text-sm text-emerald-700">Password is up to date</p>
              </>
            )}
          </div>

          <SectionCard
            icon={FiUser}
            title="Account details"
            subtitle="Read only information about this account"
          >
            <div>
              {details.map((row) => (
                <InfoRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="lg:col-span-3">
          <SectionCard
            icon={FiShield}
            title="Change password"
            subtitle="Use a password you do not use on any other system"
          >
            <ChangePasswordForm
              onSubmit={handleSubmit}
              status={status}
              error={error}
              successMessage={success}
              requireCurrentPassword
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

const UserInterface = ({ variant = 'page', onSignOut }) => {
  if (variant === 'required') {
    return <RequiredPasswordChange onSignOut={onSignOut} />;
  }

  return <UserAccount />;
};

export default UserInterface;