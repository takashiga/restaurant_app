import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Typography, Box, Container, Grid, Card, CardContent, 
  CardMedia, CardActionArea, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Pagination,
  Tabs, Tab, Slider, Chip, Paper, Divider, Tooltip, Alert,
  Skeleton, useTheme, useMediaQuery
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import MapIcon from '@mui/icons-material/Map';
import ListIcon from '@mui/icons-material/List';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { FixedSizeGrid } from 'react-window';
import { 
  useGetRestaurantsQuery, 
  useSearchRestaurantsQuery, 
  useGetCuisineTypesQuery,
  useGetSpecialFeaturesQuery,
  RestaurantSearchParams,
  RestaurantSearchKeywordParams
} from '../store/services/restaurantApi';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RestaurantListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchMode, setSearchMode] = useState<'filter' | 'keyword'>('filter');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<number, boolean>>({});
  const [imageErrorStates, setImageErrorStates] = useState<Record<number, boolean>>({});
  
  const [filterParams, setFilterParams] = useState<RestaurantSearchParams>({
    name: '',
    cuisine_type: '',
    area: '',
    min_price: undefined,
    max_price: undefined,
    special_feature: '',
    limit: itemsPerPage,
    skip: 0
  });
  
  const [keywordParams, setKeywordParams] = useState<RestaurantSearchKeywordParams>({
    q: '',
    limit: itemsPerPage,
    skip: 0
  });
  
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  const cuisineImageMap = useMemo(() => ({
    '寿司': 'sushi',
    'ラーメン': 'ramen',
    '焼肉': 'yakiniku',
    'イタリアン': 'italian',
    'フレンチ': 'french',
    '和食': 'japanese',
    '中華': 'chinese',
    'カフェ': 'cafe',
    'バー': 'bar',
    '居酒屋': 'izakaya',
    'ファミレス': 'family-restaurant',
    'カレー': 'curry',
    'ステーキ': 'steak',
    'ハンバーガー': 'burger',
    'パスタ': 'pasta',
    'ピザ': 'pizza',
    'デザート': 'dessert',
    '韓国料理': 'korean',
    'タイ料理': 'thai',
    'ベトナム料理': 'vietnamese',
    'インド料理': 'indian',
    'メキシコ料理': 'mexican',
    '洋食': 'western',
    'その他': 'restaurant'
  }), []);
  
  const getRestaurantImage = (restaurant: any) => {
    const cuisineType = restaurant.cuisine_types && 
                       Array.isArray(restaurant.cuisine_types) && 
                       restaurant.cuisine_types.length > 0 &&
                       restaurant.cuisine_types[0]?.name
      ? restaurant.cuisine_types[0].name
      : 'restaurant';
    
    // Type-safe access to cuisineImageMap with fallback
    let imageKeyword = 'food';
    if (cuisineType in cuisineImageMap) {
      imageKeyword = cuisineImageMap[cuisineType as keyof typeof cuisineImageMap];
    }
    
    const restaurantId = restaurant.id || 1;
    const imageId = (restaurantId % 30) + 1; // Limit to 30 different images for better caching
    
    return `https://source.unsplash.com/collection/4316748/300x200?${encodeURIComponent(imageKeyword)}&sig=${imageId}`;
  };
  
  const handleImageLoad = (restaurantId: number) => {
    console.log(`Image loaded for restaurant ${restaurantId}`);
    setImageLoadingStates(prev => ({
      ...prev,
      [restaurantId]: false // Set to false when loaded
    }));
  };
  
  const handleImageError = (restaurantId: number) => {
    console.log(`Image error for restaurant ${restaurantId}`);
    setImageErrorStates(prev => ({
      ...prev,
      [restaurantId]: true
    }));
    setImageLoadingStates(prev => ({
      ...prev,
      [restaurantId]: false // Also set loading to false on error
    }));
  };
  
  const { data: cuisineTypes = [] } = useGetCuisineTypesQuery();
  const { data: specialFeatures = [] } = useGetSpecialFeaturesQuery();
  
  const { 
    data: filteredRestaurants = [], 
    isLoading: isLoadingFiltered,
    isFetching: isFetchingFiltered
  } = useGetRestaurantsQuery(filterParams, {
    skip: searchMode !== 'filter'
  });
  
  const { 
    data: keywordRestaurants = [], 
    isLoading: isLoadingKeyword,
    isFetching: isFetchingKeyword
  } = useSearchRestaurantsQuery(keywordParams, {
    skip: searchMode !== 'keyword' || !keywordParams.q
  });
  
  const restaurants = searchMode === 'keyword' ? keywordRestaurants : filteredRestaurants;
  const isLoading = searchMode === 'keyword' ? isLoadingKeyword : isLoadingFiltered;
  const isFetching = searchMode === 'keyword' ? isFetchingKeyword : isFetchingFiltered;
  
  const getColumnCount = useCallback(() => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  }, [isMobile, isTablet]);
  
  const columnCount = getColumnCount();
  const rowCount = Math.ceil((restaurants.length / columnCount));
  
  
  useEffect(() => {
    const newLoadingStates: Record<number, boolean> = {};
    
    restaurants.forEach(restaurant => {
      newLoadingStates[restaurant.id] = true;
    });
    
    setImageLoadingStates(newLoadingStates);
    setImageErrorStates({});
  }, [restaurants]);

  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation({ lat: 35.6895, lng: 139.6917 });
        }
      );
    } else {
      setUserLocation({ lat: 35.6895, lng: 139.6917 });
    }
  }, []);
  
  useEffect(() => {
    if (searchMode === 'filter') {
      setFilterParams(prev => ({
        ...prev,
        min_price: priceRange[0] > 0 ? priceRange[0] : undefined,
        max_price: priceRange[1] < 10000 ? priceRange[1] : undefined,
        special_feature: selectedFeatures.length > 0 ? selectedFeatures[0] : '',
        skip: (page - 1) * itemsPerPage,
        limit: itemsPerPage
      }));
    }
  }, [priceRange, selectedFeatures, page, searchMode, itemsPerPage]);
  
  useEffect(() => {
    if (searchMode === 'keyword') {
      setKeywordParams(prev => ({
        ...prev,
        skip: (page - 1) * itemsPerPage,
        limit: itemsPerPage
      }));
    }
  }, [page, searchMode, itemsPerPage]);
  
  useEffect(() => {
    if (restaurants && Array.isArray(restaurants) && restaurants.length > 0) {
      console.log(`Initializing image states for ${restaurants.length} restaurants`);
      
      const initialLoadingStates: Record<number, boolean> = {};
      const initialErrorStates: Record<number, boolean> = {};
      
      restaurants.forEach(restaurant => {
        if (restaurant && typeof restaurant.id === 'number') {
          initialLoadingStates[restaurant.id] = true;
          initialErrorStates[restaurant.id] = false;
          
          const img = new Image();
          img.src = getRestaurantImage(restaurant);
          img.onload = () => handleImageLoad(restaurant.id);
          img.onerror = () => handleImageError(restaurant.id);
        }
      });
      
      setImageLoadingStates(initialLoadingStates);
      setImageErrorStates(initialErrorStates);
    }
  }, [restaurants]);
  
  const handleSearchModeChange = (_event: React.SyntheticEvent, newMode: 'filter' | 'keyword') => {
    setSearchMode(newMode);
    setPage(1);
  };
  
  const handleViewModeChange = (_event: React.SyntheticEvent, newMode: 'list' | 'map') => {
    console.log('handleViewModeChange called with newMode:', newMode);
    setViewMode(newMode);
  };
  
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFilterParams({
      ...filterParams,
      [name as string]: value,
    });
  };
  
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordParams({
      ...keywordParams,
      q: e.target.value,
    });
  };
  
  const handlePriceRangeChange = (_event: Event, newValue: number | number[]) => {
    setPriceRange(newValue as [number, number]);
  };
  
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature) 
        : [...prev, feature]
    );
  };
  
  const handleSearch = () => {
    setPage(1);
  };
  
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleRestaurantClick = (id: number) => {
    console.log('handleRestaurantClick called with id:', id);
    try {
      navigate(`/restaurants/${id}`);
      console.log('Navigation attempted to:', `/restaurants/${id}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };
  
  const handleGetCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    
    if (!navigator.geolocation) {
      setLocationError('位置情報が利用できません。お使いのブラウザは位置情報をサポートしていません。');
      setLocationLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Geolocation retrieved:', position.coords.latitude, position.coords.longitude);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        
        setFilterParams(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius: 2.0 // Ensure radius is set
        }));
        setLocationLoading(false);
        handleSearch();
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = '位置情報の取得に失敗しました。';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '位置情報へのアクセスが拒否されました。ブラウザの設定で位置情報の利用を許可してください。';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置情報が取得できませんでした。再度お試しください。';
            break;
          case error.TIMEOUT:
            errorMessage = '位置情報の取得がタイムアウトしました。再度お試しください。';
            break;
        }
        setLocationError(errorMessage);
        setLocationLoading(false);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };
  
  const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  
  const RestaurantCell = useCallback(({ columnIndex, rowIndex, style, data }: { columnIndex: number, rowIndex: number, style: React.CSSProperties, data: any }) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= data.length) return null;
    
    const restaurant = data[index];
    if (!restaurant) return null;
    
    return (
      <div style={{
        ...style,
        padding: '12px',
        boxSizing: 'border-box'
      }}>
        <Card 
          sx={{ 
            height: '100%',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: 6
            }
          }}
          onClick={() => handleRestaurantClick(restaurant.id)}
          data-testid={`restaurant-card-${restaurant.id}`}
        >
          <CardActionArea>
            {imageErrorStates[restaurant.id] ? (
              <Box 
                sx={{ 
                  height: 140, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'grey.200' 
                }}
              >
                <ImageNotSupportedIcon sx={{ fontSize: 40, color: 'grey.500' }} />
              </Box>
            ) : (
              <>
                {imageLoadingStates[restaurant.id] && (
                  <Skeleton 
                    variant="rectangular" 
                    height={140} 
                    animation="wave" 
                    sx={{ 
                      bgcolor: 'grey.200',
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4
                    }} 
                  />
                )}
                <CardMedia
                  component="img"
                  height="140"
                  image={getRestaurantImage(restaurant)}
                  alt={restaurant.restaurant_name}
                  loading="lazy"
                  sx={{ 
                    display: imageLoadingStates[restaurant.id] ? 'none' : 'block',
                    objectFit: 'cover',
                    transition: 'opacity 0.3s ease-in-out',
                    opacity: 0.9,
                    '&:hover': {
                      opacity: 1
                    },
                    backgroundColor: 'grey.100'
                  }}
                  onLoad={() => handleImageLoad(restaurant.id)}
                  onError={() => handleImageError(restaurant.id)}
                />
              </>
            )}
            <CardContent>
              <Typography gutterBottom variant="h6" component="div" noWrap>
                {restaurant.restaurant_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {restaurant.cuisine_types.map((c: { id: number, name: string }) => c.name).join(', ')}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {restaurant.address}
              </Typography>
              {restaurant.price_range_dinner && (
                <Typography variant="body2" color="text.secondary">
                  <RestaurantIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {restaurant.price_range_dinner}
                </Typography>
              )}
              {restaurant.special_features.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {restaurant.special_features.slice(0, 2).map((feature: { id: number, name: string }) => (
                    <Chip key={feature.id} label={feature.name} size="small" />
                  ))}
                  {restaurant.special_features.length > 2 && (
                    <Chip label={`+${restaurant.special_features.length - 2}`} size="small" />
                  )}
                </Box>
              )}
            </CardContent>
          </CardActionArea>
        </Card>
      </div>
    );
  }, [columnCount, handleRestaurantClick, imageErrorStates, imageLoadingStates, handleImageLoad, handleImageError, getRestaurantImage]);
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          レストラン一覧
        </Typography>
        
        {/* View Mode Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={viewMode} 
            onChange={handleViewModeChange} 
            aria-label="view mode"
            data-testid="view-mode-tabs"
          >
            <Tab icon={<ListIcon />} label="リスト" value="list" data-testid="list-tab" />
            <Tab icon={<MapIcon />} label="マップ" value="map" data-testid="map-tab" />
          </Tabs>
        </Box>
        
        {/* Search Mode Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={searchMode} onChange={handleSearchModeChange} aria-label="search mode">
            <Tab label="フィルター検索" value="filter" />
            <Tab label="キーワード検索" value="keyword" />
          </Tabs>
        </Box>
        
        {/* Search Forms */}
        <Paper sx={{ mb: 4, p: 2 }}>
          {searchMode === 'filter' ? (
            <>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="店舗名"
                    name="name"
                    value={filterParams.name}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>料理の種類</InputLabel>
                    <Select
                      name="cuisine_type"
                      value={filterParams.cuisine_type}
                      label="料理の種類"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value="">すべて</MenuItem>
                      {cuisineTypes.map(cuisine => (
                        <MenuItem key={cuisine.id} value={cuisine.name}>
                          {cuisine.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="エリア"
                    name="area"
                    value={filterParams.area}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>価格帯 (円)</Typography>
                  <Slider
                    value={priceRange}
                    onChange={handlePriceRangeChange}
                    valueLabelDisplay="auto"
                    min={0}
                    max={10000}
                    step={500}
                    marks={[
                      { value: 0, label: '0円' },
                      { value: 2500, label: '2,500円' },
                      { value: 5000, label: '5,000円' },
                      { value: 7500, label: '7,500円' },
                      { value: 10000, label: '10,000円+' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>特別機能</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {specialFeatures.map(feature => (
                      <Chip
                        key={feature.id}
                        label={feature.name}
                        onClick={() => handleFeatureToggle(feature.name)}
                        color={selectedFeatures.includes(feature.name) ? "primary" : "default"}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Tooltip title="現在地から検索">
                    <Button
                      variant="outlined"
                      startIcon={locationLoading ? <CircularProgress size={20} /> : <LocationOnIcon />}
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                    >
                      {locationLoading ? '位置情報取得中...' : '現在地から検索'}
                    </Button>
                  </Tooltip>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    disabled={isLoading || isFetching}
                  >
                    検索
                  </Button>
                </Box>
                {locationError && (
                  <Alert severity="error" onClose={() => setLocationError('')}>
                    {locationError}
                  </Alert>
                )}
              </Box>
            </>
          ) : (
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={10}>
                <TextField
                  fullWidth
                  label="キーワード検索"
                  name="q"
                  value={keywordParams.q}
                  onChange={handleKeywordChange}
                  variant="outlined"
                  size="small"
                  placeholder="店舗名、料理の種類、エリアなどで検索"
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={handleSearch}
                  disabled={isLoading || isFetching || !keywordParams.q}
                >
                  検索
                </Button>
              </Grid>
            </Grid>
          )}
        </Paper>
        
        {/* Results */}
        {isLoading || isFetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : restaurants.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Typography variant="h6" color="text.secondary">
              検索結果がありません
            </Typography>
          </Box>
        ) : viewMode === 'list' ? (
          <>
            <Box sx={{ height: 600, width: '100%' }}>
              <FixedSizeGrid
                columnCount={columnCount}
                rowCount={rowCount}
                width={window.innerWidth > 1200 ? 1200 - 48 : window.innerWidth - 48}
                height={550}
                columnWidth={window.innerWidth > 1200 ? (1200 - 48) / columnCount : (window.innerWidth - 48) / columnCount}
                rowHeight={350}
                itemData={restaurants.slice((page - 1) * itemsPerPage, page * itemsPerPage)}
              >
                {RestaurantCell}
              </FixedSizeGrid>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        ) : (
          <Box sx={{ height: '600px', width: '100%', mb: 4 }}>
            {userLocation && (
              <MapContainer 
                center={[userLocation.lat, userLocation.lng]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {restaurants.map(restaurant => (
                  restaurant.latitude && restaurant.longitude ? (
                    <Marker 
                      key={restaurant.id} 
                      position={[restaurant.latitude, restaurant.longitude]}
                    >
                      <Popup>
                        <Typography variant="subtitle1">{restaurant.restaurant_name}</Typography>
                        <Typography variant="body2">{restaurant.address}</Typography>
                        <Typography variant="body2">
                          {restaurant.cuisine_types.map(c => c.name).join(', ')}
                        </Typography>
                        {restaurant.price_range_dinner && (
                          <Typography variant="body2">
                            価格帯: {restaurant.price_range_dinner}
                          </Typography>
                        )}
                        <Button 
                          size="small" 
                          onClick={() => handleRestaurantClick(restaurant.id)}
                          sx={{ mt: 1 }}
                        >
                          詳細を見る
                        </Button>
                      </Popup>
                    </Marker>
                  ) : null
                ))}
              </MapContainer>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default RestaurantListPage;
