const cheerio = require('cheerio')
const axios = require('axios')
const Utils = require('../utils/Utils')
const Errors = require('../utils/Errors')

const SUUMO_REGION_CODES = require('../resources/SuumoRegionCodes.json')

const SUUMO_CITIES_URL = `https://suumo.jp/chintai/tokyo/city/`
const SUUMO_TOWNS_URL = `https://suumo.jp/jj/chintai/kensaku/FR301FB002/?ar=030&bs=040&ta=13&sc=`

const DELAY_INC = 1000

function SuumoUrl() {
  const SUUMO_SQUARE_M_BOUNDS = [
    0, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80, 90, 100, 9999999
  ]

  this.url = 'https://suumo.jp/jj/chintai/ichiran/FR301FC001/?bs=040&ar=030&ta=13&pc=50'

  this.sc = sc => {
    this.url += `&sc=${sc}`
  }

  this.oz = oz => {
    this.url += `&oz=${oz}`
  }

  this.squareM = (min, max) => {
    const minn = parseFloat(min)
    const maxx = parseFloat(max)
    const lowerBound = SUUMO_SQUARE_M_BOUNDS.filter(b => b <= minn).last()
    const upperBound = SUUMO_SQUARE_M_BOUNDS.filter(b => b > maxx)[0]
    this.url += `&mb=${lowerBound}&mt=${upperBound}`
  }
}

exports.getSuumoParamsHierarchy = async () => {
  const cities = await axios
    .get(SUUMO_CITIES_URL, Utils.axiosOptions)
    .then(Utils.checkAxiosRes)
    .then(html => {
      const $ = cheerio.load(html)
      return $('[name=sc]')
        .get()
        .map(elem => {
          const sc = $(elem).attr('value')
          const cityName = $(elem).next().children().eq(0).text()
          return { sc, cityName }
        })
    })

  let delay = 0

  const suumoParams = { cities: {} }

  await Promise.all(
    cities.slice(0, 5).map(async ({ sc, cityName }) => {
      delay += DELAY_INC

      const cityEntry = { sc }
      cityEntry.towns = {}

      await new Promise(resolve => setTimeout(resolve, delay))
        .then(() => axios.get(SUUMO_TOWNS_URL + sc, Utils.axiosOptions))
        .then(Utils.checkAxiosRes)
        .then(html => {
          const $ = cheerio.load(html)
          $('[name=oz]')
            .get()
            .forEach(elem => {
              const oz = $(elem).attr('value')
              const townName = $(elem).next().children().eq(0).text()
              cityEntry.towns[townName] = { oz }
            })
          return null
        })

      suumoParams.cities[cityName] = cityEntry
    })
  )

  return suumoParams
}

exports.getSuumoSearchUrlsForAllProperties = async properties =>
  properties.map(property => {
    const suumoUrl = new SuumoUrl()

    const sqrM = new Set()
    property.listings.forEach(l => l.square_m && sqrM.add(l.square_m))
    suumoUrl.squareM(Math.min(...sqrM), Math.max(...sqrM))

    suumoUrl.sc(SUUMO_REGION_CODES.cities[property.municipality].sc)

    let town = SUUMO_REGION_CODES.cities[property.municipality].towns[property.town.jp()]

    if (town) {
      suumoUrl.oz(town.oz)
      return { url: suumoUrl.url, sqrM: Array.from(sqrM) }
    }

    town =
      SUUMO_REGION_CODES.cities[property.municipality].towns[property.town.reverseJp()]

    if (town) {
      suumoUrl.oz(town.oz)
      return { url: suumoUrl.url, sqrM: Array.from(sqrM) }
    }

    throw new Error(Errors.unableToBuildSuumoUrl)
  })

exports.getSimilarListingsFromSearchResults = async data => {
  let delay = 0

  return Promise.all(
    data.map(async ({ url, sqrM }) => {
      const listings = []
      delay += DELAY_INC

      await new Promise(resolve => setTimeout(resolve, delay))
        .then(() => axios.get(url, Utils.axiosOptions))
        .then(Utils.checkAxiosRes)
        .then(html => {
          const $ = cheerio.load(html)
          return $('[name=sc]')
            .get()
            .map(elem => {
              const sc = $(elem).attr('value')
              const cityName = $(elem).next().children().eq(0).text()
              return { sc, cityName }
            })
        })
    })
  )
}
