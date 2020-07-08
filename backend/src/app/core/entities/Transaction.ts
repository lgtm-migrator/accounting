import { Entity } from './Entity'
import { EntityErrors } from '../definitions/EntityErrors'
import { Immutable } from '../definitions/Immutable'
import { Currency } from './Currency'
import { Consts } from '../definitions/Consts'
import { OutputError } from '../definitions/OutputError'

export namespace Transaction {
	export interface Option extends Entity.Option {
		accountNumber: number
		currency: Currency
	}
}

export type ImmutableTransaction = Immutable<Transaction>

export class Transaction extends Entity implements Transaction.Option {
	accountNumber: number
	currency: Currency

	constructor(data: Transaction.Option) {
		super(data)
		this.accountNumber = data.accountNumber
		this.currency = data.currency
	}

	/**
	 * If an exchange rate is set it calculates the local amount from amount * exchange rate and rounds the result up
	 * @return local amount
	 */
	getLocalAmount(): Currency {
		return Transaction.getLocalAmount(this)
	}

	static getLocalAmount(transaction: Transaction): Currency {
		return transaction.currency.getLocalCurrency()
	}

	/**
	 * @return the local currency code if it exists. undefined if it doesn't exist
	 */
	getLocalCurrencyCode(): Currency.Code | undefined {
		return this.currency.localCode
	}

	/**
	 * @return the currency code for this transaction
	 */
	getCurrencyCode(): Currency.Code {
		return this.currency.code
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Account number - Check that the account number is valid
		if (this.accountNumber < Consts.ACCOUNT_NUMBER_START || this.accountNumber > Consts.ACCOUNT_NUMBER_END) {
			const data = `${this.accountNumber} < ${Consts.ACCOUNT_NUMBER_START} || ${this.accountNumber} > ${Consts.ACCOUNT_NUMBER_END}`
			errors.push({ error: EntityErrors.accountNumberOutOfRange, data: data })
		}

		// Account number is floating point
		if (!Number.isInteger(this.accountNumber)) {
			errors.push({ error: EntityErrors.accountNumberInvalidFormat, data: `${this.accountNumber}` })
		}

		// Amount original - Checks so the amount isn't exactly 0
		if (this.currency.isZero()) {
			errors.push({ error: EntityErrors.amountIsZero })
		}

		return errors
	}
}
