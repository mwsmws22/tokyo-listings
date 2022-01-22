var x = true

enableBrowserAction()

function disableBrowserAction() {
  chrome.browserAction.setIcon({path: './icons/logo16_dark.png'})
  chrome.storage.local.set({enabled: false})
}

function enableBrowserAction() {
  chrome.browserAction.setIcon({path: './icons/logo16_light.png'})
  chrome.storage.local.set({enabled: true})
}

function updateState() {
  if (x == false) {
    x = true
    enableBrowserAction()
  } else {
    x = false
    disableBrowserAction()
  }
  chrome.tabs.reload()
}

function sendListingToApp() {
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
    const listingTab = tabs[0].url
    chrome.tabs.query({'url': 'http://localhost:8081/add'}, function(tabs) {
      if (tabs.length > 0) {
        chrome.tabs.update(tabs[0].id, {'active': true})
        chrome.tabs.sendMessage(tabs[0].id, {loadUrl: listingTab})
      } else {
        chrome.tabs.create({'url': 'http://localhost:8081/add'}, function(tab) {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
                chrome.tabs.onUpdated.removeListener(listener)
                chrome.tabs.sendMessage(tab.id, {loadUrl: listingTab})
            }
          })
        })
      }
    })
  })
}

function commandHandler(command) {
  if (command === "load") {
    sendListingToApp()
  }
}

chrome.browserAction.onClicked.addListener(updateState)
chrome.commands.onCommand.addListener(commandHandler);
