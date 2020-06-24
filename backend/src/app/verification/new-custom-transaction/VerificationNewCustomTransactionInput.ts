import { Immutable } from '../../core/definitions/Immutable'
import { Id } from '../../core/definitions/Id'
import { Input } from '../../core/definitions/Input'

/**
 * Transaction Data
 */
export interface TransactionInputData {
	accountNumber: number
	amount: number | bigint
	currencyCode: string
}

/**
 * Custom transaction input.
 */
interface VerificationNewCustomTransactionInputInterface extends Input {
	verification: {
		name: string
		description?: string
		date: string
		files?: string[]
		transactions: TransactionInputData[]
	}
	userId: Id
}

export type VerificationNewCustomTransactionInput = Immutable<VerificationNewCustomTransactionInputInterface>
