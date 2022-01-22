const cheerio = require('cheerio')
const { https } = require('follow-redirects')

const getUpdatedSuumoBukkenUrlFromPage = async url =>
  new Promise((resolve, reject) =>
    https.get(url, res => {
      let html = ''
      var { statusCode } = res

      if (statusCode !== 200) {
        reject('bad link')
      } else {
        res.setEncoding('utf8')

        res.on('data', chunk => {
          html += chunk
        })

        res.on('end', async () => {
          try {
            const $ = cheerio.load(html)
            resolve({ [url]: $('a[href*="jnc"]')[0].attribs.href })
          } catch (err) {
            reject('bad link')
          }
        })
      }
    })
  )

module.exports = {
  getUpdatedSuumoBukkenUrlFromPage
}
