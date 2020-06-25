import { InternalError } from '../definitions/InternalError'
import { EntityErrors } from '../definitions/EntityErrors'
import { isUndefined } from 'util'

/**
 * Holds the currency amount, code, and also an optional exchange rate with a local code.
 * If no local code is initialized it
 */
export class Currency {
	readonly amount: bigint
	readonly code!: Currency.Code
	readonly localAmount?: bigint
	readonly localCode?: Currency.Code
	readonly exchangeRate?: number

	/**
	 * @param options currency data
	 * @throws {InternalError} if the input data (options) isn't valid
	 */
	constructor(options: Currency.Option) {
		const errors: EntityErrors[] = []

		if (typeof options.code === 'string') {
			let foundCode = Currency.Codes.fromString(options.code)
			if (foundCode) {
				this.code = foundCode
			} else {
				errors.push(EntityErrors.currencyCodeInvalid)
			}
		} else {
			this.code = options.code
		}

		if (typeof options.exchangeRate !== 'undefined') {
			this.exchangeRate = options.exchangeRate
		}

		if (typeof options.localCode !== 'undefined') {
			if (typeof options.localCode === 'string') {
				let foundCode = Currency.Codes.fromString(options.localCode)
				if (foundCode) {
					this.localCode = foundCode
				} else {
					errors.push(EntityErrors.currencyCodeLocalInvalid)
				}
			} else {
				this.localCode = options.localCode
			}
		}

		this.validate(errors)

		if (errors.length > 0) {
			throw new InternalError(InternalError.Types.invalidEntityState, errors)
		}

		// Use amount directly
		if (typeof options.amount === 'bigint') {
			this.amount = options.amount
		}
		// Convert from number to bigint
		else {
			this.amount = Currency.numberToBigInt(options.amount, this.code.precision)
		}

		// Set local amount
		if (typeof options.localAmount !== 'undefined') {
			this.localAmount = options.localAmount
		} else if (typeof options.localCode !== 'undefined') {
			this.localAmount = this.calculateLocalAmount()
		}
	}

	private validate(errors: EntityErrors[]) {
		// Exchange rate
		if (typeof this.exchangeRate !== 'undefined') {
			// Requires local code
			if (typeof this.localCode === 'undefined') {
				// Only add error message if there isn't one for invalid local code
				if (!errors.includes(EntityErrors.currencyCodeLocalInvalid)) {
					errors.push(EntityErrors.currencyCodeLocalNotSet)
				}
			}

			// Not 0 or below
			if (this.exchangeRate <= 0) {
				errors.push(EntityErrors.exchangeRateNegativeOrZero)
			}
		}

		// Local
		if (typeof this.localCode !== 'undefined') {
			// Requires exchange rate
			if (typeof this.exchangeRate === 'undefined') {
				errors.push(EntityErrors.exchangeRateNotSet)
			}

			// Can't be same code as this.code
			if (this.code == this.localCode) {
				errors.push(EntityErrors.currencyCodesAreSame)
			}
		}
	}

	private static numberToBigInt(value: number, precision: number): bigint {
		let negate = false
		if (value < 0) {
			negate = true
			value *= -1
		}

		let out: bigint = BigInt(Math.round(value * 10 ** precision))

		// Calculate rest value so we round of correctly
		const rest: bigint = BigInt(Math.round(value * 10 ** (precision + 1))) % 10n

		if (negate) {
			out *= -1n
		}

		return out
	}

	private isLocalAmountSet(): boolean {
		return typeof this.localAmount !== 'undefined'
	}

	/**
	 * Create a new currency by multiplying with this currency. Will multiply against both the amount and
	 * local amount if it's available
	 * @param multiplier how much to multiply the value with
	 * @return new currency that has been multiplied with multiplier
	 * @see split() if you want to split the currency into parts (for example VAT and cost)
	 */
	multiply(multiplier: number): Currency {
		const precision = Currency.calculatePrecision(multiplier)
		const multiplierInt = BigInt(multiplier * 10 ** Number(precision))

		let amount = this.amount * multiplierInt
		let localAmount: bigint | undefined
		if (typeof this.localAmount !== 'undefined') {
			localAmount = this.localAmount * multiplierInt
		}

		// Divide
		amount = Currency.divideByPrecision(amount, precision)
		if (localAmount !== undefined) {
			localAmount = Currency.divideByPrecision(localAmount, precision)
		}

		const currency = new Currency({
			amount: amount,
			localAmount: localAmount,
			code: this.code,
			localCode: this.localCode,
			exchangeRate: this.exchangeRate,
		})
		return currency
	}

	/**
	 * Divide and round the value depending on it's precision
	 * @param value the value to divide and round up or down
	 * @param precision the precision of the value (divides by 10 ** precision)
	 * @return divided and rounded value
	 */
	private static divideByPrecision(value: bigint, precision: bigint): bigint {
		if (precision >= 2n) {
			value /= 10n ** (precision - 1n)
		}

		if (precision >= 1n) {
			const remainder = value % 10n
			value /= 10n
			if (remainder >= 5n) {
				value += 1n
			} else if (remainder <= -5n) {
				value -= 1n
			}
		}

		return value
	}

	/**
	 * Split the currency into parts. If you were to add these together the result would
	 * always be this currency. Note that this splits the amount from the localAmount and not amount.
	 * Any remaining amount will be added to the first fraction.
	 * @param fractions list of parts to split it into. Needs at least 2 elements.
	 * If fractions doesn't add upp to 1 any remaining amount will be added to the first fraction.
	 * @return parts of the currency where localAmount has been set manually
	 * @see multiply() if you want to create a new currency by multiplying this
	 * @throws {InternalError.tooFewElements} if too few elements were supplied
	 */
	split(fractions: number[]): Currency[] {
		if (fractions.length < 2) {
			throw new InternalError(InternalError.Types.tooFewElements)
		}

		let maxFractionPrecision = 1n
		for (let fraction of fractions) {
			const fractionPrecision = Currency.calculatePrecision(fraction)

			if (fractionPrecision > maxFractionPrecision) {
				maxFractionPrecision = fractionPrecision
			}
		}
		const maxFractionPrecisionMulti = 10n ** maxFractionPrecision

		let localAmount: bigint = 0n
		if (this.isLocalAmountSet()) {
			localAmount = this.localAmount!
		}
		let localAmountLeft = localAmount * maxFractionPrecisionMulti

		const amount = this.amount
		let amountLeft = amount * maxFractionPrecisionMulti

		const amounts: bigint[] = []
		const localAmounts: bigint[] = []
		for (let fraction of fractions) {
			const fractionInt = BigInt(fraction * Number(maxFractionPrecisionMulti))

			if (this.isLocalAmountSet()) {
				const fractionLocalAmount = localAmount * fractionInt
				localAmountLeft -= fractionLocalAmount
				localAmounts.push(fractionLocalAmount)
			}

			const fractionAmount = amount * fractionInt
			amountLeft -= fractionAmount
			amounts.push(fractionAmount)
		}

		if (this.isLocalAmountSet() && localAmountLeft != 0n) {
			localAmounts[0] += localAmountLeft
		}

		if (amountLeft != 0n) {
			amounts[0] += amountLeft
		}

		// Create Currencies
		const currencies: Currency[] = []
		for (let i = 0; i < amounts.length; ++i) {
			// Local amount
			let fractionLocalAmount: bigint | undefined
			if (this.isLocalAmountSet()) {
				fractionLocalAmount = localAmounts[i]
				fractionLocalAmount = Currency.divideByPrecision(fractionLocalAmount, maxFractionPrecision)
			}

			// Amount
			let fractionAmount = amounts[i]
			fractionAmount = Currency.divideByPrecision(fractionAmount, maxFractionPrecision)

			currencies.push(
				new Currency({
					amount: fractionAmount,
					localAmount: fractionLocalAmount,
					code: this.code,
					localCode: this.localCode,
					exchangeRate: this.exchangeRate,
				})
			)
		}

		return currencies
	}

	/**
	 * @return true if the amount is 0
	 */
	isZero(): boolean {
		return this.amount == 0n
	}

	/**
	 * @return true if amount is less than 0
	 */
	isNegative(): boolean {
		return this.amount < 0n
	}

	/**
	 * @return true if amount is larger than 0
	 */
	isPositive(): boolean {
		return this.amount > 0n
	}

	/**
	 * Checks if the amounts are equal if they can be compared in the same currency.
	 * @param other the other currency to compare with this one
	 * @return true if the other currency has the same amount value as this
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isEqualTo(other: Currency): boolean {
		// Short circuit if they are the same object
		if (other === this) {
			return true
		}

		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] == comparableResults[1]
	}

	/**
	 * Checks if this amount is smaller than other's amount if they can be compared in the same currency.
	 * By smaller we mean closer to 0.
	 * @return true if this amount is smaller than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false
	 * @example new Currency({amount: 10, code: 'USD'}).isSmallerThan(new Currency({amount: 5, code: 'USD'})) => false
	 * @example new Currency({amount: -10, code: 'USD'}).isSmallerThan(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: 5, code: 'USD'}).isSmallerThan(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: -5, code: 'USD'}).isSmallerThan(new Currency({amount: 10, code: 'USD'})) => true
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isSmallerThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)

		// Make comparables positive
		if (comparableResults[0] < 0) {
			comparableResults[0] *= -1n
		}
		if (comparableResults[1] < 0) {
			comparableResults[1] *= -1n
		}

		return comparableResults[0] < comparableResults[1]
	}

	/**
	 * Checks if this amount is smaller than or equal to other's amount if they can be compared in the same currency.
	 * By smaller we mean closer to 0.
	 * @return true if this amount is smaller than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @example new Currency({amount: 10, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: 5, code: 'USD'})) => false
	 * @example new Currency({amount: -10, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: 5, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: -5, code: 'USD'}).isSmallerThanEqualTo(new Currency({amount: 10, code: 'USD'})) => true
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isSmallerThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)

		// Make comparables positive
		if (comparableResults[0] < 0) {
			comparableResults[0] *= -1n
		}
		if (comparableResults[1] < 0) {
			comparableResults[1] *= -1n
		}

		return comparableResults[0] <= comparableResults[1]
	}

	/**
	 * Checks if this amount is larger than other's amount if they can be compared in the same currency.
	 * By larger we mean farther away from 0.
	 * @return true if this amount is larger than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @example new Currency({amount: 10, code: 'USD'}).isLargerThan(new Currency({amount: 5, code: 'USD'})) => true
	 * @example new Currency({amount: -10, code: 'USD'}).isLargerThan(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: 5, code: 'USD'}).isLargerThan(new Currency({amount: -5, code: 'USD'})) => false
	 * @example new Currency({amount: -5, code: 'USD'}).isLargerThan(new Currency({amount: 10, code: 'USD'})) => false
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isLargerThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)

		// Make comparables positive
		if (comparableResults[0] < 0) {
			comparableResults[0] *= -1n
		}
		if (comparableResults[1] < 0) {
			comparableResults[1] *= -1n
		}

		return comparableResults[0] > comparableResults[1]
	}

	/**
	 * Checks if this amount is larger than or equal to other's amount if they can be compared in the same currency.
	 * By larger we mean farther away from 0.
	 * @return true if this amount is larger than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @example new Currency({amount: 10, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: 5, code: 'USD'})) => true
	 * @example new Currency({amount: -10, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: 5, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: -5, code: 'USD'})) => true
	 * @example new Currency({amount: -5, code: 'USD'}).isLargerThanEqualTo(new Currency({amount: 10, code: 'USD'})) => false
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isLargerThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)

		// Make comparables positive
		if (comparableResults[0] < 0) {
			comparableResults[0] *= -1n
		}
		if (comparableResults[1] < 0) {
			comparableResults[1] *= -1n
		}

		return comparableResults[0] >= comparableResults[1]
	}

	/**
	 * Checks if this amount is less than other's amount if they can be compared in the same currency.
	 * @return true if this amount is less than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isLessThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] < comparableResults[1]
	}

	/**
	 * Checks if this amount is less than or equal to other's amount if they can be compared in the same currency.
	 * @return true if this amount is less than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isLessThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] <= comparableResults[1]
	}

	/**
	 * Checks if this amount is greater than other's amount if they can be compared in the same currency.
	 * @return true if this amount is greater than the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isGreaterThan(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] > comparableResults[1]
	}

	/**
	 * Checks if this amount is greater than or equal to other's amount if they can be compared in the same currency.
	 * @return true if this amount is greater than or equal to the other's amount (compared in the same currency)
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if {isComparableTo() returns false}
	 * @see isComparableTo() to check beforehand if they are comparable
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	isGreaterThanEqualTo(other: Currency): boolean {
		const comparableResults = this.getComparableResults(other)
		return comparableResults[0] >= comparableResults[1]
	}

	/**
	 * Calculate comparable results depending on which codes this vs the other currency has.
	 * @param other the other currency to compare with this one
	 * @return two amounts in the same currency code that can be compared
	 * @throws {InternalError} with the {EntityError.currenciesNotComparable} if they have totally different
	 * currency codes. As long as two of the codes (doesn't matter if its code or localCode) are equal
	 * they can be compared
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 */
	private getComparableResults(other: Currency): bigint[] {
		if (!this.isComparableTo(other)) {
			throw new InternalError(InternalError.Types.comparableError, [EntityErrors.currenciesNotComparable])
		}

		let first: Currency = this
		let second: Currency = other

		if (this.localCode == other.localCode) {
			first = this.getLocalCurrency()
			second = other.getLocalCurrency()
		} else if (this.code == other.localCode) {
			first = this
			second = other.getLocalCurrency()
		} else if (this.localCode == other.code) {
			first = this.getLocalCurrency()
			second = other
		}

		return [first.amount, second.amount]
	}

	/**
	 * Checks if the two currencies are comparable
	 * @param other the other to check if it's comparable with this one
	 * @return true if they are comparable
	 * @see isEqualTo() to compare if the amount is equal
	 * @see isSmallerThan() to check which comparable amount is closest to 0
	 * @see isSmallerThanOrEqualTo() to check which comparable amount is closest to 0
	 * @see isLargerThan() to check which comparable amount is farthest away from 0
	 * @see isLargerThanEqualTo() to check which comparable amount is farthest away from 0
	 * @see isLessThan() to check if the comparable amount is less than other
	 * @see isLessThanEqualTo() to check if the comparable amount is less than or equal to other
	 * @see isGreaterThan() to check if the comparable amount is greater than other
	 * @see isGreaterThanEqualTo() to check if the comparable amount is greater than or equal to other
	 */
	isComparableTo(other: Currency): boolean {
		if (this.code == other.code) {
			return true
		}

		if (this.localCode == other.localCode && typeof this.localCode !== 'undefined') {
			return true
		}

		if (this.code == other.localCode || this.localCode == other.code) {
			return true
		}

		return false
	}

	/**
	 * Negate the currency
	 * @return creates a new currency that has negated the amount
	 */
	negate(): Currency {
		let localAmount = this.localAmount
		if (typeof localAmount !== 'undefined') {
			localAmount = -localAmount
		}

		return new Currency({
			amount: -this.amount,
			code: this.code,
			localAmount: localAmount,
			localCode: this.localCode,
			exchangeRate: this.exchangeRate,
		})
	}

	/**
	 * Return this currency if the amount is positive, or create a new currency that has been negated so
	 * the amount is positive
	 * @return absolute currency (amount) from this currency
	 */
	absolute(): Currency {
		let currency: Currency = this
		if (this.isNegative()) {
			currency = this.negate()
		}
		return currency
	}

	private calculateLocalAmount(): bigint {
		if (typeof this.localCode === 'undefined') {
			return this.amount
		}

		let localAmount = this.amount

		// Check precision difference
		const precisionDiff = BigInt(this.localCode.precision - this.code.precision)

		// If we have larger precision afterwards, multiply now
		if (precisionDiff > 0) {
			localAmount *= 10n ** precisionDiff
		}

		// Calculate the precision of the exchange rate
		const exchangeRatePrecision = Currency.calculatePrecision(this.exchangeRate!)

		// Make exchange rate as a bigint
		const exchangeRate = BigInt(Math.round(10 ** Number(exchangeRatePrecision) * this.exchangeRate!))

		localAmount *= exchangeRate

		// Calculate how much we should divide the local amount with
		let precisionDivide: bigint = exchangeRatePrecision
		if (precisionDiff < 0) {
			precisionDivide += -precisionDiff
		}

		// Divide the local amount (but keep one precision)
		if (precisionDivide >= 2) {
			localAmount /= 10n ** (precisionDivide - 1n)
		}
		// Check the rest (so we can round up if necessary)
		if (precisionDivide >= 1) {
			const rest = localAmount % 10n
			localAmount /= 10n

			// Positive amount
			if (this.isPositive()) {
				if (rest >= 5n) {
					localAmount += 1n
				}
			}
			// Negative amount
			else {
				if (rest <= -5n) {
					localAmount -= 1n
				}
			}
		}
		return localAmount
	}

	/**
	 * Calculate the local amount, i.e., amount * exchangeRate
	 * @return amount * exchangeRate, or just amount if no exchangeRate has been set
	 */
	getLocalCurrency(): Currency {
		if (typeof this.localCode === 'undefined' || typeof this.localAmount === 'undefined') {
			return this
		}

		const option: Currency.Option = {
			amount: this.localAmount,
			code: this.localCode.name,
		}
		return new Currency(option)
	}

	/**
	 * Get the precision of a number
	 * @param num number to get how many numbers after the precision there is
	 * @return how many numbers are after the precision.
	 * @example precision(10.235) -> 3
	 */
	private static calculatePrecision(num: number): bigint {
		if (!isFinite(num)) return 0n
		let e = 1,
			p = 0
		while (Math.round(num * e) / e !== num) {
			e *= 10
			p++
		}
		return BigInt(p)
	}
}

export namespace Currency {
	export interface Code {
		readonly name: string
		readonly precision: number
	}

	export interface Option {
		readonly amount: bigint | number
		readonly code: string | Code
		readonly localAmount?: bigint
		readonly localCode?: string | Code
		readonly exchangeRate?: number
	}

	export class Codes {
		static AED: Code = { name: 'AED', precision: 2 }
		static AFN: Code = { name: 'AFN', precision: 2 }
		static ALL: Code = { name: 'ALL', precision: 2 }
		static AMD: Code = { name: 'AMD', precision: 2 }
		static ANG: Code = { name: 'ANG', precision: 2 }
		static AOA: Code = { name: 'AOA', precision: 2 }
		static ARS: Code = { name: 'ARS', precision: 2 }
		static AUD: Code = { name: 'AUD', precision: 2 }
		static AWG: Code = { name: 'AWG', precision: 2 }
		static AZN: Code = { name: 'AZN', precision: 2 }
		static BAM: Code = { name: 'BAM', precision: 2 }
		static BBD: Code = { name: 'BBD', precision: 2 }
		static BDT: Code = { name: 'BDT', precision: 2 }
		static BGN: Code = { name: 'BGN', precision: 2 }
		static BHD: Code = { name: 'BHD', precision: 3 }
		static BIF: Code = { name: 'BIF', precision: 0 }
		static BMD: Code = { name: 'BMD', precision: 2 }
		static BND: Code = { name: 'BND', precision: 2 }
		static BOB: Code = { name: 'BOB', precision: 2 }
		static BOV: Code = { name: 'BOV', precision: 2 }
		static BRL: Code = { name: 'BRL', precision: 2 }
		static BSD: Code = { name: 'BSD', precision: 2 }
		static BTN: Code = { name: 'BTN', precision: 2 }
		static BWP: Code = { name: 'BWP', precision: 2 }
		static BYN: Code = { name: 'BYN', precision: 2 }
		static BZD: Code = { name: 'BZD', precision: 2 }
		static CAD: Code = { name: 'CAD', precision: 2 }
		static CDF: Code = { name: 'CDF', precision: 2 }
		static CHE: Code = { name: 'CHE', precision: 2 }
		static CHF: Code = { name: 'CHF', precision: 2 }
		static CHW: Code = { name: 'CHW', precision: 2 }
		static CLF: Code = { name: 'CLF', precision: 4 }
		static CLP: Code = { name: 'CLP', precision: 0 }
		static CNY: Code = { name: 'CNY', precision: 2 }
		static COP: Code = { name: 'COP', precision: 2 }
		static COU: Code = { name: 'COU', precision: 2 }
		static CRC: Code = { name: 'CRC', precision: 2 }
		static CUC: Code = { name: 'CUC', precision: 2 }
		static CUP: Code = { name: 'CUP', precision: 2 }
		static CVE: Code = { name: 'CVE', precision: 2 }
		static CZK: Code = { name: 'CZK', precision: 2 }
		static DJF: Code = { name: 'DJF', precision: 0 }
		static DKK: Code = { name: 'DKK', precision: 2 }
		static DOP: Code = { name: 'DOP', precision: 2 }
		static DZD: Code = { name: 'DZD', precision: 2 }
		static EGP: Code = { name: 'EGP', precision: 2 }
		static ERN: Code = { name: 'ERN', precision: 2 }
		static ETB: Code = { name: 'ETB', precision: 2 }
		static EUR: Code = { name: 'EUR', precision: 2 }
		static FJD: Code = { name: 'FJD', precision: 2 }
		static FKP: Code = { name: 'FKP', precision: 2 }
		static GBP: Code = { name: 'GBP', precision: 2 }
		static GEL: Code = { name: 'GEL', precision: 2 }
		static GHS: Code = { name: 'GHS', precision: 2 }
		static GIP: Code = { name: 'GIP', precision: 2 }
		static GMD: Code = { name: 'GMD', precision: 2 }
		static GNF: Code = { name: 'GNF', precision: 0 }
		static GTQ: Code = { name: 'GTQ', precision: 2 }
		static GYD: Code = { name: 'GYD', precision: 2 }
		static HKD: Code = { name: 'HKD', precision: 2 }
		static HNL: Code = { name: 'HNL', precision: 2 }
		static HRK: Code = { name: 'HRK', precision: 2 }
		static HTG: Code = { name: 'HTG', precision: 2 }
		static HUF: Code = { name: 'HUF', precision: 2 }
		static IDR: Code = { name: 'IDR', precision: 2 }
		static ILS: Code = { name: 'ILS', precision: 2 }
		static INR: Code = { name: 'INR', precision: 2 }
		static IQD: Code = { name: 'IQD', precision: 3 }
		static IRR: Code = { name: 'IRR', precision: 2 }
		static ISK: Code = { name: 'ISK', precision: 0 }
		static JMD: Code = { name: 'JMD', precision: 2 }
		static JOD: Code = { name: 'JOD', precision: 3 }
		static JPY: Code = { name: 'JPY', precision: 0 }
		static KES: Code = { name: 'KES', precision: 2 }
		static KGS: Code = { name: 'KGS', precision: 2 }
		static KHR: Code = { name: 'KHR', precision: 2 }
		static KMF: Code = { name: 'KMF', precision: 0 }
		static KPW: Code = { name: 'KPW', precision: 2 }
		static KRW: Code = { name: 'KRW', precision: 0 }
		static KWD: Code = { name: 'KWD', precision: 3 }
		static KYD: Code = { name: 'KYD', precision: 2 }
		static KZT: Code = { name: 'KZT', precision: 2 }
		static LAK: Code = { name: 'LAK', precision: 2 }
		static LBP: Code = { name: 'LBP', precision: 2 }
		static LKR: Code = { name: 'LKR', precision: 2 }
		static LRD: Code = { name: 'LRD', precision: 2 }
		static LSL: Code = { name: 'LSL', precision: 2 }
		static LYD: Code = { name: 'LYD', precision: 3 }
		static MAD: Code = { name: 'MAD', precision: 2 }
		static MDL: Code = { name: 'MDL', precision: 2 }
		static MGA: Code = { name: 'MGA', precision: 2 }
		static MKD: Code = { name: 'MKD', precision: 2 }
		static MMK: Code = { name: 'MMK', precision: 2 }
		static MNT: Code = { name: 'MNT', precision: 2 }
		static MOP: Code = { name: 'MOP', precision: 2 }
		static MRU: Code = { name: 'MRU', precision: 2 }
		static MUR: Code = { name: 'MUR', precision: 2 }
		static MVR: Code = { name: 'MVR', precision: 2 }
		static MWK: Code = { name: 'MWK', precision: 2 }
		static MXN: Code = { name: 'MXN', precision: 2 }
		static MXV: Code = { name: 'MXV', precision: 2 }
		static MYR: Code = { name: 'MYR', precision: 2 }
		static MZN: Code = { name: 'MZN', precision: 2 }
		static NAD: Code = { name: 'NAD', precision: 2 }
		static NGN: Code = { name: 'NGN', precision: 2 }
		static NIO: Code = { name: 'NIO', precision: 2 }
		static NOK: Code = { name: 'NOK', precision: 2 }
		static NPR: Code = { name: 'NPR', precision: 2 }
		static NZD: Code = { name: 'NZD', precision: 2 }
		static OMR: Code = { name: 'OMR', precision: 3 }
		static PAB: Code = { name: 'PAB', precision: 2 }
		static PEN: Code = { name: 'PEN', precision: 2 }
		static PGK: Code = { name: 'PGK', precision: 2 }
		static PHP: Code = { name: 'PHP', precision: 2 }
		static PKR: Code = { name: 'PKR', precision: 2 }
		static PLN: Code = { name: 'PLN', precision: 2 }
		static PYG: Code = { name: 'PYG', precision: 0 }
		static QAR: Code = { name: 'QAR', precision: 2 }
		static RON: Code = { name: 'RON', precision: 2 }
		static RSD: Code = { name: 'RSD', precision: 2 }
		static RUB: Code = { name: 'RUB', precision: 2 }
		static RWF: Code = { name: 'RWF', precision: 0 }
		static SAR: Code = { name: 'SAR', precision: 2 }
		static SBD: Code = { name: 'SBD', precision: 2 }
		static SCR: Code = { name: 'SCR', precision: 2 }
		static SDG: Code = { name: 'SDG', precision: 2 }
		static SEK: Code = { name: 'SEK', precision: 2 }
		static SGD: Code = { name: 'SGD', precision: 2 }
		static SHP: Code = { name: 'SHP', precision: 2 }
		static SLL: Code = { name: 'SLL', precision: 2 }
		static SOS: Code = { name: 'SOS', precision: 2 }
		static SRD: Code = { name: 'SRD', precision: 2 }
		static SSP: Code = { name: 'SSP', precision: 2 }
		static STN: Code = { name: 'STN', precision: 2 }
		static SVC: Code = { name: 'SVC', precision: 2 }
		static SYP: Code = { name: 'SYP', precision: 2 }
		static SZL: Code = { name: 'SZL', precision: 2 }
		static THB: Code = { name: 'THB', precision: 2 }
		static TJS: Code = { name: 'TJS', precision: 2 }
		static TMT: Code = { name: 'TMT', precision: 2 }
		static TND: Code = { name: 'TND', precision: 3 }
		static TOP: Code = { name: 'TOP', precision: 2 }
		static TRY: Code = { name: 'TRY', precision: 2 }
		static TTD: Code = { name: 'TTD', precision: 2 }
		static TWD: Code = { name: 'TWD', precision: 2 }
		static TZS: Code = { name: 'TZS', precision: 2 }
		static UAH: Code = { name: 'UAH', precision: 2 }
		static UGX: Code = { name: 'UGX', precision: 0 }
		static USD: Code = { name: 'USD', precision: 2 }
		static USN: Code = { name: 'USN', precision: 2 }
		static UYI: Code = { name: 'UYI', precision: 0 }
		static UYU: Code = { name: 'UYU', precision: 2 }
		static UYW: Code = { name: 'UYW', precision: 4 }
		static UZS: Code = { name: 'UZS', precision: 2 }
		static VES: Code = { name: 'VES', precision: 2 }
		static VND: Code = { name: 'VND', precision: 0 }
		static VUV: Code = { name: 'VUV', precision: 0 }
		static WST: Code = { name: 'WST', precision: 2 }
		static XAF: Code = { name: 'XAF', precision: 0 }
		static XCD: Code = { name: 'XCD', precision: 2 }
		static XOF: Code = { name: 'XOF', precision: 0 }
		static XPF: Code = { name: 'XPF', precision: 0 }
		static XTS: Code = { name: 'XTS', precision: 0 }
		static YER: Code = { name: 'YER', precision: 2 }
		static ZAR: Code = { name: 'ZAR', precision: 2 }
		static ZMW: Code = { name: 'ZMW', precision: 2 }
		static ZWL: Code = { name: 'ZWL', precision: 2 }
	}

	export namespace Codes {
		/**
		 * Convert a string currency code into an {Code} object
		 * @param code currency code to convert to a Code if it exists
		 * @return the Correct {Code} object if found or undefined if not found
		 */
		export function fromString(code: string): Code | undefined {
			const values = Object.values(Codes)
			for (const value of values) {
				if (value.hasOwnProperty('precision')) {
					const codeObject = value as Code
					if (codeObject.name == code.toUpperCase()) {
						return codeObject
					}
				}
			}
			return undefined
		}

		export function isValid(code: string): boolean {
			if (Object.keys(Codes).includes(code)) {
				return true
			}
			return false
		}
	}
}
