import { Id } from '../../core/definitions/Id'
import { Output } from '../../core/definitions/Output'

export interface VerifyApiKeyOutput extends Output {
	readonly id: Id
}
