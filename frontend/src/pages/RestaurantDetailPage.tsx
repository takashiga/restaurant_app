import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Box, Container, Grid, Paper, Chip, 
  Divider, Rating, Button, CircularProgress, Alert,
  IconButton, Tooltip, TextField, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Tab, Tabs, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGetRestaurantByIdQuery } from '../store/services/restaurantApi';
import { useGetReviewsQuery, useCreateReviewMutation } from '../store/services/reviewApi';
import { useCheckFavoriteQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '../store/services/favoriteApi';
import { useCreateReservationMutation } from '../store/services/reservationApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import L from 'leaflet';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhoneIcon from '@mui/icons-material/Phone';
import LanguageIcon from '@mui/icons-material/Language';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import InfoIcon from '@mui/icons-material/Info';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`restaurant-tabpanel-${index}`}
      aria-labelledby={`restaurant-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RestaurantDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const restaurantId = parseInt(id || '0');
  const { data: restaurant, isLoading, error } = useGetRestaurantByIdQuery(restaurantId);
  const { data: reviews } = useGetReviewsQuery(restaurantId, { skip: !restaurantId });
  const { data: isFavorite } = useCheckFavoriteQuery(restaurantId, { skip: !isAuthenticated || !restaurantId });
  
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const [createReview] = useCreateReviewMutation();
  const [createReservation] = useCreateReservationMutation();
  
  const [tabValue, setTabValue] = useState(0);
  const [reviewRating, setReviewRating] = useState<number | null>(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reservationDate, setReservationDate] = useState<Date | null>(new Date());
  const [partySize, setPartySize] = useState(2);
  const [notes, setNotes] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false);
  
  const defaultPosition: [number, number] = [35.6812, 139.7671];
  
  const hasValidCoordinates = restaurant?.latitude && restaurant?.longitude;
  
  const position: [number, number] = hasValidCoordinates
    ? [restaurant.latitude!, restaurant.longitude!]
    : defaultPosition;

  const handleBack = () => {
    navigate(-1);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite(restaurantId).unwrap();
      } else {
        await addFavorite({ restaurant_id: restaurantId }).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };
  
  const handleReviewDialogOpen = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setReviewDialogOpen(true);
  };
  
  const handleReviewDialogClose = () => {
    setReviewDialogOpen(false);
    setReviewRating(0);
    setReviewComment('');
  };
  
  const handleReviewSubmit = async () => {
    if (!reviewRating) return;
    
    try {
      await createReview({
        restaurant_id: restaurantId,
        rating: reviewRating,
        comment: reviewComment
      }).unwrap();
      handleReviewDialogClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };
  
  const handleReservationDialogOpen = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setReservationDialogOpen(true);
  };
  
  const handleReservationDialogClose = () => {
    setReservationDialogOpen(false);
    setReservationDate(new Date());
    setPartySize(2);
    setNotes('');
  };
  
  const handleReservationSubmit = async () => {
    if (!reservationDate) return;
    
    try {
      await createReservation({
        restaurant_id: restaurantId,
        reservation_time: reservationDate.toISOString(),
        party_size: partySize,
        notes: notes
      }).unwrap();
      handleReservationDialogClose();
    } catch (error) {
      console.error('Failed to submit reservation:', error);
    }
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
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {restaurant.restaurant_name}
          </Typography>
          
          {isAuthenticated && (
            <Tooltip title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}>
              <IconButton 
                onClick={handleToggleFavorite}
                color={isFavorite ? "primary" : "default"}
                sx={{ ml: 2 }}
              >
                {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
          )}
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

        <Box sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="restaurant tabs">
              <Tab label="基本情報" id="restaurant-tab-0" aria-controls="restaurant-tabpanel-0" />
              <Tab label="レビュー" id="restaurant-tab-1" aria-controls="restaurant-tabpanel-1" />
              <Tab label="予約" id="restaurant-tab-2" aria-controls="restaurant-tabpanel-2" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
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
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">レビュー</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<StarIcon />}
                  onClick={handleReviewDialogOpen}
                >
                  レビューを書く
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {reviews && reviews.length > 0 ? (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                  {reviews.map((review) => (
                    <React.Fragment key={review.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" sx={{ mr: 1 }}>
                                {review.user_name || 'ユーザー'}
                              </Typography>
                              <Rating value={review.rating} readOnly size="small" />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                                sx={{ display: 'block', my: 1 }}
                              >
                                {review.comment}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(review.created_at).toLocaleDateString('ja-JP')}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    まだレビューがありません。最初のレビューを書いてみませんか？
                  </Typography>
                </Box>
              )}
            </Paper>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">予約</Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {restaurant.restaurant_name}の予約
                </Typography>
                <Typography variant="body1" paragraph>
                  オンラインで簡単に予約ができます。希望の日時と人数を選択してください。
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  startIcon={<CalendarMonthIcon />}
                  onClick={handleReservationDialogOpen}
                  sx={{ mt: 2 }}
                >
                  予約する
                </Button>
              </Box>
            </Paper>
          </TabPanel>
        </Box>
      </Box>
      
      {/* レビュー投稿ダイアログ */}
      <Dialog open={reviewDialogOpen} onClose={handleReviewDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>レビューを投稿</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {restaurant.restaurant_name}の体験を共有してください。
          </DialogContentText>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography component="legend" sx={{ mr: 2 }}>評価：</Typography>
            <Rating
              name="rating"
              value={reviewRating}
              onChange={(_event, newValue) => {
                setReviewRating(newValue);
              }}
              precision={0.5}
              size="large"
            />
          </Box>
          <TextField
            autoFocus
            margin="dense"
            id="review"
            label="コメント"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReviewDialogClose}>キャンセル</Button>
          <Button 
            onClick={handleReviewSubmit} 
            variant="contained"
            disabled={!reviewRating}
          >
            投稿する
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 予約ダイアログ */}
      <Dialog open={reservationDialogOpen} onClose={handleReservationDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>予約</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {restaurant.restaurant_name}の予約情報を入力してください。
          </DialogContentText>
          
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box sx={{ mb: 3 }}>
              <DateTimePicker
                label="予約日時"
                value={reservationDate}
                onChange={(newValue: Date | null) => setReservationDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="party-size-label">人数</InputLabel>
            <Select
              labelId="party-size-label"
              id="party-size"
              value={partySize}
              label="人数"
              onChange={(e) => setPartySize(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <MenuItem key={num} value={num}>{num}人</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="dense"
            id="notes"
            label="備考（アレルギーや特別なリクエストなど）"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReservationDialogClose}>キャンセル</Button>
          <Button 
            onClick={handleReservationSubmit} 
            variant="contained"
            disabled={!reservationDate}
          >
            予約する
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RestaurantDetailPage;
