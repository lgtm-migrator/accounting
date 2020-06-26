import { Immutable } from '../../core/definitions/Immutable'
import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'

export interface VerificationNewInputInterface extends Input {
	userId: Id
	verification: {
		name: string
		internalName?: string
		description?: string
		type: string
		date: string
		amount: number
		accountFrom: number
		accountTo: number
		currencyCode: string
		files?: string[]
	}
}

export type VerificationNewInput = Immutable<VerificationNewInputInterface>
