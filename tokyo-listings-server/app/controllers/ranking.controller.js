const db = require('../models')
const Ranking = db.ranking
const Op = db.Sequelize.Op

exports.create = (req, res) => {
  if (!req.body.property_id) {
    res.status(400).send({
      message: 'Content can not be empty!'
    })
    return
  }

  Ranking.create(req.body)
    .then(data => {
      res.send(data)
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while creating the Ranking.'
      })
    })
}

exports.delete = (req, res) => {
  const id = req.params.id

  Ranking.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Ranking was deleted successfully!'
        })
      } else {
        res.send({
          message: `Cannot delete Ranking with id=${id}. Maybe Ranking was not found!`
        })
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Could not delete Ranking with id=' + id
      })
    })
}

exports.update = (req, res) => {
  const id = req.params.id

  Ranking.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: 'Ranking was updated successfully.'
        })
      } else {
        res.send({
          message: `Cannot update Ranking with id=${id}. Maybe Ranking was not found or req.body is empty!`
        })
      }
    })
    .catch(err => {
      res.status(500).send({
        message: 'Error updating Ranking with id=' + id
      })
    })
}

exports.findAll = (req, res) => {
  Ranking.findAll({ where: req.query })
    .then(data => {
      res.send(data)
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || 'Some error occurred while retrieving Rankings.'
      })
    })
}
