import * as faker from 'faker'
import { Transaction, TransactionImpl, ACCOUNT_NUMBER_MIN, ACCOUNT_NUMBER_MAX } from './Transaction'
import { Codes } from '../definitions/Currency'
import { EntityErrors } from '../definitions/EntityErrors'
import DineroFactory, { Dinero, Currency, globalExchangeRatesApi } from 'dinero.js'

const TEST_TIMES = 1000
const CURRENCIES = Object.keys(Codes)

function faker_valid_account_number(): number {
	return faker.random.number({ min: ACCOUNT_NUMBER_MIN, max: ACCOUNT_NUMBER_MAX })
}

function faker_valid_amount(): Dinero {
	let number
	do {
		number = faker.random.number({ min: -1000, max: 1000 })
	} while (number == 0)
	return DineroFactory({ amount: number, currency: Codes.LOCAL })
}

function faker_valid_currency_amount(): Dinero {
	let currency: Currency
	do {
		const index = faker.random.number({ min: 0, max: CURRENCIES.length - 1 })
		currency = CURRENCIES[index] as Currency
	} while (currency == Codes.LOCAL)
	return DineroFactory({ amount: faker_valid_amount().getAmount(), currency: currency })
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
			if (transaction.amount.getAmount() != 0) {
				expect(transaction.validate()).toStrictEqual([])
			}
		}
	})

	// Currency
	it('Check valid currencies', () => {
		transaction.exchangeRate = faker_valid_exchange_rate()
		CURRENCIES.forEach((currencyCode) => {
			if (currencyCode != Codes.LOCAL) {
				transaction.amount = DineroFactory({ amount: 1, currency: currencyCode as Currency })
				expect(transaction.validate()).toStrictEqual([])
			}
		})
	})

	it('Currency code is local when exchange rate is set', () => {
		transaction.exchangeRate = faker_valid_exchange_rate()
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeIsLocal])
	})

	it('Check invalid currency', () => {
		transaction.exchangeRate = faker_valid_exchange_rate()
		transaction.amount = DineroFactory({ amount: 1, currency: 'INVALID' as Currency })
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeInvalid])
		transaction.amount = DineroFactory({ amount: 1, currency: 'EURT' as Currency })
		expect(transaction.validate()).toStrictEqual([EntityErrors.currencyCodeInvalid])
	})

	// Exchange rate
	it('Exchange rate not set when currency code has been set', () => {
		transaction.amount = faker_valid_currency_amount()
		expect(transaction.validate()).toStrictEqual([EntityErrors.exchangeRateNotSet])
	})

	it('Exchange rate valid', () => {
		transaction.amount = faker_valid_currency_amount()
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.exchangeRate = faker_valid_exchange_rate()
			expect(transaction.validate()).toStrictEqual([])
		}
	})

	it('Exchange value is 0', () => {
		transaction.amount = faker_valid_currency_amount()
		transaction.exchangeRate = 0
		expect(transaction.validate()).toStrictEqual([EntityErrors.exchangeRateNegativeOrZero])
	})

	it('Invalid exchange rate (is below 0)', () => {
		transaction.amount = faker_valid_currency_amount()
		for (let i = 0; i < TEST_TIMES; ++i) {
			transaction.exchangeRate = -Number.parseFloat(faker.finance.amount(0.01))
			expect(transaction.validate()).toStrictEqual([EntityErrors.exchangeRateNegativeOrZero])
		}
	})
})
