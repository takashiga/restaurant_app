import React, { useState } from 'react';
import { 
  Typography, Box, Container, Paper, CircularProgress, 
  Alert, Button, Rating, Divider, IconButton, Dialog,
  DialogActions, DialogContent, DialogContentText, DialogTitle,
  List, ListItem, ListItemText, ListItemSecondaryAction, TextField
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGetUserReviewsQuery, useUpdateReviewMutation, useDeleteReviewMutation } from '../store/services/reviewApi';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RestaurantIcon from '@mui/icons-material/Restaurant';

const ReviewsPage: React.FC = () => {
  const { data: reviews, isLoading, error } = useGetUserReviewsQuery();
  const [updateReview] = useUpdateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const navigate = useNavigate();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [editRating, setEditRating] = useState<number | null>(0);
  const [editComment, setEditComment] = useState('');

  const handleEditDialogOpen = (review: any) => {
    setSelectedReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
    setEditDialogOpen(true);
  };
  
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedReview(null);
    setEditRating(0);
    setEditComment('');
  };
  
  const handleDeleteDialogOpen = (review: any) => {
    setSelectedReview(review);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedReview(null);
  };
  
  const handleUpdateReview = async () => {
    if (!selectedReview || !editRating) return;
    
    try {
      await updateReview({
        id: selectedReview.id,
        review: {
          rating: editRating,
          comment: editComment
        }
      }).unwrap();
      handleEditDialogClose();
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  };
  
  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    
    try {
      await deleteReview(selectedReview.id).unwrap();
      handleDeleteDialogClose();
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            <StarIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
            マイレビュー
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/restaurants')}
          >
            レストランを探す
          </Button>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            レビューの取得に失敗しました。ネットワーク接続を確認するか、しばらく経ってからもう一度お試しください。
          </Alert>
        ) : reviews && reviews.length > 0 ? (
          <Paper sx={{ p: 3 }}>
            <List>
              {reviews.map((review) => (
                <React.Fragment key={review.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" component="span" sx={{ mr: 2 }}>
                            {'レストラン'}
                          </Typography>
                          <Rating value={review.rating} readOnly precision={0.5} />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            component="span"
                            variant="body1"
                            color="text.primary"
                            sx={{ display: 'block', my: 1 }}
                          >
                            {review.comment}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(review.created_at)}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<RestaurantIcon />}
                              onClick={() => navigate(`/restaurants/${review.restaurant_id}`)}
                            >
                              レストラン詳細
                            </Button>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleEditDialogOpen(review)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => handleDeleteDialogOpen(review)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <StarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              レビューがありません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              レストランを訪れて、レビューを投稿してみましょう。
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/restaurants')}
              sx={{ mt: 2 }}
            >
              レストランを探す
            </Button>
          </Paper>
        )}
      </Box>
      
      {/* レビュー編集ダイアログ */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>レビューを編集</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {'レストラン'}のレビューを編集します。
          </DialogContentText>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography component="legend" sx={{ mr: 2 }}>評価：</Typography>
            <Rating
              name="edit-rating"
              value={editRating}
              onChange={(_event, newValue) => {
                setEditRating(newValue);
              }}
              precision={0.5}
              size="large"
            />
          </Box>
          <TextField
            autoFocus
            margin="dense"
            id="edit-comment"
            label="コメント"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>キャンセル</Button>
          <Button 
            onClick={handleUpdateReview} 
            variant="contained"
            disabled={!editRating}
          >
            更新する
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* レビュー削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>レビューを削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この操作は取り消せません。本当にレビューを削除しますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>
            キャンセル
          </Button>
          <Button onClick={handleDeleteReview} color="error" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReviewsPage;
