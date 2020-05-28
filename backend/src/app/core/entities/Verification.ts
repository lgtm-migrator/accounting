import { Entity } from './Entity'
import { Transaction } from './Transaction'
import { Id } from '../definitions/Id'
import { Immutable } from '../definitions/Immutable'

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
	internalName: string
	verificationNumber?: number
	date: string
	dateFiled: string
	type: VerificationTypes
	description: string
	totalAmountLocal: number
	totalAmountOriginal: number
	files: string[]
	invoiceId?: Id
	paymentId?: Id
	requireConfirmation?: boolean
	transactions: Transaction[]
}

export type ImmutableVerification = Immutable<Verification>

// TODO Create verification implementation
