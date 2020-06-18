import * as faker from 'faker'
import { Verification } from './Verification'
import { Transaction } from './Transaction'
import { EntityErrors } from '../definitions/EntityErrors'
import { Currency } from '../definitions/Currency'

function faker_valid_date(): number {
	return faker.date.between('2010-01-01', '2020-01-01').getTime()
}

function faker_transaction(): Transaction.Option {
	return {
		accountNumber: faker.random.number({ min: 1000, max: 2000 }),
		currency: new Currency({
			amount: BigInt(faker.random.number({ min: 1, max: 10000000 })),
			code: 'SEK',
		}),
	}
}

function faker_valid_transaction_pair(): Transaction.Option[] {
	const transaction = faker_transaction()
	const opposite: Transaction.Option = {
		accountNumber: faker.random.number({ min: 3000, max: 4000 }),
		currency: transaction.currency.negate(),
	}

	return [transaction, opposite]
}

describe('Verification test #cold #entity', () => {
	let verification: Verification

	beforeEach(() => {
		const validData: Verification.Option = {
			userId: 1,
			name: 'Test',
			date: '2020-01-15',
			type: Verification.Types.TRANSACTION,
			transactions: faker_valid_transaction_pair(),
		}
		verification = new Verification(validData)
	})

	// Minimum valid
	it('Minimum valid verification', () => {
		expect(verification.validate()).toStrictEqual([])
	})

	// User ID
	it('Invalid user id', () => {
		verification.userId = ''
		expect(verification.validate()).toStrictEqual([EntityErrors.userIdIsEmpty])
	})

	// Verification number
	it('Invalid verification number (less than 1)', () => {
		verification.dateCreated = faker_valid_date()
		verification.dateFiled = verification.dateCreated

		verification.number = 0
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationNumberInvalid])
		verification.number = faker.random.number({ min: -99999, max: 0 })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationNumberInvalid])
	})

	it('Verification number set, but missing date filed', () => {
		verification.number = 1
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateFiledMissing])
	})

	// Date Filed
	it('Date filed but missing verification number', () => {
		verification.dateCreated = faker_valid_date()
		verification.dateFiled = verification.dateCreated
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationNumberMissing])
	})

	// it('Date filed but missing creation date', () => {
	// 	verification.dateFiled = faker_valid_date()
	// 	verification.number = 1
	// 	expect(verification.validate()).toStrictEqual([EntityErrors.dateCreatedMissing])
	// })

	it('Date filed before creation date', () => {
		verification.number = 1
		verification.dateFiled = faker.date.between('2010-01-01', '2014-12-31').getTime()
		verification.dateCreated = faker.date.between('2015-01-01', '2019-12-31').getTime()
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateFiledBeforeCreated])
	})

	// Date
	it('Valid date formats', () => {
		verification.date = '2020-06-01'
		expect(verification.validate()).toStrictEqual([])
		verification.date = '2020-02-29'
		expect(verification.validate()).toStrictEqual([])
	})

	it('Invalid date formats', () => {
		verification.date = ''
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
		verification.date = '20'
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
		verification.date = '2019-13-01'
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
		verification.date = '2019-02-29'
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationDateInvalidFormat])
	})

	// Total amount
	it('Total original amount does not exist in any transaction (different amounts)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount + 1n, code: currency.code })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationAmountDoesNotMatchAnyTransaction])
	})

	it('Total amount does not exist in any transaction (currency code)', () => {
		const currency = verification.transactions[0].currency
		verification.totalAmount = new Currency({ amount: currency.amount, code: Currency.Codes.BBD })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationAmountDoesNotMatchAnyTransaction])
	})

	// Transaction sum
	it('Transaction sum is not zero', () => {
		verification.transactions.push(
			new Transaction({
				accountNumber: 2666,
				currency: new Currency({
					amount: 1n,
					code: 'SEK',
				}),
			})
		)

		expect(verification.validate()).toStrictEqual([EntityErrors.transactionSumIsNotZero])
	})

	// Missing transactions
	it('Missing transactions', () => {
		verification.transactions = []
		expect(verification.validate()).toStrictEqual([EntityErrors.transactionsMissing])
	})

	// Mismatch local code for transactions
	it('Transaction local code mismatch', () => {
		const firstTransaction = new Transaction({
			accountNumber: 3000,
			currency: new Currency({
				amount: 10n,
				code: 'SEK',
			}),
		})

		// Should never report sum doesn't equal 0, because we can't check the sum...
		verification.transactions = [
			firstTransaction,
			new Transaction({
				accountNumber: 6000,
				currency: new Currency({
					amount: -1n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				}),
			}),
			new Transaction({
				accountNumber: 5000,
				currency: new Currency({
					amount: 50n,
					code: 'EUR',
					localCode: 'USD',
					exchangeRate: 5,
				}),
			}),
		]

		verification.totalAmount = firstTransaction.currency

		expect(verification.validate()).toStrictEqual([EntityErrors.transactionsCurrencyCodeLocalMismatch])
	})
})
