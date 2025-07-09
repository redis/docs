/**
 * Generic GitHub-style tabs functionality
 * Handles tab switching, keyboard navigation, and accessibility
 */

class GenericTabs {
  constructor(container) {
    this.container = container;
    this.tabRadios = container.querySelectorAll('.tab-radio');
    this.tabLabels = container.querySelectorAll('.tab-label');
    this.tabPanels = container.querySelectorAll('.tab-content');
    
    this.init();
  }

  init() {
    // Add event listeners for radio button changes
    this.tabRadios.forEach((radio, index) => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.switchToTab(index);
        }
      });
    });

    // Add keyboard navigation for tab labels
    this.tabLabels.forEach((label, index) => {
      label.addEventListener('keydown', (e) => {
        this.handleKeydown(e, index);
      });
    });

    // Set initial state
    const checkedRadio = this.container.querySelector('.tab-radio:checked');
    if (checkedRadio) {
      const index = parseInt(checkedRadio.dataset.tabIndex);
      this.switchToTab(index);
    }
  }

  switchToTab(index) {
    // Update radio buttons
    this.tabRadios.forEach((radio, i) => {
      radio.checked = i === index;
    });

    // Update tab labels
    this.tabLabels.forEach((label, i) => {
      const isSelected = i === index;
      label.setAttribute('aria-selected', isSelected);
      label.setAttribute('tabindex', isSelected ? '0' : '-1');
    });

    // Update tab panels
    this.tabPanels.forEach((panel, i) => {
      const isActive = i === index;
      panel.classList.toggle('active', isActive);
      panel.setAttribute('aria-hidden', !isActive);
    });
  }

  handleKeydown(event, currentIndex) {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : this.tabLabels.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < this.tabLabels.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.tabLabels.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.tabRadios[currentIndex].checked = true;
        this.switchToTab(currentIndex);
        return;
      default:
        return;
    }

    // Focus and activate the new tab
    this.tabLabels[newIndex].focus();
    this.tabRadios[newIndex].checked = true;
    this.switchToTab(newIndex);
  }
}

// Initialize all generic tabs on page load
document.addEventListener('DOMContentLoaded', () => {
  const tabContainers = document.querySelectorAll('.generic-tabs');
  tabContainers.forEach(container => {
    new GenericTabs(container);
  });
});

// Export for potential external use
window.GenericTabs = GenericTabs;
