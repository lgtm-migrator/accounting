import React from 'react';
import './transaction_new.css'
import VerificationInfo from '../ui/VerificationEdit';

class TransactionNew extends React.Component {
	constructor(props) {
		super(props);

		this.fileRef = React.createRef();

		this.onSubmit = this.onSubmit.bind(this);
	}

	state = {
		input: {
			date: '',
			name: '',
		},
		accounts: {},
	}

	render() {
		return (
			<div id="transactionNew">
				<h1>New Transaction</h1>
				<form onSubmit={this.onSubmit}>
					<VerificationInfo
						date={this.state.input.date}
						name={this.state.input.name}
						fileRef={this.fileRef}
					/>
				</form>
			</div>
		);
	}

	onSubmit(event) {
		event.preventDefault();
	}
}

// class Transaction extends React.Component {
// 	render() {
// 		return (

// 		);
// 	}
// }

export default TransactionNew;