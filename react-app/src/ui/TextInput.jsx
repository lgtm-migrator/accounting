import React from 'react';

class TextInput extends React.Component {
  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  render() {
    const type = this.props.name.includes('password') ? 'password' : 'text';
    return (
      <input type={type} name={this.props.name} value={this.props.value} placeholder={this.props.placeholder} onChange={this.onChange} />
    );
  }

  onChange(event) {
    this.props.onChange(event.target.value);
  }
}

export default TextInput;