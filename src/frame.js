import React, { Component } from 'react';
import cx from 'classnames';
import { css } from 'glamor';
import { node, object, string, number, func } from 'prop-types';

import Frame, { FrameContextConsumer } from 'react-frame-component';

import { create } from 'jss';
import { jssPreset } from '@material-ui/core/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider, StylesProvider } from '@material-ui/core/styles';

const iframeClass = css({
  border: 'none',
  width: '100%',
  height: '100%',
  background: 'white',
  borderRadius: '4px',
  border: '1px solid #b9b9b9',
  boxShadow: 'rgba(0, 0, 0, 0.15) -6px 6px 15px',
  fontFamily: '"IBM Plex Sans"',
  fontStyle: 'normal',
  fontWeight: 400,
  margin: '0px',
});

const maskClass = css({
  display: 'none',
  position: 'fixed',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  cursor: 'pointer',
  zIndex: '9999',
});

const maskVisibleClass = css({
  display: 'block',
});

const containerClass = css({
  position: 'fixed',
  top: '0px',
  right: '0px',
  height: '100%',
  width: '65%',
  maxWidth: '400px',
  padding: '12px',
  boxSizing: 'border-box',
  transform: 'translateX(100%)',
  transition: 'transform .45s cubic-bezier(0, 0, 0.3, 1)',
  zIndex: 10000,
});

const containerVisibleClass = css({
  transform: 'translate3d(0,0,0)',
});

const containerMinimizedClass = css({
  'cursor': 'pointer',
  'transform': 'translateX(94%)',
  ':hover': {
    transform: 'translateX(92%)',
  },
  '& > iframe': {
    pointerEvents: 'none',
  },
});

const FRAME_TOGGLE_FUNCTION = 'chromeIframeSheetToggle';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#262626',
    },
    secondary: {
      main: '#dedede',
    },
    background: {
      default: '#dedede',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: [
      '"IBM Plex Sans"',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const FrameHead = (props) => {
  return (
    <div>
      <meta charSet='utf-8' />
      <title>Prefix iFrame</title>
      <meta name='viewport' content='width=device-width,initial-scale=1' />
      <base target='_parent' />
      <link
        rel='stylesheet'
        href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;700&display=swap'
      />
    </div>
  );
};

export class PXFrame extends Component {
  render() {
    const { isVisible, isMinimized } = this.state;
    const {
      url,
      className,
      maskClassName,
      maskStyle,
      containerClassName,
      containerStyle,
      iframeClassName,
      iframeStyle,
      children,
      containerChildren,
      muiTheme,
    } = this.props;

    return (
      <div>
        <div
          className={cx({
            [maskClass]: true,
            [maskVisibleClass]: !isMinimized,
            [maskClassName]: true,
          })}
          style={maskStyle}
          onClick={this.onMaskClick}
          ref={(mask) => (this.mask = mask)}
        />

        <div
          className={cx({
            [containerClass]: true,
            [containerVisibleClass]: isVisible,
            [containerMinimizedClass]: isMinimized,
            [containerClassName]: true,
          })}
          style={containerStyle}
          onClick={this.onFrameClick}
        >
          <Frame
            className={cx({
              [iframeClass]: true,
              [iframeClassName]: true,
            })}
            style={iframeStyle}
            ref={(frame) => (this.frame = frame)}
            onLoad={this.onLoad}
            head={<FrameHead />}
          >
            <FrameContextConsumer>
              {
                // Callback is invoked with iframe's window and document instances
                ({ document, window }) => {
                  const jss = create({
                    plugins: [...jssPreset().plugins],
                    insertionPoint: document.head,
                  });
                  return (
                    <StylesProvider jss={jss}>
                      <ThemeProvider theme={muiTheme || theme}>
                        {children}
                      </ThemeProvider>
                    </StylesProvider>
                  );
                }
              }
            </FrameContextConsumer>
          </Frame>
        </div>
      </div>
    );
  }

  state = {
    isVisible: false,
    isMinimized: false,
  };

  static defaultProps = {
    url: '',
    delay: 300,
    maskClassName: '',
    maskStyle: {},
    containerClassName: '',
    containerStyle: {},
    iframeClassName: '',
    iframeStyle: {},
    onMount: () => {},
    onUnmount: () => {},
    onLoad: () => {},
  };

  static propTypes = {
    url: string,
    delay: number,
    maskClassName: string,
    maskStyle: object,
    containerClassName: string,
    containerStyle: object,
    iframeClassName: string,
    iframeStyle: object,
    children: node,
    containerChildren: node,
    onMount: func,
    onUnmount: func,
    onLoad: func,
  };

  componentDidMount() {
    const { delay, onMount } = this.props;

    window[FRAME_TOGGLE_FUNCTION] = this.toggleFrame;

    onMount({
      mask: this.mask,
      frame: this.frame,
    });

    this._visibleRenderTimeout = setTimeout(() => {
      this.setState({
        isVisible: true,
      });
    }, delay);
  }

  componentWillUnmount() {
    const { onUnmount } = this.props;

    onUnmount({
      mask: this.mask,
      frame: this.frame,
    });

    delete window[FRAME_TOGGLE_FUNCTION];
    clearTimeout(this._visibleRenderTimeout);
  }

  onLoad = () => {
    const { onLoad } = this.props;

    onLoad({
      mask: this.mask,
      frame: this.frame,
    });
  };

  onMaskClick = () => {
    this.setState({
      isMinimized: true,
    });
  };

  onFrameClick = () => {
    this.setState({
      isMinimized: false,
    });
  };

  toggleFrame = () => {
    this.setState({
      isMinimized: !this.state.isMinimized,
    });
  };

  static isReady() {
    return typeof window[FRAME_TOGGLE_FUNCTION] !== 'undefined';
  }

  static toggle() {
    if (window[FRAME_TOGGLE_FUNCTION]) {
      window[FRAME_TOGGLE_FUNCTION]();
    }
  }
}

export default PXFrame;
