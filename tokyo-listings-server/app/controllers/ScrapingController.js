const db = require('../models')
const ScrapingService = require('../services/scraping-service')

const Listing = db.listing

const needOriginalUrls = [
  'www.realtokyoestate.co.jp',
  'tokyo-style.cc',
  'www.omusubi-estate.com',
  'www.tatodesign.jp',
  'joylifestyle.jp',
  'www.inet-tokyo.com'
]
const dontEvenCheckUrls = ['www.v-officenavi.com']
const addParamsUrls = ['chintai-ex.jp', 'smocca.jp']

exports.scrape = (req, res) => {
  let url = req.url.substring(1).replace('get/', '')
  const paramUrl = req.params[0]
  const { hostname } = new URL(paramUrl)

  if (!needOriginalUrls.includes(hostname)) {
    url = paramUrl
  }

  if (addParamsUrls.includes(hostname)) {
    url += '?no_like_list=true&recommend_type=base_at_like_list'
  }

  Listing.findAll({ where: { url } })
    .then(data => {
      if (data.length !== 0) {
        res.send({ listing_exists: true, url })
      } else if (dontEvenCheckUrls.includes(hostname)) {
        res.send({ url })
      } else {
        ScrapingService.scrape(url, output => {
          if (output === 'bad link') {
            res.status(500).send({ message: 'bad link' })
          } else if (output !== null) {
            res.send(output)
          } else {
            res.send({ url })
          }
        })
      }
    })
    .catch(err =>
      res.status(500).send({
        message: err.message
      })
    )
}

exports.scrapeCheck = (req, res) => {
  let url = req.url.substring(1).replace('check/', '')
  const paramUrl = req.params[0]
  const { hostname } = new URL(paramUrl)

  // debugging to check a specific site's listings. Leave empty to proceed without filtering
  const specificSiteCheck = []

  if (![...needOriginalUrls, ...addParamsUrls].includes(hostname)) {
    url = paramUrl
  }

  if (specificSiteCheck.length > 0) {
    if (specificSiteCheck.includes(hostname)) {
      res.send({ skip: true })
      return
    }
  }

  if (dontEvenCheckUrls.includes(hostname)) {
    res.send({ url })
  } else {
    ScrapingService.scrape(url, output => {
      if (output === 'bad link') {
        res.status(500).send({ message: 'bad link' })
      } else if (output !== null) {
        res.send(output)
      } else {
        res.send({ url })
      }
    })
  }
}
