const DB = require('../models/DBModel')
const ListingService = require('../services/ListingService')
const ImageService = require('../services/ImageService')
const Utils = require('../utils/Utils')

const Listing = DB.listing
const Property = DB.property
const { Op } = DB.Sequelize

exports.create = (req, res, next) => {
  if (!req.body.property_id) {
    res.status(400).send({ message: 'Content can not be empty!' })
  }

  Listing.create(req.body)
    .then(data => res.send(data))
    .catch(next)
}

exports.delete = (req, res, next) => {
  const { id } = req.params

  Listing.destroy({ where: { id } })
    .then(num =>
      num === 1
        ? res.send({ message: 'Listing was deleted successfully!' })
        : res.send({ message: `Cannot delete Listing with id=${id}.` })
    )
    .catch(next)
}

exports.update = (req, res, next) => {
  const { id } = req.params

  Listing.update(req.body, { where: { id } })
    .then(num =>
      num === 1
        ? res.send({ message: 'Listing was updated successfully.' })
        : res.send({ message: `Cannot update Listing with id=${id}.` })
    )
    .catch(next)
}

exports.findAll = (req, res, next) => {
  Listing.findAll({ where: req.query })
    .then(data => res.send(data))
    .catch(next)
}

exports.findAllByInterest = (req, res, next) => {
  Listing.findAll({
    where: req.query,
    include: [
      {
        model: Property,
        attributes: [],
        where: {
          interest: req.params.interest
        }
      }
    ],
    order: [['property_id', 'ASC']]
  })
    .then(data => res.send(data))
    .catch(next)
}

exports.findAllByPartialUrl = (req, res, next) => {
  const likeStatements = req.body.map(p => ({ [Op.like]: `%${p}%` }))

  Listing.findAll({
    where: {
      url: {
        [Op.or]: likeStatements
      }
    }
  })
    .then(data => res.send(data))
    .catch(next)
}

exports.findAllByParams = (req, res, next) => {
  const listings = req.body.map(async l => {
    if (l.address) {
      const addressObj = await Utils.parseAddress(l.address)
      const newL = {
        ...l,
        ...Object.fromEntries(
          Object.entries(addressObj).map(([k, v]) => [`$property.${k}$`, v])
        )
      }
      delete newL.address
      return newL
    }
    return l
  })

  Promise.all(listings)
    .then(listingsResolved =>
      Listing.findAll({
        where: {
          [Op.or]: listingsResolved
        },
        include: [
          {
            model: Property
          }
        ]
      })
    )
    .then(data => res.send(data))
    .catch(next)
}

exports.getUpdatedSuumoBukkenUrls = (req, res, next) => {
  const urls = req.body.map(async url =>
    ListingService.getUpdatedSuumoBukkenUrlFromPage(url)
  )

  Promise.all(urls)
    .then(urlsResolved => res.send(Object.assign(...urlsResolved)))
    .catch(next)
}

exports.getSumaityBukkenRedirect = async (req, res, next) => {
  const { url } = req.body

  ListingService.getSumaityBuildingUrlFromPage(url)
    .then(bldgUrl => res.send({ bldgUrl }))
    .catch(next)
}

exports.getImages = async (req, res, next) => {
  const { url } = req.body

  ImageService.getImagesFromUrl(url)
    .then(output => res.send(output))
    .catch(next)
}
