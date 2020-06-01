import { Entity, EntityImpl } from './Entity'
import { EntityErrors } from '../definitions/EntityErrors'
import DineroFactory, { Dinero } from 'dinero.js'
import { Immutable } from '../definitions/Immutable'
import { CurrencyCodes } from '../definitions/Currency'

export const ACCOUNT_NUMBER_MIN = 1000
export const ACCOUNT_NUMBER_MAX = 9999

export interface Transaction extends Entity {
	accountNumber: number
	amount: Dinero
	exchangeRate?: number
}

export type ImmutableTransaction = Immutable<Transaction>

export class TransactionImpl extends EntityImpl implements Transaction {
	accountNumber: number
	amount: Dinero
	exchangeRate?: number

	constructor(data: Transaction) {
		super(data)
		this.accountNumber = data.accountNumber
		this.amount = data.amount
		this.exchangeRate = data.exchangeRate
	}

	/**
	 * If an exchange rate is set it calculates the local amount from amount * exchange rate and rounds the result up
	 * @return local amount
	 */
	getLocalAmount(): Dinero {
		return TransactionImpl.getLocalAmount(this)
	}

	static getLocalAmount(transaction: Transaction): Dinero {
		let localAmount = transaction.amount
		if (transaction.exchangeRate) {
			const convertedAmount = localAmount.multiply(transaction.exchangeRate, 'HALF_UP').getAmount()
			localAmount = DineroFactory({ amount: convertedAmount, currency: CurrencyCodes.LOCAL })
		}
		return localAmount
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
		if (this.amount.isZero()) {
			errors.push(EntityErrors.amountOriginalIsZero)
		}

		// Currency
		if (this.amount.getCurrency() !== CurrencyCodes.LOCAL) {
			// Needs exchange rate
			if (typeof this.exchangeRate === 'undefined') {
				errors.push(EntityErrors.exchangeRateNotSet)
			}
			// Checks so the currency is valid
			if (!CurrencyCodes.isValid(this.amount.getCurrency())) {
				errors.push(EntityErrors.currencyCodeInvalid)
			}
		}

		// Exchange rate
		if (typeof this.exchangeRate !== 'undefined') {
			// Currency code is not set to something else than local
			if (this.amount.getCurrency() === CurrencyCodes.LOCAL) {
				errors.push(EntityErrors.currencyCodeIsLocal)
			}
			// Exchange rate needs to be more than 0
			if (this.exchangeRate <= 0) {
				errors.push(EntityErrors.exchangeRateNegativeOrZero)
			}
		}

		return errors
	}
}
