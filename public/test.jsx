'use strict';

import "test2.jsx";

class Content extends React.Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<React.Fragment>
			<Test />
			</React.Fragment>
		);
	}
}

const domContainer = document.querySelector('#content');
ReactDOM.render(<Content />, domContainer);
