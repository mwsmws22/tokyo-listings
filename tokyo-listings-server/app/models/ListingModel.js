module.exports = (sequelize, Sequelize) =>
  sequelize.define('listing', {
    url: {
      type: Sequelize.STRING
    },
    monthly_rent: {
      type: Sequelize.FLOAT
    },
    reikin: {
      type: Sequelize.FLOAT
    },
    security_deposit: {
      type: Sequelize.FLOAT
    },
    square_m: {
      type: Sequelize.FLOAT
    },
    walking_time: {
      type: Sequelize.INTEGER
    },
    closest_station: {
      type: Sequelize.STRING
    },
    availability: {
      type: Sequelize.STRING
    }
  })
