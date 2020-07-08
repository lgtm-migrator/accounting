import { Entity } from './Entity'
import { Transaction } from './Transaction'
import { Id } from '../definitions/Id'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from './Currency'
import { Consts } from '../definitions/Consts'
import '../definitions/String'
import { OutputError } from '../definitions/OutputError'

export namespace Verification {
	export interface Option extends Entity.Option {
		name: string
		internalName?: string
		number?: number
		date: string
		dateFiled?: number
		type: Types
		description?: string
		totalAmount?: Currency
		files?: string[]
		invoiceId?: Id
		paymentId?: Id
		requireConfirmation?: boolean
		transactions: Transaction.Option[]
	}
}

export class Verification extends Entity implements Verification.Option {
	name: string
	internalName?: string
	number?: number
	date: string
	dateFiled?: number
	type: Verification.Types
	description?: string
	totalAmount: Currency
	files?: string[]
	invoiceId?: Id
	paymentId?: Id
	requireConfirmation?: boolean
	transactions: Transaction[]

	constructor(data: Verification.Option) {
		super(data)

		this.name = data.name
		this.internalName = data.internalName
		this.number = data.number
		this.date = data.date
		this.dateFiled = data.dateFiled
		this.type = data.type
		this.description = data.description
		this.invoiceId = data.invoiceId
		this.paymentId = data.paymentId
		this.requireConfirmation = data.requireConfirmation
		this.transactions = []

		// Create new array for files
		if (data.files) {
			this.files = data.files.concat()
		}

		// Deep copy transactions
		for (let transaction of data.transactions) {
			this.transactions.push(new Transaction(transaction))
		}

		// Calculate total amount
		if (typeof data.totalAmount === 'undefined') {
			this.totalAmount = this.getLargestAmount()
		} else {
			this.totalAmount = data.totalAmount
		}
	}

	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Name
		if (this.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ error: EntityErrors.nameTooShort, data: this.name })
		}

		// Internal name
		if (this.internalName && this.internalName.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ error: EntityErrors.internalNameTooShort, data: this.internalName })
		}

		// Type
		if (this.type == Verification.Types.INVALID) {
			errors.push({ error: EntityErrors.verificationTypeInvalid })
		}

		// Verification number
		if (typeof this.number === 'number') {
			// Requires a filed date
			if (typeof this.dateFiled === 'undefined') {
				errors.push({ error: EntityErrors.verificationDateFiledMissing })
			}

			if (this.number <= 0) {
				const data = `${this.number} <= 0`
				errors.push({ error: EntityErrors.verificationNumberInvalid, data: data })
			}
		}

		// Date should be in ISO format
		if (typeof this.date !== 'undefined') {
			if (!this.date.isValidIsoDate()) {
				errors.push({ error: EntityErrors.verificationDateInvalidFormat, data: this.date })
			}
		}

		// Filed date should be after creation date
		if (typeof this.dateFiled === 'number') {
			// Requires verification number
			if (typeof this.number === 'undefined') {
				errors.push({ error: EntityErrors.verificationNumberMissing })
			}

			if (typeof this.dateCreated === 'undefined') {
				errors.push({ error: EntityErrors.dateCreatedMissing })
			} else if (this.dateFiled < this.dateCreated) {
				const data = `${this.dateFiled} < ${this.dateCreated}`
				errors.push({ error: EntityErrors.verificationDateFiledBeforeCreated, data: data })
			}
		}

		// Total amount
		if (this.transactions.length > 0) {
			let found = false
			for (let transaction of this.transactions) {
				if (this.totalAmount.isComparableTo(transaction.currency)) {
					if (this.totalAmount.isEqualTo(transaction.currency)) {
						found = true
						break
					}
				}
			}

			if (!found) {
				errors.push({ error: EntityErrors.verificationAmountDoesNotMatchAnyTransaction })
			}
		}

		// Invoice Id
		if (typeof this.invoiceId === 'string') {
			if (this.invoiceId.length <= 0) {
				errors.push({ error: EntityErrors.verificationInvoiceIdIsEmpty })
			}
		}

		// Payment Id
		if (typeof this.paymentId === 'string') {
			if (this.paymentId.length <= 0) {
				errors.push({ error: EntityErrors.verificationPaymentIdIsEmpty })
			}
		}

		// Transactions
		this.validateTransactions(errors)

		return errors
	}

	private validateTransactions(errors: OutputError.Info[]) {
		const localCurrencyCode = this.findLocalCurrencyCode()

		// No transactions
		if (this.transactions.length == 0) {
			errors.push({ error: EntityErrors.transactionsMissing })
		}

		// Check for errors in each transaction
		for (let transaction of this.transactions) {
			errors.push(...transaction.validate())
		}

		// Make sure all transaction amounts add up to 0 (locally)
		let sum = 0n
		for (let transaction of this.transactions) {
			const localAmount = transaction.getLocalAmount()

			// Local code doesn't match
			if (localAmount.code != localCurrencyCode) {
				const data = `${localAmount.code.name} != ${localCurrencyCode.name}`
				errors.push({ error: EntityErrors.transactionsCurrencyCodeLocalMismatch, data: data })
				return
			}

			sum += localAmount.amount
		}

		if (sum != 0n) {
			errors.push({ error: EntityErrors.transactionSumIsNotZero, data: `${sum}` })
		}
	}

	/**
	 * @return largest amount from all transactions
	 */
	private getLargestAmount(): Currency {
		const localCurrency = this.findLocalCurrencyCode()
		let largest = new Currency({ amount: 0n, code: localCurrency })
		for (const transaction of this.transactions) {
			// Try if the amount isn't comparable to the local currency
			try {
				const currency = transaction.currency
				if (currency.isLargerThan(largest)) {
					largest = currency
				}
			} catch (InternalError) {
				// Does nothing
			}
		}

		return largest.absolute()
	}

	/**
	 * Iterate through all transactions and see if there's a local
	 * currency code available. If not, we use the currency code
	 * of the transaction's code directly
	 * @return local currency code
	 */
	private findLocalCurrencyCode(): Currency.Code {
		for (const transaction of this.transactions) {
			const localCode = transaction.getLocalCurrencyCode()
			if (localCode) {
				return localCode
			}
		}

		if (this.transactions.length > 0) {
			return this.transactions[0].getCurrencyCode()
		}
		// Return 'invalid' currency code if none is applicable
		else {
			return Currency.Codes.XTS
		}
	}
}

export namespace Verification {
	export enum Types {
		INVOICE_IN = 'INVOICE_IN',
		INVOICE_IN_PAYMENT = 'INVOICE_IN_PAYMENT',
		INVOICE_OUT = 'INVOICE_OUT',
		INVOICE_OUT_PAYMENT = 'INVOICE_OUT_PAYMENT',
		PAYMENT_DIRECT_IN = 'PAYMENT_DIRECT_IN',
		PAYMENT_DIRECT_OUT = 'PAYMENT_DIRECT_OUT',
		TRANSACTION = 'TRANSACTION',
		INVALID = 'INVALID',
	}

	export namespace Types {
		/**
		 * Convert a string type into an {Types} object
		 * @param type string value of the type (case-insensivite)
		 * @return the correct {Type} object if found or INVALID if it's invalid
		 */
		export function fromString(type: string): Types {
			type = type.toUpperCase()
			for (const value of Object.values(Types)) {
				if (value as keyof typeof Types) {
					if (value === type) {
						return Types[value]
					}
				}
			}
			return Types.INVALID
		}
	}
}
