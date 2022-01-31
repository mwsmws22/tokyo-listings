const cheerio = require('cheerio')
const { https } = require('follow-redirects')

const getUpdatedSuumoBukkenUrlFromPage = async url =>
  https
    .get(url, res => {
      let html = ''
      const { statusCode } = res

      if (statusCode !== 200) {
        return new Error('bad link')
      }
      res.setEncoding('utf8')

      res.on('data', chunk => {
        html += chunk
      })

      return res.on('end', async () => {
        try {
          const $ = cheerio.load(html)
          return { [url]: $('a[href*="jnc"]')[0].attribs.href }
        } catch (err) {
          return new Error('bad link')
        }
      })
    })
    .on('error', err => err)

module.exports = {
  getUpdatedSuumoBukkenUrlFromPage
}
