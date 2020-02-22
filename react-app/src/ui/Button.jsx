import React from 'react';

class Button extends React.Component {
  constructor(props) {
    super(props);
    this.onClick = this.onClick.bind(this);
  }

  render() {
    let type = 'button';
    if (typeof this.props.type !== 'undefined') {
      type = this.props.type
    }
    return (
      <button type={type} onClick={this.props.onClick}>{this.props.text}</button>
    );
  }

  onClick(event) {
    if (this.props.onClick !== 'undefined') {
      this.props.onClick();
    }
  }
}

export default Button;