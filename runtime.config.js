import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// 🔧 取得 __dirname 等效
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
console.log('[DEBUG] API_URL:', process.env.API_URL)
if (!process.env.API_URL) {
  console.warn('[WARN] API_URL is not set! Using default fallback...')
}

const config = {
  API_URL: process.env.API_URL || 'http://localhost:3005/api',
}

const outputPath = path.join(process.cwd(), 'public/runtime-config.json')

fs.writeFileSync(outputPath, JSON.stringify(config, null, 2))

console.log('[RUNTIME CONFIG] Wrote runtime-config.json')
