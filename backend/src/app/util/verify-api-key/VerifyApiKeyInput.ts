import { Immutable } from '../../core/definitions/Immutable'
import { Input } from '../../core/definitions/Input'

interface VerifyApiKeyInputInterface extends Input {
	apiKey: string
}

export type VerifyApiKeyInput = Immutable<VerifyApiKeyInputInterface>
