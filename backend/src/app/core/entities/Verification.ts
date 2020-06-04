import { Entity, EntityImpl } from './Entity'
import { Transaction, TransactionImpl } from './Transaction'
import { Id } from '../definitions/Id'
import { Immutable } from '../definitions/Immutable'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from '../definitions/Currency'

const ISO_DATE_REGEX = /^\d\d\d\d-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|3[0-1])$/

export enum VerificationTypes {
	INVOICE_IN = 'INVOICE_IN',
	INVOICE_IN_PAYMENT = 'INVOICE_IN_PAYMENT',
	INVOICE_OUT = 'INVOICE_OUT',
	INVOICE_OUT_PAYMENT = 'INVOICE_OUT_PAYMENT',
	PAYMENT_DIRECT = 'PAYMENT_DIRECT',
	TRANSACTION = 'TRANSACTION',
}

export interface Verification extends Entity {
	userId: Id
	name: string
	internalName?: string
	number?: number
	date: string
	dateFiled?: number
	type: VerificationTypes
	description?: string
	totalAmount?: Currency
	files?: string[]
	invoiceId?: Id
	paymentId?: Id
	requireConfirmation?: boolean
	transactions: Transaction[]
}

export type ImmutableVerification = Immutable<Verification>

export class VerificationImpl extends EntityImpl implements Verification {
	userId: Id
	name: string
	internalName?: string
	number?: number
	date: string
	dateFiled?: number
	type: VerificationTypes
	description?: string
	totalAmount: Currency
	files?: string[]
	invoiceId?: Id
	paymentId?: Id
	requireConfirmation?: boolean
	transactions: TransactionImpl[]

	constructor(data: Verification) {
		super(data)

		this.userId = data.userId
		this.name = data.name
		this.internalName = data.internalName
		this.number = data.number
		this.date = data.date
		this.dateFiled = data.dateFiled
		this.type = data.type
		this.description = data.description
		this.files = data.files
		this.invoiceId = data.invoiceId
		this.paymentId = data.paymentId
		this.requireConfirmation = data.requireConfirmation
		this.transactions = []

		// Convert transactions to implementation versions
		data.transactions.forEach((transaction) => {
			this.transactions.push(new TransactionImpl(transaction))
		})

		// Calculate total original amount
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
		if (this.totalAmount) {
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
		// Check for errors in each transaction
		this.transactions.forEach((transaction) => {
			errors.push(...transaction.validate())
		})

		// Make sure all transaction amounts add up to 0 (locally)
		let sum = 0n
		this.transactions.forEach((transaction) => {
			sum += transaction.getLocalAmount().amount
		})

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
		this.transactions.forEach((transaction) => {
			const currency = transaction.currency
			if (currency.isLargerThan(largest)) {
				largest = currency
			}
		})

		if (largest.isNegative()) {
			largest = largest.negate()
		}

		return largest
	}

	/**
	 * Iterate through all transactions and see if there's a local
	 * currency code available. If not, we use the currency code
	 * of the transaction's code directly
	 * @return local currency code
	 */
	private findLocalCurrencyCode(): Currency.Code {
		for (let i = 0; i < this.transactions.length; ++i) {
			const transaction = this.transactions[i]
			const localCode = transaction.getLocalCurrencyCode()
			if (localCode) {
				return localCode
			}
		}

		return this.transactions[0].getCurrencyCode()
	}
}
