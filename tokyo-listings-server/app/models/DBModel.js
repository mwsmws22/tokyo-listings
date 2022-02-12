const Sequelize = require('sequelize')
const DBConfig = require('../config/DBConfig')

const sequelize = new Sequelize(DBConfig.DB, DBConfig.USER, DBConfig.PASSWORD, {
  host: DBConfig.HOST,
  dialect: DBConfig.dialect,
  operatorsAliases: 0,
  pool: {
    max: DBConfig.pool.max,
    min: DBConfig.pool.min,
    acquire: DBConfig.pool.acquire,
    idle: DBConfig.pool.idle
  }
})

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.property = require('./PropertyModel')(sequelize, Sequelize)
db.listing = require('./ListingModel')(sequelize, Sequelize)

db.property.hasMany(db.listing, { foreignKey: 'property_id' })
db.listing.belongsTo(db.property, { foreignKey: 'property_id' })

module.exports = db
