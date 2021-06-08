const COMMAND_TOGGLE = 'toggle'
const MEETING_URL = 'https://meet.google.com/'
const STATUS_DISABLED = 0
const STATUS_OFF = 1
const STATUS_ON = 2
const STATUS_TITLE = new Map([
  [STATUS_DISABLED, 'Meeting Mic'],
  [STATUS_OFF, 'Meeting Mic OFF'],
  [STATUS_ON, 'Meeting Mic ON']
]);

function handleCommand(command) {
  chrome.windows.getAll({ populate: true }, windows => {
    let tabs = []
    windows.forEach(window => {
      window.tabs.forEach(tab => {
        if (tab && tab.url && tab.url.startsWith(MEETING_URL)) {
          tabs.push(tab)
        }
      })
    })
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, { command: command }, (response) => {
        if (response && response.status) {
          updateAction(response.status)
        }
      })
    })
  })
}

function updateAction(status) {
  if (status != STATUS_DISABLED && status != STATUS_OFF && status != STATUS_ON) {
    return
  }
  chrome.action.setIcon({
    path: {
      "32": `icon032${status}.png`,
      "48": `icon048${status}.png`,
      "128": `icon128${status}.png`
    }
  })
  chrome.action.setTitle({
    title: STATUS_TITLE.get(status)
  })
}

chrome.action.onClicked.addListener((tab) => {
  handleCommand(COMMAND_TOGGLE)
})

chrome.commands.onCommand.addListener((command) => {
  handleCommand(command)
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.status) {
    updateAction(message.status)
  }
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  let tabs = []
  let windows = []
  chrome.windows.getAll(windowList => {
    windows = windowList
  })
  windows.forEach(window => {
    window.tabs.forEach(tab => {
      if (tab && tab.url && tab.url.startsWith(MEETING_URL)) {
        tabs.push(tab)
      }
    })
  })
  if (tabs.length == 0) {
    updateAction(STATUS_DISABLED)
  }
})