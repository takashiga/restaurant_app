import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Box, Container, Grid, Paper, Chip, 
  Divider, Rating, Button, CircularProgress, Alert,
  IconButton, Tooltip
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGetRestaurantByIdQuery } from '../store/services/restaurantApi';
import L from 'leaflet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import InfoIcon from '@mui/icons-material/Info';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const restaurantId = parseInt(id || '0');
  const { data: restaurant, isLoading, error } = useGetRestaurantByIdQuery(restaurantId);

  const defaultPosition: [number, number] = [35.6812, 139.7671];
  
  const hasValidCoordinates = restaurant?.latitude && restaurant?.longitude;
  
  const position: [number, number] = hasValidCoordinates
    ? [restaurant.latitude!, restaurant.longitude!]
    : defaultPosition;

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !restaurant) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            戻る
          </Button>
          <Alert severity="error" sx={{ mt: 2 }}>
            レストラン情報の取得に失敗しました。ネットワーク接続を確認するか、しばらく経ってからもう一度お試しください。
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Tooltip title="レストラン一覧に戻る">
            <IconButton onClick={handleBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            {restaurant.restaurant_name}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mb: 3, gap: 1 }}>
          {restaurant.cuisine_types.map((cuisine) => (
            <Chip key={cuisine.id} label={cuisine.name} color="primary" variant="outlined" />
          ))}
          {restaurant.average_rating && restaurant.average_rating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Rating value={restaurant.average_rating} precision={0.5} readOnly size="small" />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({restaurant.review_count || 0} レビュー)
              </Typography>
            </Box>
          )}
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>基本情報</Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">住所</Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1">{restaurant.address}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    電話番号
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  {restaurant.phone_number ? (
                    <Button 
                      href={`tel:${restaurant.phone_number}`} 
                      variant="text" 
                      sx={{ p: 0 }}
                      startIcon={<PhoneIcon />}
                    >
                      {restaurant.phone_number}
                    </Button>
                  ) : (
                    <Typography variant="body1">情報なし</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <LanguageIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    ウェブサイト
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  {restaurant.website_url ? (
                    <Button 
                      href={restaurant.website_url} 
                      target="_blank" 
                      variant="text" 
                      sx={{ p: 0 }}
                      startIcon={<LanguageIcon />}
                    >
                      ウェブサイトを見る
                    </Button>
                  ) : (
                    <Typography variant="body1">情報なし</Typography>
                  )}
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <AccessTimeIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    営業時間
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1">{restaurant.opening_hours || '情報なし'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <EventBusyIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    定休日
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1">{restaurant.regular_holidays || '情報なし'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <RestaurantIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    価格帯（昼）
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1">{restaurant.price_range_lunch || '情報なし'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <RestaurantIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    価格帯（夜）
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1">{restaurant.price_range_dinner || '情報なし'}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                    データソース
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="body1">
                    {restaurant.data_source}
                    {restaurant.data_source === 'HotPepper' && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Powered by HotPepper API / Recruit Co., Ltd.
                      </Typography>
                    )}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>特徴</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {restaurant.special_features.length > 0 ? (
                  restaurant.special_features.map((feature) => (
                    <Chip key={feature.id} label={feature.name} variant="outlined" />
                  ))
                ) : (
                  <Typography variant="body1">情報なし</Typography>
                )}
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>地図</Typography>
              <Divider sx={{ mb: 2 }} />
              
              {hasValidCoordinates ? (
                <Box sx={{ height: 400, width: '100%', flexGrow: 1 }}>
                  <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={position}>
                      <Popup>
                        <Typography variant="subtitle2">{restaurant.restaurant_name}</Typography>
                        <Typography variant="body2">{restaurant.address}</Typography>
                        {restaurant.phone_number && (
                          <Typography variant="body2">TEL: {restaurant.phone_number}</Typography>
                        )}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
                  <Alert severity="info">
                    このレストランの位置情報は利用できません。
                  </Alert>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default RestaurantDetailPage;
