import { Input } from '../../core/definitions/Input'

export interface VerifyApiKeyInput extends Input {
	readonly apiKey: string
}
