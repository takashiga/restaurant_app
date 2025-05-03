import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container, Box } from '@mui/material';
import HomePage from './pages/HomePage';
import RestaurantListPage from './pages/RestaurantListPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import ReservationsPage from './pages/ReservationsPage';
import ReviewsPage from './pages/ReviewsPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/auth/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurants" element={<RestaurantListPage />} />
          <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <FavoritesPage />
            </ProtectedRoute>
          } />
          <Route path="/reservations" element={
            <ProtectedRoute>
              <ReservationsPage />
            </ProtectedRoute>
          } />
          <Route path="/reviews" element={
            <ProtectedRoute>
              <ReviewsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
};

export default App;
