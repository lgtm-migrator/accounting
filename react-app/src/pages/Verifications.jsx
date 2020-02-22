import React from 'react';
import Button from '../ui/Button';
import { PageFunctionContext } from '../contexts/PageFunctions';

class Verification extends React.Component {
  static contextType = PageFunctionContext;

  constructor(props) {
    super(props);
    this.logout = this.logout.bind(this);
  }

  render() {
    return (
      <React.Fragment>
        <h1>Verifications</h1>
        <Button onClick={this.logout} text="Logout" />
      </React.Fragment>
    );
  }

  logout() {
    sessionStorage.removeItem('logged_in');
    this.context.history.push('/');
  }
}

export default Verification;