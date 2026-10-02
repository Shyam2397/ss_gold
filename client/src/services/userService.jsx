import { getApi } from './api';

const extractErrorMessage = (err, fallback) => {
  if (err.response) {
    const { status, data } = err.response;
    if (status === 400) return data?.error || data?.detail || 'Please check the details and try again.';
    if (status === 401) return data?.error || 'Your session has expired. Please sign in again.';
    if (status === 403) return data?.error || 'You do not have permission to do that.';
    if (status === 404) return data?.error || 'Not found';
    if (status === 409) return data?.error || 'That username is already taken';
    if (status === 500) return 'Server error. Please try again later.';
    return data?.error || data?.detail || fallback;
  }
  if (err.request) {
    return 'Unable to connect to server. Please check that the application is running.';
  }
  return err.message || fallback;
};

const handle = async (request, fallback) => {
  try {
    const response = await request();
    const body = response.data;

    if (body?.success) return body;

    return { success: false, error: body?.error || fallback };
  } catch (err) {
    return { success: false, error: extractErrorMessage(err, fallback) };
  }
};

/** Admin only: every account with its role, permissions and status. */
export const fetchUsers = async () => {
  const api = await getApi();
  return handle(() => api.get('/users'), 'Failed to load users');
};

export const createUser = async (payload) => {
  const api = await getApi();
  return handle(() => api.post('/users', payload), 'Failed to create user');
};

export const updateUser = async (id, payload) => {
  const api = await getApi();
  return handle(() => api.put(`/users/${id}`, payload), 'Failed to update user');
};

export const deleteUser = async (id) => {
  const api = await getApi();
  return handle(() => api.delete(`/users/${id}`), 'Failed to delete user');
};

export const resetUserPassword = async (id, newPassword) => {
  const api = await getApi();
  return handle(
    () => api.put(`/users/${id}/password`, { newPassword }),
    'Failed to reset password'
  );
};

/** Any signed in user: update their own display name and photo. */
export const updateMyProfile = async (payload) => {
  const api = await getApi();
  return handle(() => api.put('/users/me', payload), 'Failed to update your profile');
};
