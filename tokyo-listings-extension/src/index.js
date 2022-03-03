import ServiceHandler from './ServiceHandler'
import StringUtils from './utils/StringUtils'
import HTMLElementUtils from './utils/HTMLElementUtils'

StringUtils.initialize()
HTMLElementUtils.initialize()

const run = () =>
  chrome.storage.local.get('enabled', data => {
    if (data.enabled) {
      const sh = new ServiceHandler()
      sh.execute()
    }
  })

run()

// chrome.runtime.onMessage.addListener(req => req?.reload && run())
