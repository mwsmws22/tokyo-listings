const axios = require('axios')
const Listing = require('../models/DBModel').listing
const ScrapingService = require('../services/ScrapingService')
const Utils = require('../utils/Utils')

const needOriginalUrls = [
  'www.realtokyoestate.co.jp',
  'tokyo-style.cc',
  'www.omusubi-estate.com',
  'www.tatodesign.jp',
  'joylifestyle.jp',
  'www.inet-tokyo.com'
]

exports.scrapeDetail = async (req, res, next) => {
  const addParamsUrls = ['chintai-ex.jp', 'smocca.jp']

  let { url } = req.body
  const { checkDB } = req.body
  const { hostname } = new URL(url)

  if (!needOriginalUrls.includes(hostname)) {
    url = url.split('?')[0]
  }

  if (addParamsUrls.includes(hostname)) {
    url += '?no_like_list=true&recommend_type=base_at_like_list'
  }

  if (checkDB) {
    const listings = await Listing.findAll({ where: { url } })
    if (listings.length !== 0) {
      res.send({ listing_exists: true, url })
    }
  }

  axios
    .get(url, Utils.axiosOptions)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Bad status code: ${response.status}`)
      } else {
        return response.data
      }
    })
    .then(html => ScrapingService.scrape(url, hostname, html))
    .then(output => res.send(output))
    .catch(next)
}

exports.scrapeCheck = (req, res, next) => {
  const { url } = req.body
  const { hostname } = new URL(url)

  // debugging to check a specific site's listings
  // leave empty to proceed without filtering
  const specificSiteCheck = []

  if (specificSiteCheck.length > 0) {
    if (specificSiteCheck.includes(hostname)) {
      res.send({ skip: true })
    }
  }

  axios
    .get(url, Utils.axiosOptions)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Bad status code: ${response.status}`)
      } else {
        return response.data
      }
    })
    .then(html => ScrapingService.scrape(url, hostname, html))
    .then(() => res.sendStatus(200))
    .catch(next)
}
