import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Restaurant {
  id: number;
  restaurant_name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone_number?: string;
  website_url?: string;
  price_range_lunch?: string;
  price_range_dinner?: string;
  opening_hours?: string;
  regular_holidays?: string;
  review_count?: number;
  average_rating?: number;
  cuisine_types: CuisineType[];
  special_features: SpecialFeature[];
  created_at: string;
  updated_at: string;
  data_source: string;
  source_id?: string;
}

export interface CuisineType {
  id: number;
  name: string;
  code?: string;
}

export interface SpecialFeature {
  id: number;
  name: string;
  code?: string;
}

export interface RestaurantSearchParams {
  name?: string;
  cuisine_type?: string;
  area?: string;
  min_price?: number;
  max_price?: number;
  special_feature?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  skip?: number;
  limit?: number;
}

export interface RestaurantSearchKeywordParams {
  q: string;
  skip?: number;
  limit?: number;
}

export interface NearbyRestaurantsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const restaurantApi = createApi({
  reducerPath: 'restaurantApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  tagTypes: ['Restaurant', 'CuisineType', 'SpecialFeature'],
  endpoints: (builder) => ({
    getRestaurants: builder.query<Restaurant[], RestaurantSearchParams>({
      query: (params) => ({
        url: '/restaurants/',
        params,
      }),
      providesTags: ['Restaurant'],
    }),
    
    getRestaurantById: builder.query<Restaurant, number>({
      query: (id) => `/restaurants/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Restaurant', id }],
    }),
    
    searchRestaurants: builder.query<Restaurant[], RestaurantSearchKeywordParams>({
      query: (params) => ({
        url: '/restaurants/search/',
        params,
      }),
      providesTags: ['Restaurant'],
    }),
    
    getNearbyRestaurants: builder.query<Restaurant[], NearbyRestaurantsParams>({
      query: (params) => ({
        url: '/restaurants/nearby/',
        params,
      }),
      providesTags: ['Restaurant'],
    }),
    
    getCuisineTypes: builder.query<CuisineType[], void>({
      query: () => '/restaurants/cuisine-types/',
      providesTags: ['CuisineType'],
    }),
    
    getSpecialFeatures: builder.query<SpecialFeature[], void>({
      query: () => '/restaurants/special-features/',
      providesTags: ['SpecialFeature'],
    }),
    
    createRestaurant: builder.mutation<Restaurant, Partial<Restaurant>>({
      query: (restaurant) => ({
        url: '/restaurants/',
        method: 'POST',
        body: restaurant,
      }),
      invalidatesTags: ['Restaurant'],
    }),
    
    updateRestaurant: builder.mutation<Restaurant, { id: number; restaurant: Partial<Restaurant> }>({
      query: ({ id, restaurant }) => ({
        url: `/restaurants/${id}/`,
        method: 'PUT',
        body: restaurant,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Restaurant', id }],
    }),
    
    deleteRestaurant: builder.mutation<{ status: string; message: string }, number>({
      query: (id) => ({
        url: `/restaurants/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Restaurant', id }],
    }),
  }),
});

export const {
  useGetRestaurantsQuery,
  useGetRestaurantByIdQuery,
  useSearchRestaurantsQuery,
  useGetNearbyRestaurantsQuery,
  useGetCuisineTypesQuery,
  useGetSpecialFeaturesQuery,
  useCreateRestaurantMutation,
  useUpdateRestaurantMutation,
  useDeleteRestaurantMutation,
} = restaurantApi;
