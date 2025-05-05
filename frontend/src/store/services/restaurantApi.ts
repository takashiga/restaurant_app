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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api/v1';

console.log('Using API URL:', API_BASE_URL);

export const restaurantApi = createApi({
  reducerPath: 'restaurantApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      console.log('Request headers:', Object.fromEntries([...headers.entries()]));
      return headers;
    },
    fetchFn: async (...args) => {
      console.log('Making API request:', args[0]);
      try {
        const response = await fetch(...args);
        console.log('API response status:', response.status);
        return response;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }
  }),
  tagTypes: ['Restaurant', 'CuisineType', 'SpecialFeature'],
  endpoints: (builder) => ({
    getRestaurants: builder.query<Restaurant[], RestaurantSearchParams>({
      query: (params) => {
        const filteredParams = Object.entries(params || {}).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        console.log('Filtered restaurant query params:', filteredParams);
        
        return {
          url: '/restaurants',
          params: filteredParams,
        };
      },
      providesTags: ['Restaurant'],
    }),
    
    getRestaurantById: builder.query<Restaurant, number>({
      query: (id) => `/restaurants/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Restaurant', id }],
    }),
    
    searchRestaurants: builder.query<Restaurant[], RestaurantSearchKeywordParams>({
      query: (params) => {
        console.log('Search restaurants query params:', params);
        return {
          url: '/restaurants/search',
          params,
        };
      },
      providesTags: ['Restaurant'],
      transformResponse: (response: Restaurant[]) => {
        console.log('Search restaurants response:', response);
        return response;
      },
      transformErrorResponse: (response) => {
        console.error('Error searching restaurants:', response);
        return response;
      },
    }),
    
    getNearbyRestaurants: builder.query<Restaurant[], NearbyRestaurantsParams>({
      query: (params) => {
        console.log('Nearby restaurants query params:', params);
        return {
          url: '/restaurants/nearby',
          params: {
            latitude: params.latitude,
            longitude: params.longitude,
            radius: params.radius || 2.0,
            limit: params.limit || 20
          },
        };
      },
      providesTags: ['Restaurant'],
    }),
    
    getCuisineTypes: builder.query<CuisineType[], void>({
      query: () => {
        console.log('Fetching cuisine types');
        return {
          url: '/restaurants/cuisine-types',
          params: {
            skip: 0,
            limit: 100
          }
        };
      },
      providesTags: ['CuisineType'],
      transformErrorResponse: (response) => {
        console.error('Error fetching cuisine types:', response);
        return [];
      }
    }),
    
    getSpecialFeatures: builder.query<SpecialFeature[], void>({
      query: () => {
        console.log('Fetching special features');
        return {
          url: '/restaurants/special-features',
          params: {
            skip: 0,
            limit: 100
          }
        };
      },
      providesTags: ['SpecialFeature'],
      transformErrorResponse: (response) => {
        console.error('Error fetching special features:', response);
        return [];
      }
    }),
    
    createRestaurant: builder.mutation<Restaurant, Partial<Restaurant>>({
      query: (restaurant) => ({
        url: '/restaurants',
        method: 'POST',
        body: restaurant,
      }),
      invalidatesTags: ['Restaurant'],
    }),
    
    updateRestaurant: builder.mutation<Restaurant, { id: number; restaurant: Partial<Restaurant> }>({
      query: ({ id, restaurant }) => ({
        url: `/restaurants/${id}`,
        method: 'PUT',
        body: restaurant,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Restaurant', id }],
    }),
    
    deleteRestaurant: builder.mutation<{ status: string; message: string }, number>({
      query: (id) => ({
        url: `/restaurants/${id}`,
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
