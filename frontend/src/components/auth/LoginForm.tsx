import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useLoginMutation } from '../../store/services/authApi';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password }).unwrap();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Failed to login:', err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        ログイン
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ログインに失敗しました。ユーザー名とパスワードを確認してください。
        </Alert>
      )}
      
      <TextField
        margin="normal"
        required
        fullWidth
        id="username"
        label="ユーザー名"
        name="username"
        autoComplete="username"
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="パスワード"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'ログイン'}
      </Button>
    </Box>
  );
};

export default LoginForm;
