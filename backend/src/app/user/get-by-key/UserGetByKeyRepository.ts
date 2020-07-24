import { Id } from '../../core/definitions/Id'
import { Repository } from '../../core/definitions/Repository'

export interface UserGetByKeyRepository extends Repository {
	/**
	 * Get user id with the specified API key
	 * @param apiKey get the user id which has this API key
	 * @returns Promise that contains the user's id
	 * @throws {OutputError.Types.userNotFound} if the user isn't found
	 * @throws {OutputError.Types.internalError} if something else went wrong
	 */
	findUserWithApiKey(apiKey: string): Promise<Id>
}
