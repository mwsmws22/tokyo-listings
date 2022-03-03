let x = true

const filter = {
  url: [
    {
      pathContains: 'athome.co.jp'
    }
  ]
}

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

function sendListingToApp() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    const listingTab = tabs[0].url
    chrome.tabs.query({ url: 'http://localhost:8081/add' }, tabz => {
      if (tabz.length > 0) {
        chrome.tabs.update(tabz[0].id, { active: true })
        chrome.tabs.sendMessage(tabz[0].id, { loadUrl: listingTab })
      } else {
        chrome.tabs.create({ url: 'http://localhost:8081/add' }, tab => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
              chrome.tabs.onUpdated.removeListener(listener)
              chrome.tabs.sendMessage(tab.id, { loadUrl: listingTab })
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

function reloadExtension(details) {
  console.log(details)
}

enableBrowserAction()

chrome.browserAction.onClicked.addListener(updateState)
chrome.commands.onCommand.addListener(commandHandler)

// chrome.webNavigation.onHistoryStateUpdated.addListener(
//   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//     chrome.tabs.sendMessage(tabs[0].id, { reload: true })
//   })
// )
chrome.webNavigation.onHistoryStateUpdated.addListener(reloadExtension, filter)
