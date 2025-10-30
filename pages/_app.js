import Head from 'next/head'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../src/theme'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>دكانة عم زغلول</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
} 