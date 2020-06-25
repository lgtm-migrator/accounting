import { Account } from '../core/entities/Account'
import { Currency } from '../core/entities/Currency'
import { TransactionFactory } from './TransactionFactory'
import { InternalError } from '../core/definitions/InternalError'
import { OutputError } from '../core/definitions/OutputError'
import { EntityErrors } from '../core/definitions/EntityErrors'

describe('TransactionFactory tests #cold #helper', () => {
	const LOCAL_CODE = Currency.Codes.SEK

	const BANK_ACCOUNT = new Account({
		number: 1920,
	})

	const INVOICE_IN = new Account({
		number: 2440,
	})

	const INVOICE_OUT = new Account({
		number: 1511,
	})

	const VAT_LOCAL_IN = new Account({
		number: 2640,
	})

	const VAT_LOCAL_OUT = new Account({
		number: 2611,
		vatPercentage: 0.25,
	})

	const VAT_ABROAD_IN = new Account({
		number: 2645,
	})

	const VAT_ABROAD_OUT = new Account({
		number: 2614,
		vatPercentage: 0.25,
	})

	const INCOME_LOCAL = new Account({
		number: 3001,
		vatAccount: VAT_LOCAL_OUT,
	})

	const EXPENSE_LOCAL = new Account({
		number: 5400,
		vatAccount: VAT_LOCAL_IN,
		vatPercentage: 0.25,
	})

	const EXPENSE_LOCAL_MISSING_VAT = new Account({
		number: 5401,
		vatAccount: VAT_LOCAL_IN,
	})

	const EXPENSE_ABROAD = new Account({
		number: 4661,
		vatAccount: VAT_ABROAD_IN,
		reverseVatAccount: VAT_ABROAD_OUT,
	})

	const EXPENSE_BANK = new Account({
		number: 6570,
	})

	// createTransaction()
	it('createTransaction() -> Minimal info', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			10,
			LOCAL_CODE,
			LOCAL_CODE,
			undefined,
			BANK_ACCOUNT,
			EXPENSE_BANK
		)

		let validTransactions: any[] = [
			{
				accountNumber: BANK_ACCOUNT.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: EXPENSE_BANK.number,
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
			10,
			LOCAL_CODE,
			LOCAL_CODE,
			undefined,
			BANK_ACCOUNT,
			EXPENSE_LOCAL_MISSING_VAT
		)

		let error = {
			type: OutputError.Types.invalidAccount,
			errors: [EntityErrors.accountVatPercentageNotSet, String(EXPENSE_LOCAL_MISSING_VAT.number)],
		}

		expect.assertions(1)
		await expect(transactionPromise).rejects.toEqual(error)
	})

	it('createTransaction() -> Missing exchangeRate', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			10,
			Currency.Codes.USD,
			LOCAL_CODE,
			undefined,
			BANK_ACCOUNT,
			EXPENSE_BANK
		)

		let error = {
			type: InternalError.Types.exchangeRateNotSet,
		}

		expect.assertions(1)
		await expect(transactionPromise).rejects.toMatchObject(error)
	})

	it('createTransaction() -> Local expense', async () => {
		let transactionPromise = TransactionFactory.createTransactions(
			10,
			LOCAL_CODE,
			undefined,
			undefined,
			BANK_ACCOUNT,
			EXPENSE_LOCAL
		)

		let validTransactions: any[] = [
			{
				accountNumber: BANK_ACCOUNT.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: EXPENSE_LOCAL.number,
				currency: {
					amount: 800n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: VAT_LOCAL_IN.number,
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
			10,
			LOCAL_CODE,
			LOCAL_CODE,
			undefined,
			INVOICE_IN,
			EXPENSE_ABROAD
		)

		let validTransactions: any[] = [
			{
				accountNumber: INVOICE_IN.number,
				currency: {
					amount: -1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: EXPENSE_ABROAD.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: VAT_ABROAD_IN.number,
				currency: {
					amount: 250n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: VAT_ABROAD_OUT.number,
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
			10,
			code,
			LOCAL_CODE,
			exchangeRate,
			INVOICE_IN,
			EXPENSE_ABROAD
		)

		let validTransactions: any[] = [
			{
				accountNumber: INVOICE_IN.number,
				currency: {
					amount: -1000n,
					localAmount: -10000n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
			{
				accountNumber: EXPENSE_ABROAD.number,
				currency: {
					amount: 1000n,
					localAmount: 10000n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
			{
				accountNumber: VAT_ABROAD_IN.number,
				currency: {
					amount: 250n,
					localAmount: 2500n,
					code: code,
					localCode: LOCAL_CODE,
					exchangeRate: exchangeRate,
				},
			},
			{
				accountNumber: VAT_ABROAD_OUT.number,
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
			10,
			LOCAL_CODE,
			undefined,
			undefined,
			INCOME_LOCAL,
			INVOICE_OUT
		)

		let validTransactions: any[] = [
			{
				accountNumber: INVOICE_OUT.number,
				currency: {
					amount: 1000n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: INCOME_LOCAL.number,
				currency: {
					amount: -800n,
					code: LOCAL_CODE,
				},
			},
			{
				accountNumber: VAT_LOCAL_OUT.number,
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
