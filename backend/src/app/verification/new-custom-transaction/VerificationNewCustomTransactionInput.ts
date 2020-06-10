import { Immutable } from '../../core/definitions/Immutable'
import { Id } from '../../core/definitions/Id'
import { Input } from '../../core/definitions/Input'

/**
 * Custom transaction input.
 */
interface VerificationNewCustomTransactionInputInterface extends Input {
	verification: {
		name: string
		description?: string
		date: string
		files?: string[]
		transactions: {
			accountNumber: number
			amount: bigint
			currencyCode: string
		}[]
	}
	userId: Id
}

export type VerificationNewCustomTransactionInput = Immutable<VerificationNewCustomTransactionInputInterface>
