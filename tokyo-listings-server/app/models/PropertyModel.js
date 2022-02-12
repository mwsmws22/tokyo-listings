module.exports = (sequelize, Sequelize) =>
  sequelize.define('property', {
    prefecture: {
      type: Sequelize.STRING
    },
    municipality: {
      type: Sequelize.STRING
    },
    town: {
      type: Sequelize.STRING
    },
    district: {
      type: Sequelize.INTEGER
    },
    block: {
      type: Sequelize.INTEGER
    },
    house_number: {
      type: Sequelize.INTEGER
    },
    property_type: {
      type: Sequelize.STRING
    },
    interest: {
      type: Sequelize.STRING
    },
    lat: {
      type: Sequelize.FLOAT
    },
    lng: {
      type: Sequelize.FLOAT
    },
    exact: {
      type: Sequelize.BOOLEAN
    }
  })
