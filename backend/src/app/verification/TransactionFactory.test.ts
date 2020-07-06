import { Account } from '../core/entities/Account'
import { Currency } from '../core/entities/Currency'
import { TransactionFactory } from './TransactionFactory'
import { InternalError } from '../core/definitions/InternalError'
import { OutputError } from '../core/definitions/OutputError'
import { EntityErrors } from '../core/definitions/EntityErrors'
import { Accounts } from '../../jest/AccountTestData'

describe('TransactionFactory tests #cold #helper', () => {
	const LOCAL_CODE = Currency.Codes.SEK

	// createTransaction()
	it('createTransaction() -> Minimal info', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			LOCAL_CODE,
			LOCAL_CODE,
			undefined,
			Accounts.BANK_ACCOUNT,
			Accounts.EXPENSE_BANK
		)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.BANK_ACCOUNT.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_BANK.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(2)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Missing VAT for account', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			LOCAL_CODE,
			LOCAL_CODE,
			undefined,
			Accounts.BANK_ACCOUNT,
			Accounts.EXPENSE_LOCAL_MISSING_VAT
		)

		let error = {
			type: OutputError.Types.invalidAccount,
			errors: [EntityErrors.accountVatPercentageNotSet, String(Accounts.EXPENSE_LOCAL_MISSING_VAT.number)],
		}

		expect.assertions(1)
		await expect(transactionPromise).rejects.toEqual(error)
	})

	it('createTransaction() -> Missing exchangeRate', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			Currency.Codes.USD,
			LOCAL_CODE,
			undefined,
			Accounts.BANK_ACCOUNT,
			Accounts.EXPENSE_BANK
		)

		let error = {
			type: InternalError.Types.exchangeRateNotSet,
		}

		expect.assertions(1)
		await expect(transactionPromise).rejects.toMatchObject(error)
	})

	it('createTransaction() -> Local expense', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			LOCAL_CODE,
			undefined,
			undefined,
			Accounts.BANK_ACCOUNT,
			Accounts.EXPENSE_LOCAL
		)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.BANK_ACCOUNT.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_LOCAL.number,
				currency: {
					amount: 800n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_LOCAL_IN.number,
				currency: {
					amount: 200n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(3)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Abroad expense (with local code)', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			LOCAL_CODE,
			LOCAL_CODE,
			undefined,
			Accounts.INVOICE_IN,
			Accounts.EXPENSE_ABROAD
		)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.INVOICE_IN.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_ABROAD.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_IN.number,
				currency: {
					amount: 250n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_OUT.number,
				currency: {
					amount: -250n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(4)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Abroad expense (with exchangeRate)', async () => {
		const code = Currency.Codes.USD
		const exchangeRate = 10
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			code,
			LOCAL_CODE,
			exchangeRate,
			Accounts.INVOICE_IN,
			Accounts.EXPENSE_ABROAD
		)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.INVOICE_IN.number,
				currency: {
					amount: -1000n,
					localAmount: -10000n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
			{
				accountNumber: Accounts.EXPENSE_ABROAD.number,
				currency: {
					amount: 1000n,
					localAmount: 10000n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_IN.number,
				currency: {
					amount: 250n,
					localAmount: 2500n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
			{
				accountNumber: Accounts.VAT_ABROAD_OUT.number,
				currency: {
					amount: -250n,
					localAmount: -2500n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
		]

		expect.assertions(4)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})

	it('createTransaction() -> Local income', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			1,
			10,
			LOCAL_CODE,
			undefined,
			undefined,
			Accounts.INCOME_LOCAL,
			Accounts.INVOICE_OUT
		)

		let validTransactions: any[] = [
			{
				accountNumber: Accounts.INVOICE_OUT.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.INCOME_LOCAL.number,
				currency: {
					amount: -800n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: Accounts.VAT_LOCAL_OUT.number,
				currency: {
					amount: -200n,
					code: LOCAL_CODE,
				},
			},
		]

		expect.assertions(3)
		for (let valid of validTransactions) {
			await expect(transactionPromise).resolves.toContainEqual(expect.objectContaining(valid))
		}
	})
})
