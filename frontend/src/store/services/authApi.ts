import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api/v1';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, UserCredentials>({
      query: (credentials) => {
        console.log('Sending login request with credentials:', credentials);
        return {
          url: '/auth/token',
          method: 'POST',
          body: new URLSearchParams({
            username: credentials.username,
            password: credentials.password,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        };
      },
      invalidatesTags: ['User'],
      onQueryStarted: async (credentials, { queryFulfilled }) => {
        console.log('Login query started with:', credentials);
        try {
          const result = await queryFulfilled;
          console.log('Login query fulfilled:', result);
        } catch (error) {
          console.error('Login query failed:', error);
        }
      },
    }),
    
    register: builder.mutation<User, UserRegistration>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
} = authApi;
