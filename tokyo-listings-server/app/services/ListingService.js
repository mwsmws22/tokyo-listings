const cheerio = require('cheerio')
const axios = require('axios')
const Utils = require('../utils/Utils')

exports.getUpdatedSuumoBukkenUrlFromPage = async url =>
  axios
    .get(url, Utils.axiosOptions)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Bad status code: ${response.status}`)
      } else {
        return response.data
      }
    })
    .then(html => {
      const $ = cheerio.load(html)
      return { [url]: $('a[href*="jnc"]')[0].attribs.href }
    })

exports.getSumaityBuildingUrlFromPage = async url =>
  axios
    .get(url, Utils.axiosOptions)
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Bad status code: ${response.status}`)
      } else {
        return response.data
      }
    })
    .then(html => {
      const $ = cheerio.load(html)
      const breadcrumbs = $('ul.breadcrumbs').children()
      return breadcrumbs
        .eq(breadcrumbs.length - 2)
        .children()
        .eq(0)
        .attr('href')
    })
