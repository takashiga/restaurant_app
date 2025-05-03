import React from 'react';
import { Container, Paper, Box, Typography, Link, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <RegisterForm />
        <Box mt={2} textAlign="center">
          <Typography variant="body2">
            既にアカウントをお持ちの方は{' '}
            <Link component={RouterLink} to="/login">
              こちら
            </Link>
            からログインできます。
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
