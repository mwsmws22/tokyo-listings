const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()

const StringUtils = require('./app/utils/StringUtils')

StringUtils.initialize()

const db = require('./app/models')

db.sequelize.sync()

require('dotenv').config()

const { PORT } = process.env

const corsOptions = {
  origin: [
    'http://localhost:8081',
    'https://realestate.yahoo.co.jp',
    'https://suumo.jp',
    'https://sumaity.com',
    'https://www.r-store.jp'
  ]
}

app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

require('./app/routes/listing-routes')(app)
require('./app/routes/property-routes')(app)
require('./app/routes/scraping-routes')(app)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})
