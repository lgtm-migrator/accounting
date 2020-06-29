import { Entity } from './Entity'
import { Transaction } from './Transaction'
import { Id } from '../definitions/Id'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from './Currency'

const ISO_DATE_REGEX = /^\d\d\d\d-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|3[0-1])$/

export namespace Verification {
	export interface Option extends Entity.Option {
		userId: Id
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
	userId: Id
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

		this.userId = data.userId
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

	validate(): EntityErrors[] {
		const errors = super.validate()

		// User ID
		if (typeof this.userId === 'string') {
			if (this.userId.length <= 0) {
				errors.push(EntityErrors.userIdIsEmpty)
			}
		}

		// Name
		if (this.name.length < 2) {
			errors.push(EntityErrors.nameTooShort)
		}

		// Type
		if (this.type == Verification.Types.INVALID) {
			errors.push(EntityErrors.verificationTypeInvalid)
		}

		// Verification number
		if (typeof this.number === 'number') {
			// Requires a filed date
			if (typeof this.dateFiled === 'undefined') {
				errors.push(EntityErrors.verificationDateFiledMissing)
			}

			if (this.number <= 0) {
				errors.push(EntityErrors.verificationNumberInvalid)
			}
		}

		// Date should be in ISO format
		if (typeof this.date !== 'undefined') {
			if (ISO_DATE_REGEX.test(this.date)) {
				// Check so the date is actually valide
				const parsedDate = Date.parse(this.date)
				if (parsedDate === NaN) {
					errors.push(EntityErrors.verificationDateInvalidFormat)
				}
				// Special case for February 29
				else if (new Date(parsedDate).toISOString().substr(0, 10) != this.date) {
					errors.push(EntityErrors.verificationDateInvalidFormat)
				}
			} else {
				errors.push(EntityErrors.verificationDateInvalidFormat)
			}
		}

		// Filed date should be after creation date
		if (typeof this.dateFiled === 'number') {
			// Requires verification number
			if (typeof this.number === 'undefined') {
				errors.push(EntityErrors.verificationNumberMissing)
			}

			if (typeof this.dateCreated === 'undefined') {
				errors.push(EntityErrors.dateCreatedMissing)
			} else if (this.dateFiled < this.dateCreated) {
				errors.push(EntityErrors.verificationDateFiledBeforeCreated)
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
				errors.push(EntityErrors.verificationAmountDoesNotMatchAnyTransaction)
			}
		}

		// Invoice Id
		if (typeof this.invoiceId === 'string') {
			if (this.invoiceId.length <= 0) {
				errors.push(EntityErrors.verificationInvoiceIdIsEmpty)
			}
		}

		// Payment Id
		if (typeof this.paymentId === 'string') {
			if (this.paymentId.length <= 0) {
				errors.push(EntityErrors.verificationPaymentIdIsEmpty)
			}
		}

		// Transactions
		this.validateTransactions(errors)

		return errors
	}

	private validateTransactions(errors: EntityErrors[]) {
		const localCurrencyCode = this.findLocalCurrencyCode()

		// No transactions
		if (this.transactions.length == 0) {
			errors.push(EntityErrors.transactionsMissing)
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
				errors.push(EntityErrors.transactionsCurrencyCodeLocalMismatch)
				return
			}

			sum += localAmount.amount
		}

		if (sum != 0n) {
			errors.push(EntityErrors.transactionSumIsNotZero)
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
