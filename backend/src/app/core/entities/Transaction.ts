import { Entity, EntityImpl } from './Entity'
import { EntityErrors } from '../definitions/EntityErrors'
import { Immutable } from '../definitions/Immutable'
import { Currency } from '../definitions/Currency'

export const ACCOUNT_NUMBER_MIN = 1000
export const ACCOUNT_NUMBER_MAX = 9999

export interface Transaction extends Entity {
	accountNumber: number
	currency: Currency
}

export type ImmutableTransaction = Immutable<Transaction>

export class TransactionImpl extends EntityImpl implements Transaction {
	accountNumber: number
	currency: Currency
	exchangeRate?: number

	constructor(data: Transaction) {
		super(data)
		this.accountNumber = data.accountNumber
		this.currency = data.currency
	}

	/**
	 * If an exchange rate is set it calculates the local amount from amount * exchange rate and rounds the result up
	 * @return local amount
	 */
	getLocalAmount(): Currency {
		return TransactionImpl.getLocalAmount(this)
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

	validate(): EntityErrors[] {
		const errors = super.validate()

		// Account number - Check that the account number is valid
		if (this.accountNumber < ACCOUNT_NUMBER_MIN || this.accountNumber > ACCOUNT_NUMBER_MAX) {
			errors.push(EntityErrors.accountNumberOutOfRange)
		}

		// Account number is floating point
		if (!Number.isInteger(this.accountNumber)) {
			errors.push(EntityErrors.accountNumberInvalidFormat)
		}

		// Amount original - Checks so the amount isn't exactly 0
		if (this.currency.isZero()) {
			errors.push(EntityErrors.amountIsZero)
		}

		return errors
	}
}
