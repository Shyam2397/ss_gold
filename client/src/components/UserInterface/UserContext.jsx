import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePassword as changePasswordRequest,
  fetchProfile,
  getUser,
  isAuthenticated,
  logoutUser,
  updateStoredUser,
} from '../../services/authService';
import { updateMyProfile as updateMyProfileRequest } from '../../services/userService';
import {
  canAccessPath as canAccessPathFor,
  firstAccessiblePath,
  hasPermission as hasPermissionFor,
  isAdmin as isAdminFor,
} from '../../utils/permissions';

const UserContext = createContext({
  user: null,
  loading: false,
  mustChangePassword: false,
  isAdmin: false,
  canAccess: () => true,
  hasPermission: () => false,
  firstAccessiblePath: '/user',
  adoptSessionUser: async () => ({ success: false }),
  refreshUser: async () => ({ success: false }),
  changePassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  signOut: () => {}
});

export const UserProvider = ({ children }) => {
  // Seeded from localStorage so the forced password change is visible on first paint
  const [user, setUser] = useState(() => getUser());
  const [loading, setLoading] = useState(() => isAuthenticated());

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser || null);
    updateStoredUser(nextUser);
    return nextUser;
  }, []);

  // Adopt the account returned by a successful login so the UI reflects it right
  // away, then pull the full profile (timestamps, password status) from the server.
  const adoptSessionUser = useCallback(
    async (sessionUser) => {
      applyUser(sessionUser);

      const result = await fetchProfile();
      if (result.success) {
        applyUser(result.user);
      }

      return result.success ? result : { success: true, user: sessionUser };
    },
    [applyUser]
  );

  const refreshUser = useCallback(async () => {
    if (!isAuthenticated()) {
      applyUser(null);
      return { success: false, error: 'Not signed in' };
    }

    setLoading(true);
    const result = await fetchProfile();

    if (result.success) {
      applyUser(result.user);
    }

    setLoading(false);
    return result;
  }, [applyUser]);

  const changePassword = useCallback(
    async ({ currentPassword = '', newPassword, confirmPassword }) => {
      setLoading(true);
      const result = await changePasswordRequest({ currentPassword, newPassword, confirmPassword });

      if (result.success) {
        applyUser(result.user);
      }

      setLoading(false);
      return result;
    },
    [applyUser]
  );

  const signOut = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  // Keep the signed in account's own name and photo in step with the server
  const updateProfile = useCallback(
    async (payload) => {
      setLoading(true);
      const result = await updateMyProfileRequest(payload);

      if (result.success) {
        applyUser(result.user);
      }

      setLoading(false);
      return result;
    },
    [applyUser]
  );

  // Keep the stored account details in sync with the server while signed in
  useEffect(() => {
    if (!isAuthenticated()) {
      setUser(null);
      return;
    }

    let cancelled = false;

    const sync = async () => {
      const result = await fetchProfile();
      if (cancelled) return;
      if (result.success) {
        setUser(result.user);
      }
    };

    sync();

    return () => {
      cancelled = true;
    };
  }, []);

  const mustChangePassword = Boolean(user?.mustChangePassword);
  const isAdmin = isAdminFor(user);

  const canAccess = useCallback((path) => canAccessPathFor(user, path), [user]);
  const hasPermission = useCallback((key) => hasPermissionFor(user, key), [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      mustChangePassword,
      isAdmin,
      canAccess,
      hasPermission,
      firstAccessiblePath: firstAccessiblePath(user),
      adoptSessionUser,
      refreshUser,
      changePassword,
      updateProfile,
      signOut,
    }),
    [
      user,
      loading,
      mustChangePassword,
      isAdmin,
      canAccess,
      hasPermission,
      adoptSessionUser,
      refreshUser,
      changePassword,
      updateProfile,
      signOut,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);

export default UserContext;