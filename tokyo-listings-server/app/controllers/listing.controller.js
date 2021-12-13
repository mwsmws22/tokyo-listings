const db = require("../models");
const Listing = db.listing;
const Property = db.property;
const Op = db.Sequelize.Op;
const util = require('../util/util');

exports.create = (req, res) => {
  if (!req.body.property_id) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  Listing.create(req.body)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Listing."
      });
    });
};

exports.delete = (req, res) => {
  const id = req.params.id;

  Listing.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Listing was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Listing with id=${id}. Maybe Listing was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Listing with id=" + id
      });
    });
};

exports.update = (req, res) => {
  const id = req.params.id;

  Listing.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Listing was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Listing with id=${id}. Maybe Listing was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Listing with id=" + id
      });
    });
};

exports.findAll = (req, res) => {
  Listing.findAll({
    where: req.query
  }).then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Listing."
      });
    });
};

exports.findAllByInterest = (req, res) => {
  Listing.findAll({
    where: req.query,
    include: [{model: Property, attributes: [], where: {interest: req.params.interest}}]
  }).then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Listing."
      });
    });
};

exports.findAllByPartialUrl = (req, res) => {
  const likeStatements = req.body.partials.map(p => ({ [Op.like]: '%' + p + '%' }));

  Listing.findAll({
    where: {
      url: {
        [Op.or]: likeStatements
      }
    }
  }).then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Listing."
      });
    });
};

exports.findAllByAddressAndSqM = (req, res) => {
  let listings = req.body.params.map(async p => ({
      ...p,
      parsedAddress: util.removeNullProps(await util.parseAddress(p.address))
  }));

  Promise.all(listings).then((listings) => {
    Listing.findAll({
      where: {
        [Op.or]: listings.map(l => ({
            square_m: l.square_m,
            ...Object.fromEntries(Object.entries(l.parsedAddress).map(([k,v]) => ([`$property.${k}$`, v])))
        }))
      },
      include: [{
        model: Property
      }]
    }).then(data => {
        let winners = listings.filter(l =>
          data.filter(d => d.square_m == l.square_m &&
            Object.entries(l.parsedAddress).filter(([k,v]) => d.property[k] != v).length == 0
          ).length > 0
        ).map(({address, square_m}) => ({address, square_m}))
        res.send(winners);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving Listing."
        });
      });
  });
};
