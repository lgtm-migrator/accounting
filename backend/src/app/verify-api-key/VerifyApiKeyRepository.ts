import { Id } from '../core/definitions/Id'
import { Repository } from '../core/definitions/Repository'

/**
 * Repository used in the {VerifyApiKeyInteractor}
 */
export interface VerifyApiKeyRepository extends Repository {
	/**
	 * Get user id with the specified API key
	 * @async
	 * @param apiKey get the user id which has this API key
	 * @returns {Id} Promise that contains the user's id
	 * @throws user_not_found if the user isn't found
	 * @throws general_error if something else went wrong
	 */
	findUserWithApiKey(apiKey: string): Promise<Id>
}
