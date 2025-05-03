import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <RestaurantIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          日本のレストラン情報
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            ホーム
          </Button>
          <Button color="inherit" component={RouterLink} to="/restaurants">
            レストラン一覧
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
