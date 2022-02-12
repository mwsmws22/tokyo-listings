const DB = require('../models/DBModel')

const Property = DB.property
const Listing = DB.listing

exports.create = (req, res, next) => {
  if (!req.body.prefecture) {
    res.status(400).send({ message: 'Content can not be empty!' })
  }

  Property.create(req.body)
    .then(data => res.send(data))
    .catch(next)
}

exports.delete = (req, res, next) => {
  const { id } = req.params

  Property.destroy({ where: { id } })
    .then(num =>
      num === 1
        ? res.send({ message: 'Property was deleted successfully!' })
        : res.send({ message: `Cannot delete Property with id=${id}` })
    )
    .catch(next)
}

exports.update = (req, res, next) => {
  const { id } = req.params

  Property.update(req.body, { where: { id } })
    .then(num =>
      num === 1
        ? res.send({ message: 'Property was updated successfully.' })
        : res.send({ message: `Cannot update Property with id=${id}` })
    )
    .catch(next)
}

exports.findAll = (req, res, next) => {
  Property.findAll({ where: req.query })
    .then(data => res.send(data))
    .catch(next)
}

exports.findAllWithChildren = (req, res, next) => {
  Property.findAll({
    where: req.query,
    include: [{ model: Listing, as: 'listings' }],
    order: [
      ['id', 'ASC'],
      [{ model: Listing, as: 'listings' }, 'availability', 'ASC']
    ]
  })
    .then(data => res.send(data))
    .catch(next)
}
