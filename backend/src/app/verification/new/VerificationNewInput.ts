import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'

export interface VerificationNewInput extends Input {
	readonly userId: Id
	readonly verification: {
		readonly name: string
		readonly internalName?: string
		readonly description?: string
		readonly type: string
		readonly date: string
		readonly amount: number
		readonly accountFrom: number
		readonly accountTo: number
		readonly currencyCode: string
	}
}
