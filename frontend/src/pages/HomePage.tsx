import React from 'react';
import { Typography, Box, Button, Container, Grid, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MapIcon from '@mui/icons-material/Map';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          日本のレストラン情報
        </Typography>
        <Typography variant="h5" component="h2" color="text.secondary" paragraph>
          お好みのレストランを簡単に探索できるプラットフォーム
        </Typography>
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to="/restaurants"
          startIcon={<SearchIcon />}
          sx={{ mt: 2 }}
        >
          レストランを探す
        </Button>
      </Box>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <SearchIcon color="primary" sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" component="h3" gutterBottom>
              簡単検索
            </Typography>
            <Typography variant="body1">
              名前、料理の種類、場所などで簡単にレストランを検索できます。
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <RestaurantIcon color="primary" sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" component="h3" gutterBottom>
              詳細情報
            </Typography>
            <Typography variant="body1">
              営業時間、価格帯、特別機能など、レストランの詳細情報を確認できます。
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <MapIcon color="primary" sx={{ fontSize: 60 }} />
            </Box>
            <Typography variant="h5" component="h3" gutterBottom>
              マップ表示
            </Typography>
            <Typography variant="body1">
              レストランの位置をマップで確認し、周辺情報も把握できます。
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;
