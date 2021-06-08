const ATTRIBUTE = 'data-is-muted'
const BUTTON_SELECTOR = 'button[data-tooltip-id="tt-c1"][role="button"][data-is-muted]'
const COMMAND = 'toggle'
const KEY_DOWN_EVENT = new KeyboardEvent('keydown', {
  "key": "d",
  "code": "KeyD",
  "metaKey": true,
  "charCode": 100,
  "keyCode": 100,
  "which": 100
})
const STATUS_DISABLED = 0
const STATUS_OFF = 1
const STATUS_ON = 2

var button
var buttonObserver
var buttonStatus
var waitingForButton = false

function findDOMElement(DOMSelector, TIMEOUT = 5000) {
  let timeout = 0
  const waitForDOMElement = (resolve, reject) => {
    const container = document.querySelector(DOMSelector)
    timeout += 100
    if (timeout >= TIMEOUT) {
      reject('DOM Element not found')
    }
    if (!container || container.length === 0) {
      setTimeout(waitForDOMElement.bind(this, resolve, reject), 100)
    } else {
      resolve(container)
    }
  }
  return new Promise((resolve, reject) => {
    waitForDOMElement(resolve, reject);
  })
}

function getButtonStatus() {
  let attributeValue = null
  if (button) {
    attributeValue = button.getAttribute(ATTRIBUTE)
  }
  switch (attributeValue) {
    case 'false':
      return STATUS_ON
      break
    case 'true':
      return STATUS_OFF
      break
    default:
      return STATUS_DISABLED
  }
}

function observeBody() {
  const bodyObserver = new MutationObserver((mutations) => {
    let newClass = mutations[0].target.getAttribute('class')
    if (mutations[0].oldValue != newClass && !waitingForButton) {
      waitingForButton = true
      findDOMElement(BUTTON_SELECTOR)
        .then((element) => {
          waitingForButton = false
          button = element
          observeButton()
          setButtonStatus()
          sendKeyboardEvent()
        })
        .catch((error) => {
          waitingForButton = false
          console.log(error)
          button = null
          setButtonStatus()
        })
    }
  })
  bodyObserver.observe(document.querySelector('body'), {
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true
  })
}

function observeButton() {
  if (buttonObserver) {
    buttonObserver.disconnect()
  }
  buttonObserver = new MutationObserver((mutations) => {
    if (mutations[0].target != button) {
      return
    }
    let status = getButtonStatus()
    if (status != buttonStatus) {
      setButtonStatus(status)
    }
  })
  buttonObserver.observe(button, {
    attributes: true,
    attributeFilter: [ATTRIBUTE]
  })
}

function sendKeyboardEvent() {
  document.dispatchEvent(KEY_DOWN_EVENT)
}

function setButtonStatus(status) {
  buttonStatus = status || getButtonStatus()
  chrome.runtime.sendMessage({ status: buttonStatus })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.command && message.command === COMMAND) {
    sendKeyboardEvent()
    buttonStatus = getButtonStatus()
    sendResponse({ status: buttonStatus })
  }
})

window.onbeforeunload = (event) => {
  setButtonStatus()
}

window.onload = (event) => {
  setButtonStatus()
  observeBody()
}
