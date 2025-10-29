import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2EC4B6',
    },
    text: {
      primary: '#000000',
    },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
  direction: 'rtl',
});

export default theme; 