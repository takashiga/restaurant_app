import React, { useState } from 'react';
import { Container, Typography, Button, Box, Paper, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

const TestAuthPage: React.FC = () => {
  const [token, setToken] = useState<string>('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImV4cCI6MTc0NjI4NjQ2Nn0.CwEakdL0uPRXi6UAngeRgFUInK82idedBlcfxhX9rYA');
  const [result, setResult] = useState<string>('Click a button to test...');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSetToken = () => {
    console.log('handleSetToken called');
    try {
      localStorage.setItem('token', token);
      console.log('Token set in localStorage:', token);
      dispatch(setCredentials({ token }));
      setResult(`Token set in localStorage: ${token}`);
      console.log('Result state updated');
      
      const storedToken = localStorage.getItem('token');
      console.log('Verification - token in localStorage:', storedToken);
    } catch (error) {
      console.error('Error setting token:', error);
      setResult(`Error setting token: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem('token');
    setResult('Token cleared from localStorage');
  };

  const handleCheckToken = () => {
    const storedToken = localStorage.getItem('token');
    setResult(storedToken 
      ? `Token in localStorage: ${storedToken}` 
      : 'No token found in localStorage');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  const handleTestMe = async () => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      setResult('No token found. Please set token first.');
      return;
    }
    
    setResult('Testing /me endpoint...');
    
    try {
      const response = await fetch('https://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      });
      
      const responseText = await response.text();
      let resultText = `Status: ${response.status}\n`;
      
      try {
        const data = JSON.parse(responseText);
        resultText += `Response: ${JSON.stringify(data, null, 2)}`;
      } catch (e) {
        resultText += `Response (not JSON): ${responseText}`;
      }
      
      setResult(resultText);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          認証テスト
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            curl テストからのトークン:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={handleSetToken}>
              トークンを保存
            </Button>
            <Button variant="outlined" color="secondary" onClick={handleClearToken}>
              トークンをクリア
            </Button>
            <Button variant="outlined" onClick={handleCheckToken}>
              トークンを確認
            </Button>
            <Button variant="contained" color="success" onClick={handleGoToHome}>
              ホームページへ
            </Button>
            <Button variant="outlined" color="info" onClick={handleTestMe}>
              /me エンドポイントをテスト
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            結果:
          </Typography>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              bgcolor: '#f5f5f5', 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto'
            }}
          >
            {result}
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestAuthPage;
