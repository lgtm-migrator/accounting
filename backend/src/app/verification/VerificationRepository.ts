import { Currency } from '../core/entities/Currency'
import { Id } from '../core/definitions/Id'

export interface VerificationRepository {
	/**
	 * Get the local currency for the specified user
	 * @param userId the user to get the local currency code from
	 * @return local currency code
	 */
	getLocalCurrency(userId: Id): Promise<Currency.Code>
}
