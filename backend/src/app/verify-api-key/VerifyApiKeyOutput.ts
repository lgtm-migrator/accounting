import { Output } from '../core/definitions/Output'
import { Id } from '../core/definitions/Id'

/**
 * Output to the Adapter from the VerifyApiKeyInteractor
 */
export interface VerifyApiKeyOutput extends Output {
	id: Id
}
