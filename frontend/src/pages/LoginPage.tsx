import React from 'react';
import { Container, Paper, Box, Typography, Link, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <LoginForm />
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            アカウントをお持ちでない方は{' '}
            <Link component={RouterLink} to="/register">
              こちら
            </Link>
            で登録できます。
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
