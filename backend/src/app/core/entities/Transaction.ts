import { Entity, EntityImpl } from './Entity'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from '../definitions/Currency'

export const ACCOUNT_NUMBER_MIN = 1000
export const ACCOUNT_NUMBER_MAX = 9999

export interface Transaction extends Entity {
	accountNumber: number
	amount: number
	exchangeRate?: number
	currencyCode?: string
}

export class TransactionImpl extends EntityImpl implements Transaction {
	accountNumber: number
	amount: number
	exchangeRate?: number
	currencyCode?: string

	constructor(data: Transaction) {
		super(data)
		this.accountNumber = data.accountNumber
		this.amount = data.amount
		this.exchangeRate = data.exchangeRate
		this.currencyCode = data.currencyCode
	}

	validate(): EntityErrors[] {
		let errors = super.validate()

		// Account number - Check that the account number is valid
		if (this.accountNumber < ACCOUNT_NUMBER_MIN || this.accountNumber > ACCOUNT_NUMBER_MAX) {
			errors.push(EntityErrors.accountNumberOutOfRange)
		}

		// Account number is floating point
		if (!Number.isInteger(this.accountNumber)) {
			errors.push(EntityErrors.accountNumberInvalidFormat)
		}

		// Amount original - Checks so the amount isn't exactly 0
		if (this.amount == 0) {
			errors.push(EntityErrors.amountOriginalIsZero)
		}

		// Currency
		if (this.currencyCode) {
			// Needs exchange rate
			if (typeof this.exchangeRate === 'undefined') {
				errors.push(EntityErrors.exchangeRateNotSet)
			}
			// Checks so the currency is valid
			if (!Currency.codeIsValid(this.currencyCode)) {
				errors.push(EntityErrors.currencyCodeInvalid)
			}
		}

		if (typeof this.exchangeRate !== 'undefined') {
			// Needs currency codes
			if (!this.currencyCode) {
				errors.push(EntityErrors.currencyCodeNotSet)
			}
			// Exchange rate needs to be more than 0
			if (this.exchangeRate <= 0) {
				errors.push(EntityErrors.exchangeRateNegativeOrZero)
			}
		}

		return errors
	}
}
