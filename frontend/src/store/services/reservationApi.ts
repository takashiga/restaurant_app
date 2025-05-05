import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Reservation {
  id: number;
  user_id: number;
  restaurant_id: number;
  reservation_time: string;
  party_size: number;
  notes?: string;
  status: string;
  created_at: string;
  updated_at: string;
  restaurant_name?: string;
}

export interface ReservationCreate {
  restaurant_id: number;
  reservation_time: string;
  party_size: number;
  notes?: string;
}

export interface ReservationUpdate {
  reservation_time?: string;
  party_size?: number;
  notes?: string;
  status?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api/v1';

export const reservationApi = createApi({
  reducerPath: 'reservationApi',
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
  tagTypes: ['Reservation'],
  endpoints: (builder) => ({
    getUserReservations: builder.query<Reservation[], void>({
      query: () => '/reservations', // Removed trailing slash as per user request
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Reservation' as const, id })),
              { type: 'Reservation', id: 'LIST' },
            ]
          : [{ type: 'Reservation', id: 'LIST' }],
    }),

    getReservation: builder.query<Reservation, number>({
      query: (id) => `/reservations/${id}`, // Removed trailing slash as per user request
      providesTags: (_, __, id) => [{ type: 'Reservation', id }],
    }),

    createReservation: builder.mutation<Reservation, ReservationCreate>({
      query: (reservation) => ({
        url: '/reservations', // Removed trailing slash as per user request
        method: 'POST',
        body: reservation,
      }),
      invalidatesTags: [{ type: 'Reservation', id: 'LIST' }],
    }),

    updateReservation: builder.mutation<Reservation, { id: number; reservation: ReservationUpdate }>({
      query: ({ id, reservation }) => ({
        url: `/reservations/${id}`, // Removed trailing slash as per user request
        method: 'PUT',
        body: reservation,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
      ],
    }),

    cancelReservation: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reservations/${id}/cancel`, // Removed trailing slash as per user request
        method: 'PUT',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Reservation', id },
        { type: 'Reservation', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUserReservationsQuery,
  useGetReservationQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useCancelReservationMutation,
} = reservationApi;
