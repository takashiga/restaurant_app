import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useRegisterMutation } from '../../store/services/authApi';
import { useNavigate } from 'react-router-dom';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [register, { isLoading, error }] = useRegisterMutation();
  const navigate = useNavigate();

  const validateForm = () => {
    if (password !== confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await register({ username, email, password }).unwrap();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Failed to register:', err);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        アカウント登録
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          登録に失敗しました。ユーザー名またはメールアドレスが既に使用されている可能性があります。
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
        id="email"
        label="メールアドレス"
        name="email"
        autoComplete="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="パスワード"
        type="password"
        id="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="パスワード（確認）"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={!!passwordError}
        helperText={passwordError}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : '登録'}
      </Button>
    </Box>
  );
};

export default RegisterForm;
