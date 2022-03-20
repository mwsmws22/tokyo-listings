const express = require('express')
const cors = require('cors')
const serveIndex = require('serve-index')
const path = require('path')
const DB = require('./app/models/DBModel')

const corsOptions = {
  origin: [
    'http://localhost:8081',
    'https://realestate.yahoo.co.jp',
    'https://suumo.jp',
    'https://sumaity.com',
    'https://www.r-store.jp',
    'https://www.realtokyoestate.co.jp',
    'https://www.athome.co.jp'
  ]
}

const app = express()

DB.sequelize.sync()

require('dotenv').config()
require('./app/utils/StringUtils')
require('./app/utils/ArrayUtils')

const { PORT, ARCHIVE } = process.env

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
  '/tokyo_apt',
  express.static(ARCHIVE, {
    setHeaders: (res, requestPath) => {
      const noExtension = !path.extname(requestPath)
      if (noExtension) res.setHeader('Content-Type', 'image/jpeg')
    }
  })
)

app.use('/tokyo_apt', serveIndex(ARCHIVE))

require('./app/routes/ListingRoutes')(app)
require('./app/routes/PropertyRoutes')(app)
require('./app/routes/ScrapingRoutes')(app)
require('./app/routes/OneOffRoutes')(app)

app.use((err, req, res, next) => res.status(500).json({ message: err.stack }))

app.listen(PORT, console.log(`Server is running on port ${PORT}.`))
