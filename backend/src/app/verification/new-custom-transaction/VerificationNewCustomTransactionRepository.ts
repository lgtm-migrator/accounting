import { Id } from '../../core/definitions/Id'
import { Repository } from '../../core/definitions/Repository'
import { Currency } from '../../core/definitions/Currency'

export interface VerificationNewCustomTransactionRepository extends Repository {
	/**
	 * Get the exchange rate from the specified currency to the local currency
	 * @param date when to lookup the currency exchange in format YYYY-MM-DD
	 * @param fromCode from which currency
	 * @param toCode to this currency
	 * @return exchangeRate on the specified date
	 */
	getExchangeRate(date: string, fromCode: Currency.Code, toCode: Currency.Code): number

	/**
	 * Get the local currency for the specified user
	 * @param userId the user to get the local currency code from
	 * @return local currency code
	 */
	getLocalCurrency(userId: Id): Currency.Code
}
