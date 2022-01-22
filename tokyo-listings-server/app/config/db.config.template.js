module.exports = {
  HOST: '',
  PORT: '',
  USER: '',
  PASSWORD: '',
  DB: 'postgres',
  dialect: 'postgres',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
}
