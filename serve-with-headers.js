// Development server with Cross-Origin Isolation headers for FFmpeg
const express = require('express')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

// Add COOP and COEP headers for FFmpeg support
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  next()
})

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')))

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'))
})

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with Cross-Origin Isolation enabled`)
  console.log(`🎬 FFmpeg support enabled`)
  console.log(`📱 Open http://localhost:${PORT}`)
  console.log('✅ COOP and COEP headers are set for FFmpeg support')
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

module.exports = app
