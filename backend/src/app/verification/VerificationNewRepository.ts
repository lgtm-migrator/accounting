import { VerificationRepository } from './VerificationRepository'
import { Currency } from '../core/entities/Currency'

export interface VerificationNewRepository extends VerificationRepository {
	/**
	 * Get the exchange rate from the specified currency to the local currency
	 * @param date when to lookup the currency exchange in format YYYY-MM-DD
	 * @param fromCode from which currency
	 * @param toCode to this currency
	 * @return exchangeRate on the specified date
	 * @throws {InternalError.serviceNotReachable} if the service isn't reachable
	 */
	getExchangeRate(date: string, fromCode: Currency.Code, toCode: Currency.Code): Promise<number>
}
