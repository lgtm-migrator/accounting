import { Entity, EntityImpl } from './Entity'
import { Transaction, TransactionImpl } from './Transaction'
import { Id } from '../definitions/Id'
import { Immutable } from '../definitions/Immutable'
import { EntityErrors } from '../definitions/EntityErrors'
import DineroFactory, { Dinero } from 'dinero.js'
import { parse } from 'querystring'

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
	totalAmountLocal?: Dinero
	totalAmountOriginal?: Dinero
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
	totalAmountLocal: Dinero
	totalAmountOriginal: Dinero
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

		// Calculate total local amount
		if (typeof data.totalAmountLocal === 'undefined') {
			this.totalAmountLocal = this.getLargestLocalAmount()
		} else {
			this.totalAmountLocal = data.totalAmountLocal
		}

		// Calculate total original amount
		if (typeof data.totalAmountOriginal === 'undefined') {
			this.totalAmountOriginal = this.getLargestOriginalAmount()
		} else {
			this.totalAmountOriginal = data.totalAmountOriginal
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

		// Total amount local - Check so that one transaction at least has this amount
		if (this.totalAmountLocal) {
			const amountVar = this.totalAmountLocal.getAmount()
			let found = false
			this.transactions.forEach((transaction) => {
				const transactionAmount = transaction.getLocalAmount().getAmount()
				if (Math.abs(transactionAmount) == amountVar) {
					found = true
				}
			})

			if (!found) {
				errors.push(EntityErrors.verificationLocalAmountDoesNotMatchAnyTransaction)
			}
		}

		// Total amount original
		if (this.totalAmountOriginal) {
			const amountVar = this.totalAmountOriginal.getAmount()
			let found = false
			this.transactions.forEach((transaction) => {
				const transactionAmount = transaction.amount.getAmount()
				if (Math.abs(transactionAmount) == amountVar) {
					found = true
				}
			})

			if (!found) {
				errors.push(EntityErrors.verificationOriginalAmountDoesNotMatchAnyTransaction)
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

	private validateTransactions(errors: EntityErrors[]) {}

	/**
	 * @return largest original amount from all transactions
	 */
	private getLargestOriginalAmount(): Dinero {
		let largest: Dinero = DineroFactory({ amount: 0 })
		this.transactions.forEach((transaction) => {
			let localAmount = transaction.getLocalAmount()

			// Make the amount positive
			if (localAmount.isNegative()) {
				localAmount = localAmount.multiply(-1)
			}

			if (localAmount.getAmount() > largest.getAmount()) {
				largest = localAmount
			}
		})

		return largest
	}

	/**
	 * @return largest local amount from all transactions
	 */
	private getLargestLocalAmount(): Dinero {
		let largest: Dinero = DineroFactory({ amount: 0 })
		this.transactions.forEach((transaction) => {
			let originalAmount = transaction.amount

			// Make the amount positive
			if (originalAmount.isNegative()) {
				originalAmount = originalAmount.multiply(-1)
			}

			if (originalAmount.getAmount() > largest.getAmount()) {
				largest = originalAmount
			}
		})

		return largest
	}
}
