import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/icon/zaghlol.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon/icon.png" />
        <meta name="theme-color" content="#2EC4B6" />
        <meta name="description" content="Zaghlol Scoring System" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 