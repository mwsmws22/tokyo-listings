const OneOffService = require('../services/OneOffService')
const DB = require('../models/DBModel')

const Property = DB.property
const { Op } = DB.Sequelize

exports.getSuumoParamsHierarchy = (req, res, next) => {
  OneOffService.getSuumoParamsHierarchy()
    .then(output => {
      res.header('Content-Type', 'application/json')
      return res.send(JSON.stringify(output, null, 4))
    })
    .catch(next)
}

exports.getSuumoSearchUrlsForAllProperties = async (req, res, next) => {
  const properties = await Property.findAll({
    where: {
      prefecture: {
        [Op.eq]: '東京都'
      }
    }
  })

  OneOffService.getSuumoSearchUrlsForAllProperties(properties)
    .then(output => {
      res.header('Content-Type', 'application/json')
      return res.send(JSON.stringify(output, null, 4))
    })
    .catch(next)
}
