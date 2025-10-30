import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#D63C3C',
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