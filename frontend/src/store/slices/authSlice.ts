import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../services/authApi';
import { RootState } from '../index';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ token: string }>) => {
      const { token } = action.payload;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      authApi.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        state.token = payload.access_token;
        state.isAuthenticated = true;
        localStorage.setItem('token', payload.access_token);
      }
    );
  },
});

export const { setCredentials, logout } = authSlice.actions;

export const selectCurrentToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export default authSlice.reducer;
