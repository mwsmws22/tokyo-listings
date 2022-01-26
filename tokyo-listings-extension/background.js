let x = true

function disableBrowserAction() {
  chrome.browserAction.setIcon({ path: './icons/logo16_dark.png' })
  chrome.storage.local.set({ enabled: false })
}

function enableBrowserAction() {
  chrome.browserAction.setIcon({ path: './icons/logo16_light.png' })
  chrome.storage.local.set({ enabled: true })
}

function updateState() {
  if (x === false) {
    x = true
    enableBrowserAction()
  } else {
    x = false
    disableBrowserAction()
  }
  chrome.tabs.reload()
}

function enterUrl(listingTab, appTab) {
  chrome.tabs.sendMessage(appTab.id, { listingTab, appTab }, null, () =>
    chrome.tabs.remove(listingTab.id)
  )
}

function sendListingToApp() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    chrome.tabs.query({ url: 'http://localhost:8081/add' }, tabz => {
      if (tabz.length > 0) {
        chrome.tabs.update(tabz[0].id, { active: true })
        enterUrl(tabs[0], tabz[0])
      } else {
        chrome.tabs.create({ url: 'http://localhost:8081/add' }, tab => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
              chrome.tabs.onUpdated.removeListener(listener)
              enterUrl(tabs[0], tab)
            }
          })
        })
      }
    })
  })
}

function commandHandler(command) {
  if (command === 'load') {
    sendListingToApp()
  }
}

enableBrowserAction()

chrome.browserAction.onClicked.addListener(updateState)
chrome.commands.onCommand.addListener(commandHandler)
