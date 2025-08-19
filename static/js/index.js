/**
 * Mobile Menu 0.0.5
 * Mobile navigation menu module
 * @author Kyle Foster (@hkfoster)
 * @license MIT (http://www.opensource.org/licenses/mit-license.php/)
 **/

// Public API function
const mobileMenu = (() => {
  
  // Scoped variables
  let focusable
  let firstFocusable
  let lastFocusable

  function keyHandler(event) {
    event = event || window.event
    if (document.documentElement.dataset.menuState !== 'on') return false
    
    const tabKey = 9
    const escKey = 27

    // Key code conditionals
    switch (event.keyCode) {

      // Tab
      case tabKey:
        if (focusable.length === 1) {
          event.preventDefault()
          break
        }

        // Go back if shift is fired, tab backward
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault()
            lastFocusable.focus()
          }

        // Otherwise tab forward
        } else {
          if (document.activeElement === lastFocusable) {
            event.preventDefault()
            firstFocusable.focus()
          }
        }
        break

      // Esc
      case escKey:
        document.documentElement.dataset.menuState = 'off'
        allowFocus('[data-menu]', false)
        break

      // Default
      default:
        break
    }
  }

  function toggleIcon(selector) {
    const icon = document.querySelector(selector)

    if (icon) {
      icon.classList.toggle('hidden')
    }
  }

  function toggleMenu(name, dataName) {
    // Toggle body state attribute
    document.documentElement.dataset[dataName] = document.documentElement.dataset[dataName] === 'on' ? 'off' : 'on'

    // Set up modal focus trap
    if (document.documentElement.dataset.menuState === 'on') {
      sessionStorage.setItem('scroll-position', document.documentElement.scrollTop)
      document.documentElement.dataset.scrollDisabled = 'on'
      toggleIcon('[data-' + name + '-open-icon]')
      toggleIcon('[data-' + name + '-close-icon]')
      allowFocus('[data-' + name + ']', true)
      trapFocus()

    } else {
      document.documentElement.dataset.scrollDisabled = 'off'
      document.documentElement.scrollTop = sessionStorage.getItem('scroll-position')
      toggleIcon('[data-' + name + '-close-icon]')
      toggleIcon('[data-' + name + '-open-icon]')
      allowFocus('[data-' + name + ']', false)
    }
  }

  // Click handler function
  function clickHandler(event) {

    // Only run on menu button
    if (event.target.closest('[data-menu-toggle]')) {
      toggleMenu('menu', 'menuState')
    } else if (event.target.closest('[data-products-mobile-menu-toggle]')) {
      toggleMenu('products-mobile-menu', 'productsMobileMenuState')
    } else if (event.target.closest('[data-resources-mobile-menu-toggle]')) {
      toggleMenu('resources-mobile-menu', 'resourcesMobileMenuState')
    } else if (event.target.closest('.header-link')) {
      // Handle header link clicks
      event.preventDefault()
      copyHeaderLinkToClipboard(event.target.closest('.header-link'))
    }
  }

  // Copy header link URL to clipboard
  function copyHeaderLinkToClipboard(linkElement) {
    const href = linkElement.getAttribute('href')
    const fullUrl = window.location.origin + window.location.pathname + href

    // Update the URL hash to provide immediate visual feedback
    window.location.hash = href

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        showCopyFeedback(linkElement)
      }).catch(err => {
        console.error('Failed to copy link: ', err)
        fallbackCopyToClipboard(fullUrl, linkElement)
      })
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(fullUrl, linkElement)
    }
  }

  // Show visual feedback when link is copied
  function showCopyFeedback(linkElement) {
    const originalTitle = linkElement.getAttribute('title')

    linkElement.setAttribute('title', 'Copied!')
    linkElement.classList.add('copied')

    setTimeout(() => {
      linkElement.setAttribute('title', originalTitle)
      linkElement.classList.remove('copied')
    }, 2000)
  }

  // Fallback copy method for older browsers
  function fallbackCopyToClipboard(text, linkElement) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      if (successful) {
        showCopyFeedback(linkElement)
        console.log('Link copied to clipboard (fallback)')
      } else {
        console.error('Fallback copy failed')
      }
    } catch (err) {
      console.error('Fallback copy failed: ', err)
    }

    document.body.removeChild(textArea)
  }

  function allowFocus(selector, state) {
    const container = document.querySelector(selector)
    const focusable = container.querySelectorAll('button, [href], input, select, textarea')
    focusable.forEach(el => el.setAttribute('tabindex', state ? '' : '-1'))
    container.classList.toggle('hidden')
  }

  // Trap focus to currently open modal
  function trapFocus() {
    focusable = document.querySelector('[data-menu-container]').querySelectorAll('a[href]:not([tabindex="-1"]), area[href]:not([tabindex="-1"]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]):not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), iframe:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"]), [contentEditable=true]:not([tabindex="-1"])')
    firstFocusable = focusable[0]
    lastFocusable = focusable[focusable.length - 1]
  }

  // Attach listeners
  document.addEventListener('click', clickHandler, false)
  document.addEventListener('keydown', keyHandler, false)

})()

// Simple click-to-open for standalone images
document.addEventListener('click', function(e) {
  // Check if clicked element is a standalone img (not inside an anchor, not image-card, not no-click)
  if (e.target.tagName === 'IMG' &&
      !e.target.closest('a') &&
      !e.target.classList.contains('image-card-img') &&
      !e.target.src.includes('#no-click')) {

    // Open image in same tab, just like clicking a regular link
    window.location.href = e.target.src
  }
})