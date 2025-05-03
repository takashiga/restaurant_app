import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, logout } from '../store/slices/authSlice';
import { useGetMeQuery } from '../store/services/authApi';

const Header: React.FC = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useGetMeQuery(undefined, { skip: !isAuthenticated });
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    dispatch(logout());
    handleClose();
    navigate('/');
  };

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
          
          {isAuthenticated ? (
            <>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircleIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={open}
                onClose={handleClose}
              >
                <MenuItem component={RouterLink} to="/profile" onClick={handleClose}>
                  プロフィール
                </MenuItem>
                <MenuItem component={RouterLink} to="/favorites" onClick={handleClose}>
                  お気に入り
                </MenuItem>
                <MenuItem component={RouterLink} to="/reservations" onClick={handleClose}>
                  予約
                </MenuItem>
                <MenuItem component={RouterLink} to="/reviews" onClick={handleClose}>
                  レビュー
                </MenuItem>
                <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                ログイン
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                登録
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
