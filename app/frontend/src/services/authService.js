import axios from 'axios';
import { getStoredApiUrl } from './api';

const TOKEN_KEY = 'aegis_auth_token';
const USER_KEY = 'aegis_user_profile';

const createAuthClient = () => {
  const baseURL = getStoredApiUrl();
  const token = localStorage.getItem(TOKEN_KEY);
  return axios.create({
    baseURL,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isAuthenticated = () => Boolean(getStoredToken());

export const registerUser = async ({ name, username, email, password, company }) => {
  const client = createAuthClient();
  try {
    const res = await client.post('/auth/register', { name, username, email, password, company });
    if (res.data.success && res.data.token && res.data.user) {
      setAuthSession(res.data.token, res.data.user);
    }
    return res.data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message || 'Registration failed.' };
  }
};

export const loginUser = async ({ email, password }) => {
  const client = createAuthClient();
  try {
    const res = await client.post('/auth/login', { email, password });
    if (res.data.success && res.data.token && res.data.user) {
      setAuthSession(res.data.token, res.data.user);
    }
    return res.data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message || 'Sign in failed.' };
  }
};

export const deleteUserAccount = async () => {
  const client = createAuthClient();
  try {
    const res = await client.post('/auth/delete-account');
    if (res.data.success) clearAuthSession();
    return res.data;
  } catch (err) {
    return err.response?.data || { success: false, error: err.message || 'Account deletion failed.' };
  }
};

export const logoutUser = () => {
  clearAuthSession();
  window.location.href = '/signin';
};
