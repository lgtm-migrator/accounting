import { VerificationNewBaseRepository as VerificationNewRepositoryBase } from '../VerificationNewBaseRepository'
import { Account } from '../../core/entities/Account'

export interface VerificationNewRepository extends VerificationNewRepositoryBase {
	/**
	 * Get account details
	 * @param accountNumber the account number to get the details from
	 * @return A promise with all the account details
	 * @throws {InternalError.accountNumberNotFound} if the account number does not exist
	 * @throws {InternalError.InternalError} if something unknown went wrong
	 */
	getAccountDetails(accountNumber: number): Promise<Account>
}
