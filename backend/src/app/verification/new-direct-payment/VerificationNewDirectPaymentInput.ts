import { Immutable } from '../../core/definitions/Immutable'
import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'

interface VerificationNewDirectPaymentInputInterface extends Input {
	userId: Id
	verification: {
		name: string
		description?: string
		date: string
		payed: number
		vatPercent: number
		accountFrom: number
		accountTo: number
		currencyCode: string
		files?: string
	}
}

export type VerificationNewDirectPaymentInput = Immutable<VerificationNewDirectPaymentInputInterface>
