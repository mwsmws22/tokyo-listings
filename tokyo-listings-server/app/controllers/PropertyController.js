const db = require('../models')

const Property = db.property
const Listing = db.listing

exports.create = (req, res) => {
  if (!req.body.prefecture) {
    res.status(400).send({
      message: 'Content can not be empty!'
    })
    return
  }

  Property.create(req.body)
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

  Property.destroy({
    where: { id }
  })
    .then(num => {
      if (num === 1) {
        res.send({
          message: 'Property was deleted successfully!'
        })
      } else {
        res.send({
          message: `Cannot delete Property with id=${id}`
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

  Property.update(req.body, {
    where: { id }
  })
    .then(num => {
      if (num === 1) {
        res.send({
          message: 'Property was updated successfully.'
        })
      } else {
        res.send({
          message: `Cannot update Property with id=${id}`
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
  Property.findAll({ where: req.query })
    .then(data => {
      res.send(data)
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.findAllWithChildren = (req, res) => {
  Property.findAll({
    where: req.query,
    include: [{ model: Listing, as: 'listings' }],
    order: [
      ['id', 'ASC'],
      [{ model: Listing, as: 'listings' }, 'availability', 'ASC']
    ]
  })
    .then(data => {
      res.send(data)
    })
    .catch(err => {
      res.status(500).send({
        message: err.message
      })
    })
}
