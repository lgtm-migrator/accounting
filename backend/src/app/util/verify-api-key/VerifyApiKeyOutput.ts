import { Id } from '../../core/definitions/Id'
import { Immutable } from '../../core/definitions/Immutable'
import { Output } from '../../core/definitions/Output'

interface VerifyApiKeyOutputInterface extends Output {
	id: Id
}

export type VerifyApiKeyOutput = Immutable<VerifyApiKeyOutputInterface>
