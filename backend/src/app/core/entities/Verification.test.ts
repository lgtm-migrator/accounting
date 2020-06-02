import * as faker from 'faker'
import { VerificationImpl, Verification, VerificationTypes } from './Verification'
import { Transaction } from './Transaction'
import DineroFactory from 'dinero.js'
import { EntityErrors } from '../definitions/EntityErrors'
import { Codes } from '../definitions/Currency'

DineroFactory.defaultCurrency = Codes.LOCAL

function faker_valid_date(): number {
	return faker.date.between('2010-01-01', '2020-01-01').getTime()
}

function faker_transaction(): Transaction {
	return {
		accountNumber: faker.random.number({ min: 1000, max: 2000 }),
		amount: DineroFactory({ amount: faker.random.number({ min: 1, max: 10000000 }) }),
	}
}

function faker_valid_transaction_pair(): Transaction[] {
	const transaction = faker_transaction()
	const opposite = {
		accountNumber: faker.random.number({ min: 3000, max: 4000 }),
		amount: DineroFactory({ amount: transaction.amount.multiply(-1).getAmount() }),
	}

	return [transaction, opposite]
}

describe('Verification test #cold #entity', () => {
	let verification: VerificationImpl

	beforeEach(() => {
		const validData: Verification = {
			userId: 1,
			name: 'Test',
			date: '2020-01-15',
			type: VerificationTypes.TRANSACTION,
			transactions: faker_valid_transaction_pair(),
		}
		verification = new VerificationImpl(validData)
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

	it('Date filed but missing creation date', () => {
		verification.dateFiled = faker_valid_date()
		verification.number = 1
		expect(verification.validate()).toStrictEqual([EntityErrors.dateCreatedMissing])
	})

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

	// Total amount (local)
	it('Total local amount does not exist in any transaction', () => {
		const amount = faker.random.number({ min: 10000001, max: 90000000 })
		verification.totalAmountLocal = DineroFactory({ amount: amount })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationLocalAmountDoesNotMatchAnyTransaction])
	})

	// Total amount (original)
	it('Total original amount does not exist in any transaction (different amounts)', () => {
		const amount = verification.transactions[0].amount.getAmount() + 1
		verification.totalAmountOriginal = DineroFactory({ amount: amount })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationOriginalAmountDoesNotMatchAnyTransaction])
	})

	it('Total amount does not exist in any transaction (currency code)', () => {
		const amount = verification.transactions[0].amount.getAmount()
		const currency = verification.transactions[0].amount.getCurrency()
		verification.totalAmountOriginal = DineroFactory({ amount: amount, currency: 'USD' })
		expect(verification.validate()).toStrictEqual([EntityErrors.verificationOriginalAmountHaveDifferentCurrency])
	})

	// Transaction sum
	it('Transaction sum is not zero', () => {})
})
