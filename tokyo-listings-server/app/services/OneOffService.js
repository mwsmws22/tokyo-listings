const cheerio = require('cheerio')
const axios = require('axios')
const Utils = require('../utils/Utils')

const SUUMO_REGION_CODES = require('../resources/SuumoRegionCodes.json')

const SUUMO_CITIES_URL = `https://suumo.jp/chintai/tokyo/city/`
const SUUMO_TOWNS_URL = `https://suumo.jp/jj/chintai/kensaku/FR301FB002/?ar=030&bs=040&ta=13&sc=`

const getSuumoSearchUrl = (sc, oz) =>
  `https://suumo.jp/jj/chintai/ichiran/FR301FC001/?bs=040&ar=030&ta=13&sc=${sc}&oz=${oz}`

exports.getSuumoParamsHierarchy = async () => {
  const cities = await axios
    .get(SUUMO_CITIES_URL, Utils.axiosOptions)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Bad status code: ${response.status}`)
      } else {
        return response.data
      }
    })
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
  const delayIncrement = 1000

  const suumoParams = { cities: {} }

  await Promise.all(
    cities.map(async ({ sc, cityName }) => {
      delay += delayIncrement

      const cityEntry = { sc }
      cityEntry.towns = {}

      await new Promise(resolve => setTimeout(resolve, delay))
        .then(() => axios.get(SUUMO_TOWNS_URL + sc, Utils.axiosOptions))
        .then(response => {
          if (response.status !== 200) {
            throw new Error(`Bad status code: ${response.status}`)
          } else {
            return response.data
          }
        })
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
    const { sc } = SUUMO_REGION_CODES.cities[property.municipality]
    let town = SUUMO_REGION_CODES.cities[property.municipality].towns[property.town.jp()]

    if (town) {
      const { oz } = town
      return { address: Utils.formatAddress(property), url: getSuumoSearchUrl(sc, oz) }
    }

    town =
      SUUMO_REGION_CODES.cities[property.municipality].towns[property.town.reverseJp()]

    if (town) {
      const { oz } = town
      return { address: Utils.formatAddress(property), url: getSuumoSearchUrl(sc, oz) }
    }

    return { address: Utils.formatAddress(property), url: 'CANNOT GET URL' }
  })
