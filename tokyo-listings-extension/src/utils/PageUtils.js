class PageUtils {
  static insertUrl(url) {
    const element = document.getElementById('inputUrl')
    element.value = url
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

let observer
const config = { attributes: true }
const cbWrapper = cb => mutations =>
  mutations.forEach(mutation => {
    if (mutation.target?.outerText === 'Listing already in DB!') {
      cb()
    }
  })

chrome.runtime.onMessage.addListener((req, temp, cb) => {
  console.log(req)
  console.log(cb)
  const urlLabel = document.getElementById('urlLabel')
  // cbWrapper.bind({ cb })
  // observer = new MutationObserver(cbWrapper(cb))
  // observer.observe(urlLabel, config)

  PageUtils.insertUrl(req.listingTab.url)
})
