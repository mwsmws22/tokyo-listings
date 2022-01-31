module.exports = {
  HOST: 'tokyo-listings.cihnsp94k6br.us-east-2.rds.amazonaws.com',
  PORT: '5432',
  USER: 'postgres',
  PASSWORD: 'Shelltell434',
  DB: 'postgres',
  dialect: 'postgres',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}
