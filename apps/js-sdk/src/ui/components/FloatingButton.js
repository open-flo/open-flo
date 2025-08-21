/**
 * Floating button component
 */

import { DomUtils } from '../../utils/DomUtils.js';
import { ChatInterface } from './ChatInterface.js';

export class FloatingButton {
  constructor(options = {}, eventBus) {
    this.options = options;
    this.eventBus = eventBus;
    this.element = null;
    this.isVisible = true;
    
    // Initialize chat interface
    this.chatInterface = new ChatInterface(options, eventBus);
  }

  /**
   * Create the floating button element
   */
  create() {
    this.element = DomUtils.createElement('div', 'flowlight-button', {
      position: 'fixed',
      width: `${this.options.buttonSize}px`,
      height: `${this.options.buttonSize}px`,
      bottom: `${this.options.buttonPosition.bottom}px`,
      right: `${this.options.buttonPosition.right}px`,
      backgroundColor: this.options.floatingButton?.backgroundColor || '#0050C8',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      zIndex: this.options.zIndex,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      boxShadow: `0 4px 20px ${this.options.themeColors?.primaryLight || '#0050C81A'}`,
      transition: 'all 0.3s ease',
      userSelect: 'none'
    }, this.getButtonIcon());

    this.bindEvents();
    
    // Create chat interface
    this.chatInterface.create();
    
    return this.element;
  }

  /**
   * Get the button icon SVG
   * @returns {string} - SVG icon HTML
   */
  getButtonIcon() {
    return this.options.buttonIcon || `<svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="21" height="24" viewBox="0 0 21 24" fill="none" data-flowvana="id-xq1jpfj7b"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.36806 19.0408V21.0351C7.36806 21.5203 6.82206 21.8195 6.38626 21.5641L5.43468 20.9709L5.20589 20.8456C5.18924 20.8364 3.87671 20.0997 0.996801 18.4832L0.768558 18.3562C0.530936 18.223 0.335906 18.0324 0.201083 17.8023C0.0678324 17.5741 -0.00151093 17.3151 0.00109508 17.0582L0 12.0916V7.11711C0 6.83785 0.0812403 6.56518 0.232238 6.33119C0.381869 6.09601 0.598542 5.90276 0.820616 5.79876L4.97153 3.46998L5.19879 3.34085C5.27438 3.2988 5.27446 3.29876 5.42688 3.21447L5.42737 3.2142L9.40274 0.986205L9.63559 0.852304C9.89138 0.709263 10.1809 0.641184 10.4744 0.65446C10.7594 0.667887 11.0403 0.758552 11.2334 0.892314L15.3701 3.21298L15.5994 3.33855L19.8057 5.69947L20.0354 5.82705C20.2729 5.96049 20.4675 6.15083 20.6022 6.38089C20.7352 6.60852 20.8045 6.86744 20.8023 7.12509L20.8031 11.6476C20.8032 12.1277 20.2677 12.4276 19.8395 12.1873L18.0543 11.1856C17.8558 11.0742 17.7335 10.8686 17.7335 10.646V7.9751L14.145 5.96052C14.111 5.94418 14.0414 5.90561 13.8415 5.79317L10.4013 3.8603L6.82463 5.86549L6.82457 5.86553L6.82455 5.86554C6.7898 5.88774 6.78978 5.88775 6.76741 5.90155C6.75393 5.90961 6.50861 6.0478 6.50861 6.0478L3.06984 7.97534V16.2079L6.6604 18.2234C6.68607 18.2359 6.73294 18.2619 6.96988 18.3947L7.06979 18.4808L7.1252 18.5527C7.27759 18.6701 7.36806 18.8494 7.36806 19.0408ZM6.71511 19.0592L6.70908 19.0538C6.71071 19.0559 6.71274 19.0578 6.71511 19.0592ZM18.7 13.3751C18.2718 13.1357 17.7372 13.4356 17.7372 13.9152V14.2825L8.63799 9.17841L8.32825 9.00325C8.01895 8.82995 7.63732 8.84807 7.34939 9.04694L7.111 9.17709L5.74955 9.93778L5.20047 10.2438C4.76099 10.4905 4.62353 11.0305 4.88005 11.4601L5.19219 11.9826L5.50713 12.5108C5.76179 12.9371 6.31925 13.0701 6.76045 12.8196C7.29794 12.5184 7.32327 12.5043 7.34721 12.4881C7.34936 12.4867 7.3515 12.4852 7.35401 12.4835L7.8713 12.195L8.90628 12.7757L8.90523 22.4687C8.90523 22.9539 9.31029 23.3473 9.81005 23.3473C10.0393 23.3473 10.2584 23.2633 10.4257 23.1129L10.4379 23.1033C11.4356 22.3212 11.4365 22.3206 11.6447 22.1572C11.8801 21.9731 12.0039 21.6884 11.9782 21.3975L11.9801 14.5011L18.4889 18.1638C18.9434 18.4179 19.4498 18.2476 19.7884 17.8275L20.624 17.0013C20.7413 16.8846 20.8068 16.7284 20.8068 16.5658V14.9133C20.8068 14.6904 20.6841 14.4845 20.4851 14.3732L18.7 13.3751Z" fill="#FFFFFF"></path></svg>`;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.element) return;

    // Hover effects
    this.element.addEventListener('mouseenter', () => {
      this.element.style.transform = 'scale(1.1)';
      this.element.style.boxShadow = `0 6px 25px ${this.options.themeColors?.primaryLight || '#0050C81A'}`;
    });

    this.element.addEventListener('mouseleave', () => {
      this.element.style.transform = 'scale(1)';
      this.element.style.boxShadow = `0 4px 20px ${this.options.themeColors?.primaryLight || '#0050C81A'}`;
    });

    // Click handler
    this.element.addEventListener('click', () => {
      console.log('button clicked - showing chat interface');
      this.eventBus.emit('button:click');
    });
  }

  /**
   * Render the button
   */
  render() {
    if (!this.element) {
      this.create();
    }
    
    if (this.isVisible) {
      document.body.appendChild(this.element);
    }
  }

  /**
   * Show chat interface
   */
  showChat() {
    this.chatInterface.show();
  }

  /**
   * Hide chat interface
   */
  hideChat() {
    this.chatInterface.hide();
  }

  /**
   * Toggle chat interface
   */
  toggleChat() {
    if (this.chatInterface.isVisible) {
      this.hideChat();
    } else {
      this.showChat();
    }
  }

  /**
   * Update button position
   * @param {Object} position - New position { bottom, right }
   */
  updatePosition(position) {
    if (this.element) {
      this.element.style.bottom = `${position.bottom}px`;
      this.element.style.right = `${position.right}px`;
    }
  }

  /**
   * Update button size
   * @param {number} size - New size in pixels
   */
  updateSize(size) {
    if (this.element) {
      this.element.style.width = `${size}px`;
      this.element.style.height = `${size}px`;
    }
  }

} 