module.exports = (sequelize, Sequelize) => {
  const Ranking = sequelize.define('ranking', {
    general_notes: {
      type: Sequelize.STRING
    },
    inquiry_notes: {
      type: Sequelize.STRING
    },
    rank: {
      type: Sequelize.INTEGER
    },
    status: {
      type: Sequelize.STRING
    }
  })

  return Ranking
}
