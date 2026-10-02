import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiKey,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiUserCheck,
  FiUserX,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import {
  createUser,
  deleteUser,
  fetchUsers,
  resetUserPassword,
  updateUser,
} from '../../services/userService';
import { useUser } from './UserContext';
import UserAvatar from './UserAvatar';
import {
  ADMIN_ROLE,
  STAFF_ROLE,
  displayName,
  permissionGroups,
} from '../../utils/permissions';
import { cn } from '../../lib/utils';

const EMPTY_FORM = {
  username: '',
  fullName: '',
  password: '',
  role: STAFF_ROLE,
  permissions: [],
  isActive: true,
};

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

/* ------------------------------------------------------------------ modal */

const Modal = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6">
    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-amber-100 px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-amber-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-amber-600">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1 text-amber-500 transition-colors hover:bg-amber-50 hover:text-amber-700"
        >
          <FiX className="h-5 w-5" />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-amber-100 px-5 py-3">{footer}</div>}
    </div>
  </div>
);

/* ------------------------------------------------------- permission matrix */

const PermissionMatrix = ({ permissions, onChange, disabled }) => {
  const groups = useMemo(() => permissionGroups(), []);

  const toggle = (key) => {
    if (disabled) return;
    onChange(
      permissions.includes(key)
        ? permissions.filter((item) => item !== key)
        : [...permissions, key]
    );
  };

  const toggleGroup = (items, enable) => {
    if (disabled) return;
    const keys = items.map((item) => item.key);
    onChange(enable ? [...new Set([...permissions, ...keys])] : permissions.filter((key) => !keys.includes(key)));
  };

  return (
    <div className="space-y-3">
      {groups.map(({ group, items }) => {
        const selectedCount = items.filter((item) => permissions.includes(item.key)).length;

        return (
          <div key={group} className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-amber-900">
                {group}
                <span className="ml-2 text-xs font-normal text-amber-600">
                  {selectedCount}/{items.length}
                </span>
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleGroup(items, true)}
                  className="rounded-md px-2 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40"
                >
                  All
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleGroup(items, false)}
                  className="rounded-md px-2 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-40"
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {items.map((item) => (
                <label
                  key={item.key}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors',
                    permissions.includes(item.key)
                      ? 'border-amber-300 bg-white text-amber-900'
                      : 'border-amber-100 bg-white/60 text-amber-600',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-amber-600"
                    checked={permissions.includes(item.key)}
                    disabled={disabled}
                    onChange={() => toggle(item.key)}
                  />
                  <span className="truncate">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------------------------------------------------- user form */

const UserFormModal = ({ initial, isEdit, onClose, onSaved, onError }) => {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initial }));
  const [saving, setSaving] = useState(false);

  const isAdminRole = form.role === ADMIN_ROLE;
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = isEdit
      ? {
          fullName: form.fullName,
          role: form.role,
          permissions: isAdminRole ? [] : form.permissions,
          isActive: form.isActive,
        }
      : {
          username: form.username.trim(),
          fullName: form.fullName,
          password: form.password,
          role: form.role,
          permissions: isAdminRole ? [] : form.permissions,
        };

    const result = isEdit ? await updateUser(initial.id, payload) : await createUser(payload);

    setSaving(false);

    if (result.success) {
      onSaved(result.user);
    } else {
      onError(result.error || 'Could not save the user.');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit user' : 'Add user'}
      subtitle={
        isEdit
          ? `Update ${initial.username}`
          : 'They must choose a new password the first time they sign in.'
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={saving}
            className="flex items-center rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50"
          >
            {saving ? <FiRefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <FiCheckCircle className="mr-1.5 h-4 w-4" />}
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="user-username" className="mb-1.5 block text-sm font-medium text-amber-900">
              Username
            </label>
            <input
              id="user-username"
              value={form.username}
              disabled={isEdit}
              onChange={(e) => update('username', e.target.value)}
              placeholder="e.g. ramesh"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400 disabled:bg-amber-50 disabled:text-amber-500"
            />
          </div>
          <div>
            <label htmlFor="user-fullname" className="mb-1.5 block text-sm font-medium text-amber-900">
              Full name
            </label>
            <input
              id="user-fullname"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="Shown on the account"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>

        {!isEdit && (
          <div>
            <label htmlFor="user-password" className="mb-1.5 block text-sm font-medium text-amber-900">
              Temporary password
            </label>
            <input
              id="user-password"
              type="text"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
            />
          </div>
        )}

        <div>
          <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-amber-900">
            Role
          </label>
          <select
            id="user-role"
            value={form.role}
            onChange={(e) => update('role', e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
          >
            <option value={ADMIN_ROLE}>Administrator — full access</option>
            <option value={STAFF_ROLE}>Staff — chosen menus only</option>
          </select>
        </div>

        {isEdit && (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <span>
              <span className="block text-sm font-medium text-amber-900">Account active</span>
              <span className="block text-xs text-amber-600">
                Turn off to block sign in without deleting the account.
              </span>
            </span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-amber-600"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
            />
          </label>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-amber-900">Menu permissions</p>
          {isAdminRole ? (
            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              Administrators can open every menu, so no individual permissions are needed.
            </p>
          ) : (
            <PermissionMatrix
              permissions={form.permissions}
              onChange={(permissions) => update('permissions', permissions)}
            />
          )}
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------ reset modal */

const ResetPasswordModal = ({ target, onClose, onSaved, onError }) => {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await resetUserPassword(target.id, password);
    setSaving(false);

    if (result.success) {
      onSaved(result.user);
    } else {
      onError(result.error || 'Could not reset the password.');
    }
  };

  return (
    <Modal
      title="Reset password"
      subtitle={`Set a temporary password for ${target.username}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="reset-password-form"
            disabled={saving}
            className="flex items-center rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50"
          >
            {saving ? <FiRefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <FiKey className="mr-1.5 h-4 w-4" />}
            {saving ? 'Resetting...' : 'Reset password'}
          </button>
        </>
      }
    >
      <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-3">
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
          They will be asked to choose their own password the next time they sign in.
        </p>
        <div>
          <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-amber-900">
            Temporary password
          </label>
          <input
            id="reset-password"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------------------------------------- main panel */

const UserManagement = () => {
  const { user: sessionUser, refreshUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchUsers();
    setLoading(false);

    if (result.success) {
      setUsers(result.users || []);
      setError('');
    } else {
      setError(result.error || 'Could not load users.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter(
      (item) =>
        item.username?.toLowerCase().includes(term) ||
        item.fullName?.toLowerCase().includes(term)
    );
  }, [users, search]);

  const handleSaved = async (message) => {
    setEditing(null);
    setCreating(false);
    setResetting(null);
    setNotice(message);
    await load();
  };

  const handleError = (message) => setError(message);

  const toggleActive = async (target) => {
    setBusyId(target.id);
    const result = await updateUser(target.id, { isActive: !target.isActive });
    setBusyId(null);

    if (result.success) {
      setNotice(`${target.username} is now ${target.isActive ? 'deactivated' : 'active'}.`);
      await load();
      // Our own account may have just been switched off
      if (target.id === sessionUser?.id) refreshUser();
    } else {
      setError(result.error || 'Could not update the account.');
    }
  };

  const handleDelete = async () => {
    const target = confirmDelete;
    setConfirmDelete(null);
    setBusyId(target.id);

    const result = await deleteUser(target.id);
    setBusyId(null);

    if (result.success) {
      setNotice(`${target.username} was removed.`);
      await load();
    } else {
      setError(result.error || 'Could not remove the account.');
    }
  };

  const activeAdmins = users.filter((item) => item.role === ADMIN_ROLE && item.isActive).length;

  return (
    <div className="max-w-6xl animate-slideIn space-y-4">
      <div className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FiUsers className="h-5 w-5 text-amber-600" />
              <h2 className="text-lg font-bold text-amber-900">Users</h2>
            </div>
            <p className="mt-0.5 text-sm text-amber-600">
              {users.length} account{users.length === 1 ? '' : 's'} · {activeAdmins} active administrator
              {activeAdmins === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="flex items-center rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
            >
              <FiRefreshCw className={cn('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex items-center rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 px-3 py-1.5 text-sm font-medium text-white transition-all hover:from-amber-700 hover:to-yellow-600"
            >
              <FiPlus className="mr-1.5 h-4 w-4" />
              Add user
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or username"
            className="w-full rounded-lg border border-amber-200 bg-white py-1.5 pl-9 pr-3 text-sm text-amber-900 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="flex items-start text-sm text-red-700">
            <FiAlertTriangle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </p>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss" className="text-red-400 hover:text-red-600">
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="flex items-start text-sm text-green-700">
            <FiCheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
            {notice}
          </p>
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss" className="text-green-400 hover:text-green-600">
            <FiX className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-amber-600">
            <FiRefreshCw className="h-4 w-4 animate-spin" />
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-amber-600">
            {users.length === 0 ? 'No users yet.' : 'No users match your search.'}
          </div>
        ) : (
          <ul className="divide-y divide-amber-100">
            {filtered.map((item) => {
              const isSelf = item.id === sessionUser?.id;
              const isLastAdmin = item.role === ADMIN_ROLE && activeAdmins === 1;
              const busy = busyId === item.id;

              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <UserAvatar username={displayName(item)} src={item.profileImage} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-amber-900">
                      {displayName(item)}
                      {isSelf && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          you
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                          inactive
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-amber-600">
                      {item.username}
                      {item.role === ADMIN_ROLE
                        ? ' · full access'
                        : item.permissions?.length
                          ? ` · ${item.permissions.length} menu${item.permissions.length === 1 ? '' : 's'}`
                          : ' · no menus'}
                    </p>
                  </div>

                  <div className="hidden text-xs text-amber-500 lg:block">
                    Last sign in: {formatDateTime(item.lastLoginAt)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(item)}
                      className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-800"
                      title="Edit user"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetting(item)}
                      className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-800"
                      title="Reset password"
                    >
                      <FiKey className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleActive(item)}
                      disabled={busy || (isLastAdmin && item.isActive)}
                      title={
                        isLastAdmin && item.isActive
                          ? 'At least one active administrator must remain'
                          : item.isActive
                            ? 'Deactivate account'
                            : 'Activate account'
                      }
                      className="rounded-lg p-2 text-amber-600 transition-colors hover:bg-amber-50 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {item.isActive ? <FiUserCheck className="h-4 w-4" /> : <FiUserX className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(item)}
                      disabled={busy || isSelf}
                      title={isSelf ? 'You cannot remove your own account' : 'Remove account'}
                      className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {creating && (
        <UserFormModal
          isEdit={false}
          initial={EMPTY_FORM}
          onClose={() => setCreating(false)}
          onSaved={() => handleSaved('User created.')}
          onError={handleError}
        />
      )}

      {editing && (
        <UserFormModal
          isEdit
          initial={{
            id: editing.id,
            username: editing.username,
            fullName: editing.fullName || '',
            role: editing.role,
            permissions: editing.permissions || [],
            isActive: editing.isActive,
          }}
          onClose={() => setEditing(null)}
          onSaved={() => handleSaved(`${editing.username} updated.`)}
          onError={handleError}
        />
      )}

      {resetting && (
        <ResetPasswordModal
          target={resetting}
          onClose={() => setResetting(null)}
          onSaved={() => handleSaved(`Password reset for ${resetting.username}.`)}
          onError={handleError}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Remove user"
          subtitle={`This permanently deletes ${confirmDelete.username}.`}
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                <FiTrash2 className="mr-1.5 h-4 w-4" />
                Remove user
              </button>
            </>
          }
        >
          <p className="text-sm text-amber-800">
            Deactivating the account instead keeps their history and lets you restore access later.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
