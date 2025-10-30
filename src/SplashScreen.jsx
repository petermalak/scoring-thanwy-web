import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useRouter } from 'next/router';

const SplashScreen = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/scores');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(to bottom, #FFF4E6, #F7E0B2)',
      }}
    >
      <Box
        component="img"
        src="/icon/store.png"
        alt="دكانة عم زغلول"
        sx={{
          width: 180,
          height: 180,
          mb: 2.5,
        }}
      />
      <Typography
        variant="h4"
        sx={{
          fontWeight: 'bold',
          color: '#8B5E3C',
          letterSpacing: '1.2px',
          textAlign: 'center',
        }}
      >
        دكانة عم زغلول
      </Typography>
    </Box>
  );
};

export default SplashScreen; 