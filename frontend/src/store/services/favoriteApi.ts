import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Favorite {
  id: number;
  user_id: number;
  restaurant_id: number;
  created_at: string;
}

export interface FavoriteCreate {
  restaurant_id: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api/v1';

export const favoriteApi = createApi({
  reducerPath: 'favoriteApi',
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
  tagTypes: ['Favorite'],
  endpoints: (builder) => ({
    getUserFavorites: builder.query<Favorite[], void>({
      query: () => '/favorites/',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Favorite' as const, id })),
              { type: 'Favorite', id: 'LIST' },
            ]
          : [{ type: 'Favorite', id: 'LIST' }],
    }),
    
    checkFavorite: builder.query<boolean, number>({
      query: (restaurantId) => `/favorites/check/${restaurantId}/`,
      providesTags: (_, __, restaurantId) => [{ type: 'Favorite', id: restaurantId }],
    }),
    
    addFavorite: builder.mutation<Favorite, FavoriteCreate>({
      query: (favorite) => ({
        url: '/favorites/', // Add trailing slash to match backend endpoint
        method: 'POST',
        body: favorite,
      }),
      invalidatesTags: [{ type: 'Favorite', id: 'LIST' }],
    }),
    
    removeFavorite: builder.mutation<void, number>({
      query: (restaurantId) => ({
        url: `/favorites/${restaurantId}/`, // Add trailing slash to match backend endpoint
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, restaurantId) => [
        { type: 'Favorite', id: 'LIST' },
        { type: 'Favorite', id: restaurantId },
      ],
    }),
  }),
});

export const {
  useGetUserFavoritesQuery,
  useCheckFavoriteQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} = favoriteApi;
