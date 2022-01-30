const db = require('../models')
const Property = db.property
const Listing = db.listing
const Op = db.Sequelize.Op

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
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the Property.'
      })
    })
}

exports.delete = (req, res) => {
  const id = req.params.id

  Property.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Property was deleted successfully!'
        })
      } else {
        res.send({
          message: `Cannot delete Property with id=${id}. Maybe Property was not found!`
        })
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete Property with id=' + id
      })
    })
}

exports.update = (req, res) => {
  const id = req.params.id

  Property.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Property was updated successfully.'
        })
      } else {
        res.send({
          message: `Cannot update Property with id=${id}. Maybe Property was not found or req.body is empty!`
        })
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating Property with id=' + id
      })
    })
}

exports.findAll = (req, res) => {
  Property.findAll({ where: req.query })
    .then(data => {
      res.send(data)
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving Properties.'
      })
    })
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
        message: err.message || 'Some error occurred while retrieving Properties.'
      })
    })
}
