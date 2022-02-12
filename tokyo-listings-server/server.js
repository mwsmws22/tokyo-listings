const express = require('express')
const cors = require('cors')
const DB = require('./app/models/DBModel')

const corsOptions = {
  origin: [
    'http://localhost:8081',
    'https://realestate.yahoo.co.jp',
    'https://suumo.jp',
    'https://sumaity.com',
    'https://www.r-store.jp'
  ]
}

const app = express()

DB.sequelize.sync()

require('dotenv').config()
require('./app/utils/StringUtils')

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

require('./app/routes/ListingRoutes')(app)
require('./app/routes/PropertyRoutes')(app)
require('./app/routes/ScrapingRoutes')(app)

app.use((err, req, res, next) => res.status(500).json({ message: err.stack }))

const { PORT } = process.env
app.listen(PORT, console.log(`Server is running on port ${PORT}.`))
