const db = require('../models')
const ListingService = require('../services/listing-service')

const Listing = db.listing
const Property = db.property
const { Op } = db.Sequelize
const Utils = require('../utils/Utils')

exports.create = (req, res) => {
  if (!req.body.property_id) {
    res.status(400).send({
      message: 'Content can not be empty!'
    })
    return
  }

  Listing.create(req.body)
    .then(data => {
      res.send(data)
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.delete = (req, res) => {
  const { id } = req.params

  Listing.destroy({
    where: { id }
  })
    .then(num => {
      if (num === 1) {
        res.send({
          message: 'Listing was deleted successfully!'
        })
      } else {
        res.send({
          message: `Cannot delete Listing with id=${id}.`
        })
      }
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.update = (req, res) => {
  const { id } = req.params

  Listing.update(req.body, {
    where: { id }
  })
    .then(num => {
      if (num === 1) {
        res.send({
          message: 'Listing was updated successfully.'
        })
      } else {
        res.send({
          message: `Cannot update Listing with id=${id}.`
        })
      }
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.findAll = (req, res) => {
  Listing.findAll({
    where: req.query
  })
    .then(data => {
      res.send(data)
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.findAllByInterest = (req, res) => {
  Listing.findAll({
    where: req.query,
    include: [
      { model: Property, attributes: [], where: { interest: req.params.interest } }
    ],
    order: [['property_id', 'ASC']]
  })
    .then(data => {
      res.send(data)
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.findAllByPartialUrl = (req, res) => {
  const likeStatements = req.body.map(p => ({ [Op.like]: `%${p}%` }))

  Listing.findAll({
    where: {
      url: {
        [Op.or]: likeStatements
      }
    }
  })
    .then(data => {
      res.send(data)
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.findAllByParams = (req, res) => {
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

  Promise.all(listings).then(listingsResolved => {
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
      .then(data => res.send(data))
      .catch(err =>
        res.status(500).send({
          message: err.message
        })
      )
  })
}

exports.getUpdatedSuumoBukkenUrls = (req, res) => {
  const urls = req.body.map(async url =>
    ListingService.getUpdatedSuumoBukkenUrlFromPage(url)
  )

  Promise.all(urls)
    .then(urlsResolved => {
      const response = Object.assign(...urlsResolved)
      res.send(response)
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}
