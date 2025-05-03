import React, { useState } from 'react';
import { 
  Typography, Box, Container, Paper, CircularProgress, 
  Alert, Button, TextField, Grid, Divider, Snackbar
} from '@mui/material';
import { useGetMeQuery } from '../store/services/authApi';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const ProfilePage: React.FC = () => {
  const { data: user, isLoading, error } = useGetMeQuery();
  
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  React.useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);
  
  const handleEditToggle = () => {
    if (editMode) {
      if (user) {
        setUsername(user.username);
        setEmail(user.email);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
    setEditMode(!editMode);
  };
  
  const validateForm = () => {
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('新しいパスワードが一致しません');
      return false;
    }
    
    if (newPassword && !currentPassword) {
      setPasswordError('現在のパスワードを入力してください');
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
    
    
    setSnackbarMessage('プロフィールが更新されました');
    setSnackbarOpen(true);
    setEditMode(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
          マイプロフィール
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            プロフィール情報の取得に失敗しました。ネットワーク接続を確認するか、しばらく経ってからもう一度お試しください。
          </Alert>
        ) : user ? (
          <Paper sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button 
                variant={editMode ? "outlined" : "contained"} 
                onClick={handleEditToggle}
              >
                {editMode ? 'キャンセル' : 'プロフィールを編集'}
              </Button>
            </Box>
            
            {editMode ? (
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      id="username"
                      label="ユーザー名"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      id="email"
                      label="メールアドレス"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        パスワード変更（任意）
                      </Typography>
                    </Divider>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="currentPassword"
                      label="現在のパスワード"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="newPassword"
                      label="新しいパスワード"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="confirmPassword"
                      label="新しいパスワード（確認）"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={!!passwordError}
                      helperText={passwordError}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                    >
                      保存する
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      <PersonIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      ユーザー名
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="body1">{user.username}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      メールアドレス
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="body1">{user.email}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      <CalendarTodayIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                      登録日
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Typography variant="body1">{formatDate(user.created_at)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        ) : (
          <Alert severity="warning">
            ユーザー情報が見つかりません。ログインしてください。
          </Alert>
        )}
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ProfilePage;
