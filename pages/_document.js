import { Html, Head, Main, NextScript } from 'next/document'
import fs from 'fs'
import path from 'path'

export default function Document() {
  let runtimeConfig = {}

  try {
    const configPath = path.resolve(process.cwd(), 'public/runtime-config.json')
    const content = fs.readFileSync(configPath, 'utf-8')
    runtimeConfig = JSON.parse(content)
  } catch (err) {
    console.warn('[RUNTIME_CONFIG] Failed to load config file.', err)
  }
  return (
    <Html lang="en">
      <Head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__RUNTIME_CONFIG__ = ${JSON.stringify(
              runtimeConfig
            )};`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
