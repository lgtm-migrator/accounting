import { Entity } from './Entity'
import { Verification } from './Verification'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { EntityErrors } from '../definitions/EntityErrors'
import { Consts } from '../definitions/Consts'
import '../definitions/String'

interface VerificationInfo {
	name: string
	internalName: string
	type: Verification.Types
	accountFrom: number
	accountTo: number
}

interface FindAndReplaceInfo {
	/** What to find for. If find isn't set replacement must be set. */
	find?: RegExp
	/** If the found match needs to be replaced to match output */
	replace?: RegExp
	/** What to replace the found string with */
	replacement?: string
}

interface MatcherInfo {
	identifier: RegExp
	date: FindAndReplaceInfo
	currencyCode: FindAndReplaceInfo
	total: FindAndReplaceInfo
}

export namespace Parser {
	export interface Option extends Entity.Option {
		verification: VerificationInfo
		matcher: MatcherInfo
	}
	export interface Output extends VerificationInfo {
		date: string
		code: Currency.Code
		total: number
	}
}

/**
 * Used for parsing text getting all the valuable information from that text
 */
export class Parser extends Entity implements Parser.Option {
	verification: VerificationInfo
	matcher: MatcherInfo

	constructor(data: Parser.Option) {
		super(data)
		this.verification = data.verification
		this.matcher = data.matcher
	}

	/**
	 * Validate the parser
	 */
	validate(): EntityErrors[] {
		const errors = super.validate()

		// Verification name
		if (this.verification.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push(EntityErrors.nameTooShort)
		}

		// Verification internal name
		if (this.verification.internalName.length < Consts.NAME_LENGTH_MIN) {
			errors.push(EntityErrors.internalNameTooShort)
		}

		// Verification type
		if (this.verification.type == Verification.Types.INVALID) {
			errors.push(EntityErrors.verificationTypeInvalid)
		}

		// Account From
		if (
			this.verification.accountFrom < Consts.ACCOUNT_NUMBER_START ||
			this.verification.accountFrom > Consts.ACCOUNT_NUMBER_END
		) {
			errors.push(EntityErrors.accountNumberOutOfRange)
		}

		// Account To
		if (
			this.verification.accountTo < Consts.ACCOUNT_NUMBER_START ||
			this.verification.accountTo > Consts.ACCOUNT_NUMBER_END
		) {
			errors.push(EntityErrors.accountNumberOutOfRange)
		}

		// Matcher
		Parser.validateMatcher(this.matcher.date, 'date', errors)
		Parser.validateMatcher(this.matcher.currencyCode, 'code', errors)
		Parser.validateMatcher(this.matcher.total, 'total', errors)

		return errors
	}

	/**
	 * Validate a matcher
	 * @param matcher the matcher to validate
	 * @param name the name of the matcher (for printing and logging errors)
	 * @param errors all errors will be added to this array
	 */
	private static validateMatcher(matcher: FindAndReplaceInfo, name: string, errors: string[]) {
		if (matcher.find) {
			if (matcher.replace && !matcher.replacement) {
				errors.push(EntityErrors.parserMatcherReplacementMissing + '-' + name)
			} else if (matcher.replacement && !matcher.replace) {
				errors.push(EntityErrors.parserMatcherReplaceMissing + '-' + name)
			}
		} else if (matcher.replacement) {
			if (matcher.replace) {
				errors.push(EntityErrors.parserMatcherFindMissing + '-' + name)
			}
		} else {
			errors.push(EntityErrors.parserMatcherInvalid + '-' + name)
		}
	}

	/**
	 * Checks whether this Parser is for the specified text
	 * @param text the text to see if this Parser is of
	 * @return true if the text should be parsed by this Parser, false otherwise
	 */
	isOfType(text: string): boolean {
		return this.matcher.identifier.test(text)
	}

	parse(text: string): Parser.Output {
		const errors: string[] = []

		const date = this.parseDate(text, errors)
		const total = this.parseTotal(text, errors)
		const code = this.parseCurrencyCode(text, errors)

		if (errors.length > 0) {
			throw new OutputError(OutputError.Types.invalidInput, errors)
		}

		return {
			...this.verification,
			date: date,
			total: total,
			code: code!,
		}
	}

	private parseDate(text: string, errors: string[]): string {
		let date = Parser.match(text, this.matcher.date, errors)

		const regexs: RegExp[] = [
			/[Jj]a(nuary|n)/,
			/[Ff]e(bruary|b)/,
			/[Mm]a(rch|r)/,
			/[Aa]p(ril|r)/,
			/[Mm]ay/,
			/[Jj]u(ne|n)/,
			/[Jj]u(ly|l)/,
			/[Aa]u(gust|g)/,
			/[Ss]e(ptember|p)/,
			/[Oo]c(tober|t)/,
			/[Nn]o(vember|v)/,
			/[Dd]e(cember|c)/,
		]

		for (let i = 0; i < regexs.length; ++i) {
			const regex = regexs[i]
			let month = String(i + 1)
			// Add 0 before month
			if (month.length == 1) {
				month = '0' + month
			}
			date = date.replace(regex, month)
		}

		if (!date.isValidIsoDate()) {
			errors.push(EntityErrors.parserDateInputInvalid)
		}

		return date
	}

	private parseCurrencyCode(text: string, errors: string[]): Currency.Code | undefined {
		const codeString = Parser.match(text, this.matcher.currencyCode, errors)

		if (codeString.length > 0) {
			const code = Currency.Codes.fromString(codeString)

			if (!code) {
				errors.push(EntityErrors.parserCurrencyCodeInvalid)
				errors.push(codeString)
				return
			}

			return code
		}
	}

	private parseTotal(text: string, errors: string[]): number {
		const total = Parser.match(text, this.matcher.total, errors)
		return Parser.convertToValidAmount(total)
	}

	/**
	 * Matches the text with a find and replace info
	 * @param text the text to parse
	 * @param findAndReplaceInfo what to find and optionally replace the match with
	 * @param errors errors will be appended to this array
	 * @return the matched (and potentially replaced) string, empty string if errors were added
	 */
	private static match(text: string, findAndReplaceInfo: FindAndReplaceInfo, errors: string[]): string {
		if (findAndReplaceInfo.find) {
			const matched = text.match(findAndReplaceInfo.find)

			if (!matched) {
				errors.push(EntityErrors.parserPatternNotFound)
				errors.push(String(findAndReplaceInfo.find))
				return ''
			}
			let value = matched[0]

			if (findAndReplaceInfo.replace && findAndReplaceInfo.replacement) {
				value = value.replace(findAndReplaceInfo.replace, findAndReplaceInfo.replacement)
			}
			return value
		}
		// Only a replacement, use this value directly
		else if (findAndReplaceInfo.replacement) {
			return findAndReplaceInfo.replacement
		}

		throw new OutputError(OutputError.Types.internalError, [EntityErrors.parserMatcherInvalid])
	}

	/**
	 * Converts a string currency amount to a valid number. Supports many different
	 * formats.
	 * ```
	 * 2.578,20
	 * 2 354,20
	 * 234
	 * 234,256.20
	 * 234,205
	 * 246 548
	 * 244'056
	 * 26'155.25
	 * 12,20
	 * 13.33
	 * ```
	 * @param amount the amount to convert to a valid number
	 * @return valid number
	 */
	private static convertToValidAmount(amount: string): number {
		const regex = /^(\d{0,3})?[\. ,']?(\d{0,3})[.,](\d{2})$|^(\d{0,3})?[\.\ ,']?(\d{0,3})$/
		const replacement = '$1$2$4$5.$3'
		const converted = amount.replace(regex, replacement)
		return Number.parseFloat(converted)
	}
}
