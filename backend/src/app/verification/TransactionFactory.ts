import { Currency } from '../core/entities/Currency'
import { Account } from '../core/entities/Account'
import { Transaction } from '../core/entities/Transaction'
import { OutputError } from '../core/definitions/OutputError'
import { EntityErrors } from '../core/definitions/EntityErrors'
import { InternalError } from '../core/definitions/InternalError'
import { type } from 'os'

type CurrencyOrUndefined = Currency | undefined
type TransactionOrUndefined = Transaction | undefined

export class TransactionFactory {
	/**
	 * Create transactions from the
	 * @param amount how much was transfered (payed/invoice)
	 * @param code the currency code of the amount
	 * @param localCode the local currency code
	 * @param exchangeRate the exchange rate from code to localCode.
	 * If code and localCode are the same then exchangeRate is set to undefined
	 * @param accountFrom account details of the from account (-amount from this account)
	 * @param accountTo account details of the to account ()
	 * @return created transactions from the specified input
	 * @throws {InternalError.Types.exchangeRateNotSet} if exchangeRate isn't set when code and localCode differs
	 * @throws {OutputError.Types.invalidAccount} if the VAT percentage is missing and VAT account has been set
	 */
	static async createTransactions(
		amount: number,
		code: Currency.Code,
		localCode: Currency.Code | undefined,
		exchangeRate: number | undefined,
		accountFrom: Account,
		accountTo: Account
	): Promise<Transaction[]> {
		let exchangeRatePromise: Promise<number | undefined> = Promise.resolve(undefined)

		if (localCode !== undefined && code !== localCode && exchangeRate === undefined) {
			throw new InternalError(InternalError.Types.exchangeRateNotSet)
		}

		// Unset local code if code and local code is same
		if (code === localCode) {
			localCode = undefined
		}

		// Default (full) currency
		let currencyFull: Currency = new Currency({
			amount: amount,
			code: code,
			localCode: localCode,
			exchangeRate: exchangeRate,
		})

		// Create the actual transactions for the accounts
		let transactionsCombined = TransactionFactory.calculateTransactions(accountFrom, 'from', currencyFull)
		transactionsCombined = transactionsCombined.concat(
			TransactionFactory.calculateTransactions(accountTo, 'to', currencyFull)
		)

		const transactions: Transaction[] = []

		// Only add valid transactions
		for (let transaction of transactionsCombined) {
			if (transaction instanceof Transaction) {
				transactions.push(transaction)
			}
		}

		return Promise.resolve(transactions)
	}

	/**
	 * Calculate transactions (including VAT) for an account
	 * @param account the account to or from
	 * @param toOrFrom whether the account is to or from
	 * @param currencyFull the full currency
	 * @return [transaction, transactionVat, transactionReverseVat]. transactionVat and transactionReverseVat can be undefined
	 */
	private static calculateTransactions(
		account: Account,
		toOrFrom: 'to' | 'from',
		currencyFull: Currency
	): TransactionOrUndefined[] {
		let currency: CurrencyOrUndefined
		let vatCurrency: CurrencyOrUndefined
		let vatAccount: Account | undefined
		let reverseVatCurrency: CurrencyOrUndefined
		let reverseVatAccount: Account | undefined

		let vatPercentage = TransactionFactory.getVatPercentage(account)

		if (account.vatAccount instanceof Account) {
			vatAccount = account.vatAccount

			if (vatPercentage === undefined) {
				const errors = [EntityErrors.accountVatPercentageNotSet, String(account.number)]
				throw new OutputError(OutputError.Types.invalidAccount, errors)
			}

			// Reverse VAT
			if (account.reverseVatAccount instanceof Account) {
				reverseVatAccount = account.reverseVatAccount
				vatCurrency = currencyFull.multiply(vatPercentage)
				reverseVatCurrency = vatCurrency.negate()
			}
			// Regular VAT
			else {
				// Since we already have the full amount we don't want to add VAT to the amount
				// but instead deduct from the amount
				// For example 0.25 in VAT =>
				// 0.8 = 1 / (0.25 + 1)
				// 0.2 = 1 - 0.8
				const rest = 1 / (vatPercentage + 1)
				vatPercentage = 1.0 - rest
				;[currency, vatCurrency] = currencyFull.split([rest, vatPercentage])
			}
		}
		if (!currency) {
			currency = currencyFull
		}

		// Negate if it's fro
		if (toOrFrom == 'from') {
			currency = currency.negate()

			if (vatCurrency) {
				vatCurrency = vatCurrency.negate()
			}
			if (reverseVatCurrency) {
				reverseVatCurrency = reverseVatCurrency.negate()
			}
		}

		let transaction = new Transaction({
			accountNumber: account.number,
			currency: currency,
		})

		let vatTransaction: TransactionOrUndefined
		if (vatCurrency && vatAccount) {
			vatTransaction = new Transaction({
				accountNumber: vatAccount.number,
				currency: vatCurrency,
			})
		}

		let reverseVatTransaction: TransactionOrUndefined
		if (reverseVatCurrency && reverseVatAccount) {
			reverseVatTransaction = new Transaction({
				accountNumber: reverseVatAccount.number,
				currency: reverseVatCurrency,
			})
		}

		return [transaction, vatTransaction, reverseVatTransaction]
	}

	/**
	 * Search the account and get the VAT percentage in itself or one of it's children
	 * @param account the account to get the vat percentage from
	 * @return the VAT percentage or undefined if not found
	 */
	private static getVatPercentage(account: Account): number | undefined {
		if (typeof account.vatPercentage !== 'undefined') {
			return account.vatPercentage
		}
		if (account.vatAccount instanceof Account) {
			if (typeof account.vatAccount.vatPercentage !== 'undefined') {
				return account.vatAccount.vatPercentage
			}
		}
		if (account.reverseVatAccount instanceof Account) {
			if (typeof account.reverseVatAccount.vatPercentage !== 'undefined') {
				return account.reverseVatAccount.vatPercentage
			}
		}

		return undefined
	}
}
