import { Id } from '../../core/definitions/Id'
import { Input } from '../../core/definitions/Input'

/**
 * Transaction Data
 */
export interface TransactionInputData {
	readonly accountNumber: number
	readonly amount: number | bigint
	readonly currencyCode: string
}

/**
 * Custom transaction input.
 */
export interface VerificationNewCustomTransactionInput extends Input {
	readonly verification: {
		readonly name: string
		readonly description?: string
		readonly date: string
		readonly transactions: TransactionInputData[]
	}
	readonly userId: Id
}
