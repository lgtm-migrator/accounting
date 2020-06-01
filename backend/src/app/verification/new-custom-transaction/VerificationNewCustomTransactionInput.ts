import { Immutable } from '../../core/definitions/Immutable'
import { Id } from '../../core/definitions/Id'
import { Input } from '../../core/definitions/Input'

/**
 * Custom transaction input.
 */
interface VerificationNewCustomTransactionInputInterface extends Input {
	verification: {
		name: string
		date: Date
		pdfFilepaths?: string[]
		transactions: {
			account_number: number
			amount: number
			currency: string
		}[]
	}
	userId: Id
}

export type VerificationNewCustomTransactionInput = Immutable<VerificationNewCustomTransactionInputInterface>
