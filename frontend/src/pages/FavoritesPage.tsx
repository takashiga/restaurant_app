import React from 'react';
import { 
  Typography, Box, Container, Grid, Paper, CircularProgress, 
  Alert, Card, CardContent, CardMedia, CardActionArea, Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGetUserFavoritesQuery } from '../store/services/favoriteApi';
import { useGetRestaurantByIdQuery } from '../store/services/restaurantApi';
import FavoriteIcon from '@mui/icons-material/Favorite';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const FavoriteRestaurantCard = ({ restaurantId }: { restaurantId: number }) => {
  const { data: restaurant, isLoading, error } = useGetRestaurantByIdQuery(restaurantId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={40} />
      </Card>
    );
  }

  if (error || !restaurant) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CardContent>
          <Typography color="error">レストラン情報を取得できませんでした</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardActionArea onClick={() => navigate(`/restaurants/${restaurantId}`)}>
        <CardMedia
          component="div"
          sx={{
            height: 140,
            bgcolor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RestaurantIcon sx={{ fontSize: 60, color: 'white' }} />
        </CardMedia>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {restaurant.restaurant_name}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
            {restaurant.address}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {restaurant.cuisine_types && restaurant.cuisine_types.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {restaurant.cuisine_types.map(c => c.name).join(', ')}
              </Typography>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

const FavoritesPage: React.FC = () => {
  const { data: favorites, isLoading, error } = useGetUserFavoritesQuery();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            <FavoriteIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
            お気に入りレストラン
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/restaurants')}
          >
            レストランを探す
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            お気に入りの取得に失敗しました。ネットワーク接続を確認するか、しばらく経ってからもう一度お試しください。
          </Alert>
        ) : favorites && favorites.length > 0 ? (
          <Grid container spacing={3}>
            {favorites.map((favorite) => (
              <Grid item key={favorite.id} xs={12} sm={6} md={4}>
                <FavoriteRestaurantCard restaurantId={favorite.restaurant_id} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <FavoriteIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              お気に入りがありません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              レストランを探して、お気に入りに追加してみましょう。
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/restaurants')}
              sx={{ mt: 2 }}
            >
              レストランを探す
            </Button>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default FavoritesPage;
