import React, { useState } from 'react';
import { 
  Typography, Box, Container, Paper, CircularProgress, 
  Alert, Button, Tabs, Tab, Divider, Chip, 
  List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Dialog, DialogActions, DialogContent, 
  DialogContentText, DialogTitle
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useGetUserReservationsQuery, useCancelReservationMutation } from '../store/services/reservationApi';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import PersonIcon from '@mui/icons-material/Person';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reservation-tabpanel-${index}`}
      aria-labelledby={`reservation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ReservationsPage: React.FC = () => {
  const { data: reservations, isLoading, error } = useGetUserReservationsQuery();
  const [cancelReservation] = useCancelReservationMutation();
  const navigate = useNavigate();
  
  const [tabValue, setTabValue] = useState(0);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCancelDialogOpen = (reservationId: number) => {
    setSelectedReservationId(reservationId);
    setCancelDialogOpen(true);
  };
  
  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false);
    setSelectedReservationId(null);
  };
  
  const handleCancelReservation = async () => {
    if (selectedReservationId) {
      try {
        await cancelReservation(selectedReservationId).unwrap();
        handleCancelDialogClose();
      } catch (error) {
        console.error('Failed to cancel reservation:', error);
      }
    }
  };
  
  const formatReservationTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip label="予約確定" color="success" size="small" />;
      case 'pending':
        return <Chip label="確認待ち" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="キャンセル済み" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  const upcomingReservations = reservations?.filter(
    r => r.status !== 'cancelled' && new Date(r.reservation_time) >= new Date()
  ) || [];
  
  const pastReservations = reservations?.filter(
    r => r.status !== 'cancelled' && new Date(r.reservation_time) < new Date()
  ) || [];
  
  const cancelledReservations = reservations?.filter(
    r => r.status === 'cancelled'
  ) || [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            <CalendarMonthIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
            予約一覧
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
            予約情報の取得に失敗しました。ネットワーク接続を確認するか、しばらく経ってからもう一度お試しください。
          </Alert>
        ) : reservations && reservations.length > 0 ? (
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="reservation tabs">
                <Tab label={`予約中 (${upcomingReservations.length})`} id="reservation-tab-0" />
                <Tab label={`過去の予約 (${pastReservations.length})`} id="reservation-tab-1" />
                <Tab label={`キャンセル済み (${cancelledReservations.length})`} id="reservation-tab-2" />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              {upcomingReservations.length > 0 ? (
                <List>
                  {upcomingReservations.map((reservation) => (
                    <React.Fragment key={reservation.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" component="span">
                                {reservation.restaurant_name}
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {getStatusChip(reservation.status)}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2" component="span">
                                  {formatReservationTime(reservation.reservation_time)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2" component="span">
                                  {reservation.party_size}人
                                </Typography>
                              </Box>
                              {reservation.notes && (
                                <Typography variant="body2" color="text.secondary">
                                  備考: {reservation.notes}
                                </Typography>
                              )}
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => navigate(`/restaurants/${reservation.restaurant_id}`)}
                              >
                                レストラン詳細
                              </Button>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            aria-label="cancel"
                            onClick={() => handleCancelDialogOpen(reservation.id)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    現在予約中のレストランはありません。
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {pastReservations.length > 0 ? (
                <List>
                  {pastReservations.map((reservation) => (
                    <React.Fragment key={reservation.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" component="span">
                                {reservation.restaurant_name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2" component="span">
                                  {formatReservationTime(reservation.reservation_time)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2" component="span">
                                  {reservation.party_size}人
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => navigate(`/restaurants/${reservation.restaurant_id}`)}
                              >
                                レストラン詳細
                              </Button>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    過去の予約はありません。
                  </Typography>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              {cancelledReservations.length > 0 ? (
                <List>
                  {cancelledReservations.map((reservation) => (
                    <React.Fragment key={reservation.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" component="span" sx={{ color: 'text.secondary' }}>
                                {reservation.restaurant_name}
                              </Typography>
                              <Box sx={{ ml: 2 }}>
                                {getStatusChip(reservation.status)}
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CalendarMonthIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2" component="span">
                                  {formatReservationTime(reservation.reservation_time)}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <PersonIcon fontSize="small" sx={{ mr: 1 }} />
                                <Typography variant="body2" component="span">
                                  {reservation.party_size}人
                                </Typography>
                              </Box>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => navigate(`/restaurants/${reservation.restaurant_id}`)}
                              >
                                レストラン詳細
                              </Button>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    キャンセルした予約はありません。
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CalendarMonthIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              予約がありません
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              レストランを探して、予約してみましょう。
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
      
      {/* キャンセル確認ダイアログ */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCancelDialogClose}
      >
        <DialogTitle>予約をキャンセルしますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この操作は取り消せません。本当に予約をキャンセルしますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose}>
            戻る
          </Button>
          <Button onClick={handleCancelReservation} color="error" autoFocus>
            キャンセルする
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReservationsPage;
