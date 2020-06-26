import { Account } from '../app/core/entities/Account'
import { InternalError } from '../app/core/definitions/InternalError'

export class Accounts {
	static readonly BANK_ACCOUNT = new Account({
		number: 1920,
	})

	static readonly INVOICE_IN = new Account({
		number: 2440,
	})

	static readonly INVOICE_OUT = new Account({
		number: 1511,
	})

	static readonly VAT_LOCAL_IN = new Account({
		number: 2640,
	})

	static readonly VAT_LOCAL_OUT = new Account({
		number: 2611,
		vatPercentage: 0.25,
	})

	static readonly VAT_ABROAD_IN = new Account({
		number: 2645,
	})

	static readonly VAT_ABROAD_OUT = new Account({
		number: 2614,
		vatPercentage: 0.25,
	})

	static readonly INCOME_LOCAL = new Account({
		number: 3001,
		vatAccount: Accounts.VAT_LOCAL_OUT,
	})

	static readonly EXPENSE_LOCAL = new Account({
		number: 5400,
		vatAccount: Accounts.VAT_LOCAL_IN,
		vatPercentage: 0.25,
	})

	static readonly EXPENSE_LOCAL_MISSING_VAT = new Account({
		number: 5401,
		vatAccount: Accounts.VAT_LOCAL_IN,
	})

	static readonly EXPENSE_ABROAD = new Account({
		number: 4661,
		vatAccount: Accounts.VAT_ABROAD_IN,
		reverseVatAccount: Accounts.VAT_ABROAD_OUT,
	})

	static readonly EXPENSE_BANK = new Account({
		number: 6570,
	})

	/**
	 * Find the account with this account number in {Accounts}
	 * @param accountNumber the account number to find the account for
	 * @return account for this account number
	 * @throws {InternalError.Types.accountNumberNotFound} if no account with the specified number was found
	 */
	static findByNumber(accountNumber: number): Account {
		for (const value of Object.values(Accounts)) {
			if (value instanceof Account) {
				if (value.number == accountNumber) {
					return value
				}
			}
		}
		throw new InternalError(InternalError.Types.accountNumberNotFound)
	}
}
