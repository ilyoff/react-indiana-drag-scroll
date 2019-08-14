import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import bem from 'easy-bem'

import './style.css'

const cn = bem('indiana-scroll-container')

export default class ScrollContainer extends Component {
  static propTypes = {
    vertical: PropTypes.bool,
    horizontal: PropTypes.bool,
    hideScrollbars: PropTypes.bool,
    activationDistance: PropTypes.number,
    children: PropTypes.node,
    onStartScroll: PropTypes.func,
    onScroll: PropTypes.func,
    onEndScroll: PropTypes.func,
    className: PropTypes.string,
    style: PropTypes.object,
    ignoreElements: PropTypes.string,
    preserveMobileBehavior: PropTypes.bool
  }

  static defaultProps = {
    preserveMobileBehavior: true,
    hideScrollbars: true,
    activationDistance: 10,
    vertical: true,
    horizontal: true,
    style: {}
  }

  constructor(props) {
    super(props)
    this.container = React.createRef()
  }

  componentDidMount() {
    const {preserveMobileBehavior} = this.props

    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('touchmove', this.onTouchMove, {passive: false})
    window.addEventListener('touchend', this.onTouchEnd)

    if (preserveMobileBehavior) {
      // We should check if it's the mobile device after page was loaded
      // to prevent breaking SSR
      this.isMobile = this.isMobileDevice()

      // If it's the mobile device, we should rerender to change styles
      if (this.isMobile) {
        this.forceUpdate()
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('touchmove', this.onTouchMove)
    window.removeEventListener('touchend', this.onTouchEnd)
  }

  isMobileDevice() {
    return (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1)
  }

  isDraggable(target) {
    const ignoreElements = this.props.ignoreElements
    if (ignoreElements) {
      const closest = target.closest(ignoreElements)
      return closest === null || closest.contains(this.getElement())
    } else {
      return true
    }
  }

  getElement() {
    return this.container.current
  }

  onTouchStart = (e) => {
    if (this.isDraggable(e.target)) {
      const touch = e.touches[0]
      this.pressed = true
      this.clientX = touch.clientX
      this.clientY = touch.clientY
      e.stopPropagation()
    }
  }

  onTouchEnd = (e) => {
    if (this.dragging) {
      this.processEnd()
    } else if (this.pressed) {
      this.pressed = false
    }
  };

  onTouchMove = (e) => {
    if (this.pressed) {
      const touch = e.touches[0]
      if (touch) {
        this.processMove(e, touch.clientX, touch.clientY)
      }
    }
  }

  onMouseDown = (e) => {
    if (this.isDraggable(e.target)) {
      this.pressed = true
      this.clientX = e.clientX
      this.clientY = e.clientY
      e.stopPropagation()
      if (e.preventDefault) {
        e.preventDefault()
      }
    }
  };

  onMouseMove = (e) => {
    if (this.pressed) {
      this.processMove(e, e.clientX, e.clientY)
      if (e.preventDefault) {
        e.preventDefault()
      }
    }
  }

  onMouseUp = (e) => {
    if (this.pressed || this.dragging) {
      if (e.preventDefault) {
        e.preventDefault()
      }
      e.stopPropagation()
      if (this.dragging) {
        this.processEnd()
      } else {
        this.pressed = false
      }
    }
  };

  processMove(event, newClientX, newClientY) {
    const {
      horizontal, vertical, activationDistance, onScroll, onStartScroll
    } = this.props
    const container = this.container.current

    const isTouch = event.type === 'touchmove'

    if (!this.dragging && this.pressed) {
      if (isTouch || ((horizontal && Math.abs(newClientX - this.clientX) > activationDistance) || (vertical && Math.abs(newClientY - this.clientY) > activationDistance))) {
        this.clientX = newClientX
        this.clientY = newClientY
        this.dragging = true
        document.body.classList.add('indiana-dragging')
        if (onStartScroll) {
          onStartScroll(container.scrollLeft, container.scrollTop, container.scrollWidth, container.scrollHeight)
        }
        if (!isTouch) {
          this.forceUpdate()
        }
      }
    }
    if (this.dragging) {
      if (!isTouch) {
        if (horizontal) {
          container.scrollLeft -= newClientX - this.clientX
        }
        if (vertical) {
          container.scrollTop -= newClientY - this.clientY
        }
      }
      if (onScroll) {
        onScroll(container.scrollLeft, container.scrollTop, container.scrollWidth, container.scrollHeight)
      }
      this.clientX = newClientX
      this.clientY = newClientY
    }
  }

  processEnd() {
    const { onEndScroll } = this.props
    const container = this.container.current
    if (this.dragging && onEndScroll) {
      onEndScroll(container.scrollLeft, container.scrollTop, container.scrollWidth, container.scrollHeight)
    }
    document.body.classList.remove('indiana-dragging')
    this.pressed = false
    this.dragging = false
    this.forceUpdate()
  }

  render() {
    const {
      children, className, style, hideScrollbars
    } = this.props

    return (
      <div
        className={classnames(className, cn({
          'dragging': this.dragging,
          'hide-scrollbars': hideScrollbars,
          'mobile': this.isMobile
        }))}
        style={style}
        ref={this.container}
        onTouchStart={this.onTouchStart}
        onMouseDown={this.onMouseDown}
      >
        {children}
      </div>
    )
  }
}