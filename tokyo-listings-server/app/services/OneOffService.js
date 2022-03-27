const cheerio = require('cheerio')
const axios = require('axios')
const { JSDOM } = require('jsdom')
const Utils = require('../utils/Utils')
const Errors = require('../utils/Errors')

const SUUMO_REGION_CODES = require('../resources/SuumoRegionCodes.json')

const SUUMO_CITIES_URL = `https://suumo.jp/chintai/tokyo/city/`
const SUUMO_TOWNS_URL = `https://suumo.jp/jj/chintai/kensaku/FR301FB002/?ar=030&bs=040&ta=13&sc=`

const DELAY_INC = 500

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

const getSuumoListings = html => {
  const dom = new JSDOM(html)

  const uls = Array.from(
    dom.window.document.getElementById('js-bukkenList').children
  ).filter(elem => (elem.tagName === 'UL' ? elem : elem.remove()))

  const containerUl = uls[0]

  uls.slice(1).forEach(ul => {
    Array.from(ul.children).forEach(div => containerUl.appendChild(div))
    ul.remove()
  })

  return Array.from(containerUl.children)
    .map(li =>
      Array.from(li.querySelectorAll('tbody')).map(tb => ({
        address: li.querySelector('.cassetteitem_detail-col1').textContent,
        key: tb.querySelector('.js-cassette_link_href').href.match(/jnc_(.*?)\//)[1],
        square_m: tb.querySelector('.cassetteitem_menseki').textContent.remove('m2')
      }))
    )
    .flat()
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
    cities.map(async ({ sc, cityName }) => {
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

exports.getSuumoSearchUrlsForProperty = async property => {
  const suumoUrl = new SuumoUrl()
  const sqrM = new Set()

  property.listings.forEach(l => l.square_m && sqrM.add(l.square_m))
  suumoUrl.squareM(Math.min(...sqrM), Math.max(...sqrM))

  suumoUrl.sc(SUUMO_REGION_CODES.cities[property.municipality].sc)

  let town = SUUMO_REGION_CODES.cities[property.municipality].towns[property.town.jp()]

  if (town) {
    suumoUrl.oz(town.oz)
    return { url: suumoUrl.url, property }
  }

  town = SUUMO_REGION_CODES.cities[property.municipality].towns[property.town.reverseJp()]

  if (town) {
    suumoUrl.oz(town.oz)
    return { url: suumoUrl.url, property }
  }

  throw new Error(Errors.unableToBuildSuumoUrl)
}

exports.getSuumoListingsFromSearchResults = async ({ url, property }) => {
  const listings = []
  let delay = 0

  const [html, maxPages] = await axios
    .get(url, Utils.axiosOptions)
    .then(Utils.checkAxiosRes)
    .then(html1 => {
      const $ = cheerio.load(html1)
      const maxPages1 = Array.from($('ol.pagination-parts').eq(0).children())
        .flatMap(elem => {
          const text = $(elem).text()
          if (text && text !== String.fromCharCode(160) && text !== '...') {
            return [parseInt(text)]
          }
          return []
        })
        .last()
      return [html1, maxPages1]
    })

  if (maxPages) {
    listings.push(getSuumoListings(html))

    if (maxPages >= 2) {
      await Promise.all(
        Utils.range(2, maxPages).map(p => {
          delay += DELAY_INC
          return new Promise(resolve => setTimeout(resolve, delay))
            .then(() => axios.get(`${url}&page=${p}`, Utils.axiosOptions))
            .then(Utils.checkAxiosRes)
            .then(html1 => listings.push(getSuumoListings(html1)))
        })
      )
    }
  }

  return { property, listings: listings.flat() }
}

exports.removeSuumoArchivedListings = ({ property, listings }) => {
  const filteredListings = listings.filter(
    l =>
      !property.listings
        .filter(pl => pl.url.includes('suumo'))
        .some(pl => pl.url.includes(l.key))
  )
  return { property, filteredListings }
}

exports.findSuumoSimilarListings = ({ property, filteredListings }) => {
  let similarListings = filteredListings
    .filter(l =>
      property.listings.some(pl => parseFloat(pl.square_m) === parseFloat(l.square_m))
    )
    .flatMap(l => {
      const addressFormatted = l.address.convertHalfWidth()
      const match = addressFormatted.match(/(\d)$/)
      if (match[1]) {
        const district = parseInt(match[1])
        if (district === property.district) {
          return [l]
        }
        return []
      }
      return [l]
    })

  similarListings = similarListings.map(l => {
    const { key, listingElem, ...rest } = l
    const url = `https://suumo.jp/chintai/jnc_${key}/`
    return { ...rest, url }
  })

  if (similarListings.length > 0) {
    return {
      property,
      similarListings
    }
  }
  return null
}
