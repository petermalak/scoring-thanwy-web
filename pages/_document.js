import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon/store.png" />
        <meta name="theme-color" content="#D63C3C" />
        <meta name="description" content="دكانة عم زغلول" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 