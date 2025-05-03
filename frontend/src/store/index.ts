import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { restaurantApi } from './services/restaurantApi';
import { authApi } from './services/authApi';
import { reviewApi } from './services/reviewApi';
import { favoriteApi } from './services/favoriteApi';
import { reservationApi } from './services/reservationApi';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    [restaurantApi.reducerPath]: restaurantApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [favoriteApi.reducerPath]: favoriteApi.reducer,
    [reservationApi.reducerPath]: reservationApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      restaurantApi.middleware,
      authApi.middleware,
      reviewApi.middleware,
      favoriteApi.middleware,
      reservationApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
