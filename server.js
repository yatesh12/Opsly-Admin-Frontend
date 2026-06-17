import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Serve static files with /admin prefix (for deployment behind nginx at sub-path)
app.use('/admin', express.static(path.join(__dirname, 'dist')))
// Also serve from root (for standalone deployment like Railway at its own domain)
app.use(express.static(path.join(__dirname, 'dist')))

// SPA fallback for /admin/* routes
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
// SPA fallback for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Admin frontend serving on port ${PORT}`)
})
