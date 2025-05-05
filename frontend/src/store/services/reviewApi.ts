import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Review {
  id: number;
  user_id: number;
  restaurant_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface ReviewCreate {
  restaurant_id: number;
  rating: number;
  comment: string;
}

export interface ReviewUpdate {
  rating?: number;
  comment?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api/v1';

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
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
  tagTypes: ['Review'],
  endpoints: (builder) => ({
    getReviews: builder.query<Review[], number>({
      query: (restaurantId) => `/reviews/restaurant/${restaurantId}`,
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Review' as const, id })),
              { type: 'Review', id: 'LIST' },
            ]
          : [{ type: 'Review', id: 'LIST' }],
    }),
    
    getUserReviews: builder.query<Review[], void>({
      query: () => '/reviews/user',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Review' as const, id })),
              { type: 'Review', id: 'USER' },
            ]
          : [{ type: 'Review', id: 'USER' }],
    }),
    
    getReview: builder.query<Review, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: (_, __, id) => [{ type: 'Review', id }],
    }),
    
    createReview: builder.mutation<Review, ReviewCreate>({
      query: (review) => ({
        url: '/reviews',
        method: 'POST',
        body: review,
      }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }, { type: 'Review', id: 'USER' }],
    }),
    
    updateReview: builder.mutation<Review, { id: number; review: ReviewUpdate }>({
      query: ({ id, review }) => ({
        url: `/reviews/${id}`,
        method: 'PUT',
        body: review,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Review', id },
        { type: 'Review', id: 'LIST' },
        { type: 'Review', id: 'USER' },
      ],
    }),
    
    deleteReview: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Review', id: 'LIST' }, { type: 'Review', id: 'USER' }],
    }),
  }),
});

export const {
  useGetReviewsQuery,
  useGetUserReviewsQuery,
  useGetReviewQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;
