import ServiceHandler from './ServiceHandler.js'

chrome.storage.local.get('enabled', data => {
  if (data.enabled) {
    const sh = new ServiceHandler()
    sh.execute()
  }
})
