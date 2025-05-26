import React from 'react';
import QrScanner from './components/QrScanner';
import { CssBaseline, Container } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="md">
        <QrScanner />
      </Container>
    </>
  );
}

export default App;