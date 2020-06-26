import { VerificationNewRepository } from '../app/verification/new/VerificationNewRepository'
import { VerificationNewCustomTransactionRepository } from '../app/verification/new-custom-transaction/VerificationNewCustomTransactionRepository'
import { Currency } from '../app/core/entities/Currency'
import { Account } from '../app/core/entities/Account'
import { Accounts } from './AccountTestData'
import { Id } from '../app/core/definitions/Id'

export class VerificationRepositoryTest
	implements VerificationNewRepository, VerificationNewCustomTransactionRepository {
	static readonly LOCAL_CODE = Currency.Codes.SEK
	static readonly EXCHANGE_RATE = 10

	getAccountDetails(accountNumber: number): Promise<Account> {
		return new Promise((resolve) => {
			const foundNumber = Accounts.findByNumber(accountNumber)
			resolve(foundNumber)
		})
	}

	/**
	 * @return by default return 10
	 */
	getExchangeRate(date: string, fromCode: Currency.Code, toCode: Currency.Code): Promise<number> {
		return Promise.resolve(VerificationRepositoryTest.EXCHANGE_RATE)
	}

	/**
	 * @return SEK by default
	 */
	getLocalCurrency(userId: Id): Promise<Currency.Code> {
		return Promise.resolve(VerificationRepositoryTest.LOCAL_CODE)
	}
}
