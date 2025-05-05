import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/slices/authSlice';

interface LoginFormProps {
  onSuccess?: () => void;
}

function LoginForm({ onSuccess }: LoginFormProps) {
  console.log('LoginForm rendering');
  
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    console.log('LoginForm mounted');
    
    const handleDocumentClick = (e: MouseEvent) => {
      console.log('Document click detected:', e.target);
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      console.log('LoginForm unmounted');
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const loginWithCredentials = async () => {
    console.log('Attempting direct login with credentials');
    
    if (!username || !password) {
      setErrorMessage('ユーザー名とパスワードを入力してください。');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      console.log('Sending login request to backend with:', { username, password });
      
      const response = await fetch('https://localhost:8000/api/v1/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });
      
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', response.status, errorText);
        throw new Error(`Login failed: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Login successful:', data);
      
      localStorage.setItem('token', data.access_token);
      console.log('Token saved to localStorage');
      
      dispatch(setCredentials({ token: data.access_token }));
      console.log('Credentials dispatched to Redux store');
      
      if (onSuccess) {
        onSuccess();
      } else {
        console.log('Navigating to home page');
        navigate('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('ログインに失敗しました。ユーザー名とパスワードを確認してください。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    console.log('Form submit event triggered:', e);
    e.preventDefault();
    console.log('Login form submitted');
    await loginWithCredentials();
  };

  const handleDebugLogin = () => {
    console.log('Debug login button clicked');
    loginWithCredentials();
  };

  const handleManualLogin = () => {
    console.log('Manual login button clicked');
    
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://localhost:8000/api/v1/auth/token';
    
    const usernameInput = document.createElement('input');
    usernameInput.type = 'hidden';
    usernameInput.name = 'username';
    usernameInput.value = username;
    
    const passwordInput = document.createElement('input');
    passwordInput.type = 'hidden';
    passwordInput.name = 'password';
    passwordInput.value = password;
    
    form.appendChild(usernameInput);
    form.appendChild(passwordInput);
    
    document.body.appendChild(form);
    console.log('Submitting form directly');
    form.submit();
  };

  console.log('LoginForm rendering complete');

  return (
    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        ログイン
      </Typography>
      
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
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
        onChange={(e) => {
          console.log('Username changed:', e.target.value);
          setUsername(e.target.value);
        }}
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
        onChange={(e) => {
          console.log('Password changed:', e.target.value);
          setPassword(e.target.value);
        }}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
        onClick={(e) => {
          console.log('Login button clicked:', e);
        }}
      >
        {isLoading ? <CircularProgress size={24} /> : 'ログイン'}
      </Button>
      
      <Button
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
        disabled={isLoading}
        onClick={(e) => {
          console.log('Debug login button clicked:', e);
          handleDebugLogin();
        }}
      >
        直接ログイン (デバッグ用)
      </Button>
      
      <Button
        fullWidth
        variant="outlined"
        color="warning"
        sx={{ mb: 2 }}
        disabled={isLoading}
        onClick={(e) => {
          console.log('Manual login button clicked:', e);
          handleManualLogin();
        }}
      >
        手動ログイン (フォーム直接送信)
      </Button>
    </Box>
  );
}

export default LoginForm;
