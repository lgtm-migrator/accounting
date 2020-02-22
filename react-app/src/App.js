import React from 'react';
import Login from './pages/Login'
import './App.css';
import {
  Switch,
  Route,
  withRouter
} from 'react-router-dom';
import Verifications from './pages/Verifications';
import { PageFunctionContext } from './contexts/PageFunctions';

class App extends React.Component {
  static contextType = PageFunctionContext;

  constructor(props) {
    super(props)

    this.checkForRedirects();
  }

  render() {
    this.context.history = this.props.history;

    return (

      <Switch>
        <Route exact path="/verifications">
          <Verifications />
        </Route>
        <Route exact path="/">
          <Login />
        </Route>
      </Switch>
    );
  }

  checkForRedirects() {
    let loggedIn = sessionStorage.getItem('logged_in') !== null;
    let onLoginPage = this.props.location.pathname === '/';

    // Redirect to login page
    if (!loggedIn && !onLoginPage) {
      this.props.history.push('/');
    }
    // Redirect to verifications once we've logged in
    else if (loggedIn && onLoginPage) {
      this.props.history.push('/verifications');
    }
  }
}



export default withRouter(App);
