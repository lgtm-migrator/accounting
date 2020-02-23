import React from 'react';
import Select from '../ui/Select';
import TextInput from '../ui/TextInput';

class PaymentNew extends React.Component {
	constructor(props) {
		super(props);

		this.onSubmit = this.onSubmit.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onTypeChange = this.onTypeChange.bind(this);
	}

	state = {
		header: '',
		date: '',
		type: '',
		name: '',
		file: '',
		amount: '',
		originalAmount: '',
		currency: 'SEK',
		accountCost: '',
		accountFrom: 2440,
		reverseVat: true,
	}

	componentDidMount() {
		this.onTypeChange('INVOICE_IN');
	}

	render() {
		return (
			<div id="paymentNew">
				<h1>{this.state.header}</h1>
				<form onSubmit={this.onSubmit}>
					<div className="verification">
						<input type="text" name="date" placeholder="Date" value={this.state.date} onChange={this.onChange} />
						{this.renderSelectType()}
						<input type="text" name="name" placeholder="Name" value={this.state.name} onChange={this.onChange} />
					</div>
					<div className="info">
						<p>
							<span className="label">Payed</span>
							<input type="text" name="amount" placeholder="Amount" value={this.state.amount} onChange={this.onChange} />
							<input type="text" className="currency" name="currency" placeholder="Currency" value={this.state.currency} onChange={this.onChange} />
						</p>
						<p className={this.state.currency === 'SEK' ? 'hidden' : ''}>
							<span className="label">Original amount</span>
							<input type="text" name="originalAmount" value={this.state.originalAmount} onChange={this.onChange} />
						</p>
						<p>
							<span className="label">Cost Account</span>
							<input type="text" name="accountCost" placeholder="Cost Account" value={this.state.accountCost} onChange={this.onChange} />
						</p>
						<p className={this.state.currency === 'SEK' ? 'hidden' : ''}>
							<span className="label">Reverse VAT?</span>
							<input type="checkbox" name="reverseVat" checked={this.state.reverseVat} onChange={this.onChange} />
						</p>
						<p>
							<span className="label">From Account</span>
							<input type="text" name="accountFrom" placeholder="Payed from account" value={this.state.accountFrom} onChange={this.onChange} />
						</p>
					</div>
				</form>
			</div>
		);
	}

	renderHideWhenSek() {
		if (this.state === 'SEK') {
			return 'hidden';
		} else {
			return '';
		}
	}

	renderSelectType() {
		const options = [
			{ value: 'INVOICE_IN', label: 'Invoice' },
			{ value: 'INVOICE_IN_PAYMENT', label: 'Payed invoice' },
			{ value: 'PAYMENT_DIRECT', label: 'Payed directly' }
		];
		return (
			<Select options={options} default="INVOICE_IN" onChange={this.onTypeChange} />
		);
	}

	onSubmit(event) {
		event.preventDefault();
	}

	onChange(event) {
		this.setState({ [event.target.name]: event.target.value });
	}

	onTypeChange(type) {
		this.setState({ type: type });
		switch (type) {
			case 'INVOICE_IN':
				this.setState({ header: 'New Invoice Received' });
				break;
			case 'INVOICE_IN_PAYMENT':
				this.setState({ header: 'New Invoice Payment' });
				break;
			case 'PAYMENT_DIRECT':
				this.setState({ header: 'New Direct Payment' });
				break;
			default:
				this.setState({ header: 'Invalid' });
				break;
		}
	}
}

export default PaymentNew;