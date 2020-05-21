import { Input } from '../core/definitions/Input'

/**
 * Input from an adapter to the VerifyApiKeyInteractor
 */
export interface VerifyApiKeyInput extends Input {
	apiKey: string
}
