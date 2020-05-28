import * as faker from 'faker'
import { Transaction, TransactionImpl, ACCOUNT_NUMBER_MIN, ACCOUNT_NUMBER_MAX } from './Transaction'
import { Currency, CurrencyCodes } from '../definitions/Currency'
import { EntityErrors } from '../definitions/EntityErrors'

const TEST_TIMES = 1000
const CURRENCIES = Object.keys(CurrencyCodes)

function faker_valid_account_number(): number {
	return faker.random.number({ min: ACCOUNT_NUMBER_MIN, max: ACCOUNT_NUMBER_MAX })
}

function faker_valid_amount(): number {
	let number: number
	do {
		number = Number.parseFloat(faker.finance.amount(-1000))
	} while (number == 0)
	return number
}

function faker_valid_currency(): string {
	const index = faker.random.number({ min: 0, max: CURRENCIES.length - 1 })
	return CURRENCIES[index]
}

function faker_valid_exchange_rate(): number {
	return Number.parseFloat(faker.finance.amount(0.01))
}

describe('Validate a transaction #cold #entity', () => {
	let transaction: TransactionImpl

	beforeEach(() => {
		const data: Transaction = {
			accountNumber: faker_valid_account_number(),
			amount: faker_valid_amount(),
		}
		transaction = new TransactionImpl(data)
	})

	// Account number
	it('Minimal valid transaction', () => {
		expect(transaction.validate()).toStrictEqual([])
	})

	it('Account number fails if negative', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.accountNumber = faker.random.number({ min: Number.MIN_SAFE_INTEGER, max: ACCOUNT_NUMBER_MIN - 1 })
			expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberOutOfRange])
		}
	})

	it('Account number fails if too large', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.accountNumber = faker.random.number({ min: ACCOUNT_NUMBER_MAX + 1, max: Number.MAX_SAFE_INTEGER })
			expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberOutOfRange])
		}
	})

	it('Account number is invalid format (floating point)', () => {
		transaction.accountNumber = 1500.8
		expect(transaction.validate()).toStrictEqual([EntityErrors.accountNumberInvalidFormat])
	})

	// Original Amount
	it('Valid original amount', () => {
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.amount = faker_valid_amount()
			if (transaction.amount != 0) {
				expect(transaction.validate()).toStrictEqual([])
			}
		}
	})

	// Currency
	it('Check valid currencies', () => {
		transaction.exchangeRate = faker_valid_exchange_rate()
		CURRENCIES.forEach((currencyCode) => {
			transaction.currencyCode = currencyCode
			expect(transaction.validate()).toStrictEqual([])
		})
	})

	it('Check invalid currency', () => {
		transaction.exchangeRate = faker_valid_exchange_rate()
		transaction.currencyCode = '12'
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeInvalid])

		transaction.currencyCode = 'EUTR'
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeInvalid])
	})

	it('Currency code not set when exchange rate is set', () => {
		transaction.exchangeRate = faker_valid_exchange_rate()
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeNotSet])

		transaction.currencyCode = ''
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeNotSet])
	})

	// Exchange rate
	it('Exchange rate not set when currency code has been set', () => {
		transaction.currencyCode = faker_valid_currency()
		expect(transaction.validate()).toStrictEqual([EntityErrors.exchangeRateNotSet])
	})

	it('Exchange rate valid', () => {
		transaction.currencyCode = faker_valid_currency()
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.exchangeRate = faker_valid_exchange_rate()
			expect(transaction.validate()).toStrictEqual([])
		}
	})

	it('Exchange value is 0', () => {
		transaction.currencyCode = faker_valid_currency()
		transaction.exchangeRate = 0
		expect(transaction.validate()).toStrictEqual([EntityErrors.exchangeRateNegativeOrZero])
	})

	it('Invalid exchange rate (is below 0)', () => {
		transaction.currencyCode = faker_valid_currency()
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.exchangeRate = -Number.parseFloat(faker.finance.amount(0.01))
			expect(transaction.validate()).toStrictEqual([EntityErrors.exchangeRateNegativeOrZero])
		}
	})
})
