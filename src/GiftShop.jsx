import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Fade,
  Zoom,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CardGiftcard as GiftIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { zaghlolTheme } from './pointsConfig';
import { useRouter } from 'next/router';

const GiftShop = () => {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gifts');
      if (!response.ok) {
        throw new Error('Failed to fetch gifts');
      }
      const data = await response.json();
      setGifts(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching gifts:', error);
      setError('حدث خطأ أثناء جلب الهدايا');
    } finally {
      setLoading(false);
    }
  };

  const filteredGifts = gifts.filter(gift => {
    if (!gift.name) return false;
    const searchLower = searchTerm.toLowerCase();
    return gift.name.toLowerCase().includes(searchLower);
  });

  const handleRefresh = async () => {
    await fetchGifts();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: zaghlolTheme.background,
        py: 4,
        px: { xs: 2, md: 4 },
      }}
    >
      <Fade in={true}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <GiftIcon sx={{ color: zaghlolTheme.primary, fontSize: 40 }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: zaghlolTheme.text,
              }}
            >
              متجر الهدايا
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="تحديث البيانات">
              <IconButton
                onClick={handleRefresh}
                sx={{
                  color: zaghlolTheme.primary,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'rotate(180deg)',
                    backgroundColor: zaghlolTheme.secondary,
                  },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              onClick={() => router.push('/scores')}
              sx={{
                bgcolor: zaghlolTheme.accent,
                color: zaghlolTheme.surface,
                borderRadius: zaghlolTheme.borderRadius,
                px: 3,
                py: 1,
                fontWeight: 'bold',
                '&:hover': {
                  bgcolor: zaghlolTheme.accent,
                  opacity: 0.9,
                },
              }}
            >
              النقاط
            </Button>
          </Box>
        </Box>
      </Fade>

      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: zaghlolTheme.borderRadiusLarge,
          backgroundColor: zaghlolTheme.surface,
          mb: 4,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="ابحث عن هدية..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: zaghlolTheme.primary }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: zaghlolTheme.primary }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : filteredGifts.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد هدايا متاحة حالياً'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <AnimatePresence>
              {filteredGifts.map((gift, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={gift.id}>
                  <Zoom in={true} style={{ transitionDelay: `${index * 50}ms` }}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: zaghlolTheme.borderRadiusLarge,
                          border: `2px solid ${zaghlolTheme.primary}20`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: `0 12px 24px ${zaghlolTheme.primary}30`,
                            borderColor: zaghlolTheme.primary,
                          },
                        }}
                      >
                        {gift.imageUrl ? (
                          <CardMedia
                            component="img"
                            height="200"
                            image={gift.imageUrl}
                            alt={gift.name}
                            sx={{
                              objectFit: 'cover',
                              backgroundColor: zaghlolTheme.secondary,
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: 200,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: zaghlolTheme.secondary,
                            }}
                          >
                            <GiftIcon sx={{ fontSize: 80, color: zaghlolTheme.textSecondary }} />
                          </Box>
                        )}
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                              fontWeight: 'bold',
                              color: zaghlolTheme.text,
                              mb: 2,
                              minHeight: '3em',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {gift.name}
                          </Typography>
                          <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Chip
                              icon={<MoneyIcon />}
                              label={`${gift.price} فليكس`}
                              sx={{
                                backgroundColor: zaghlolTheme.primary,
                                color: zaghlolTheme.surface,
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                py: 2.5,
                                '& .MuiChip-icon': {
                                  color: zaghlolTheme.surface,
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Zoom>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default GiftShop;
