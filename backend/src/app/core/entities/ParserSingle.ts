import { Entity } from './Entity'
import { Verification } from './Verification'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { EntityErrors } from '../definitions/EntityErrors'
import { Consts } from '../definitions/Consts'
import '../definitions/String'
import { Parser } from './Parser'

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
	date: FindAndReplaceInfo
	currencyCode: FindAndReplaceInfo
	total: FindAndReplaceInfo
}

export namespace ParserSingle {
	export interface Option extends Parser.Option {
		verification: VerificationInfo
		matcher: MatcherInfo
	}
}

/**
 * Used for parsing text getting all the valuable information from that text
 */
export class ParserSingle extends Parser implements ParserSingle.Option {
	verification: VerificationInfo
	matcher: MatcherInfo

	constructor(data: ParserSingle.Option) {
		super(data, Parser.Types.single)
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
		ParserSingle.validateMatcher(this.matcher.date, 'date', errors)
		ParserSingle.validateMatcher(this.matcher.currencyCode, 'code', errors)
		ParserSingle.validateMatcher(this.matcher.total, 'total', errors)

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

	parse(text: string): Parser.VerificationInfo[] {
		const errors: string[] = []

		const date = this.parseDate(text, errors)
		const total = this.parseTotal(text, errors)
		const code = this.parseCurrencyCode(text, errors)

		if (errors.length > 0) {
			throw new OutputError(OutputError.Types.invalidInput, errors)
		}

		const verificationInfo: Parser.VerificationInfo[] = []

		verificationInfo.push({
			...this.verification,
			date: date,
			amount: total,
			code: code!,
		})

		return verificationInfo
	}

	private parseDate(text: string, errors: string[]): string {
		let date = ParserSingle.match(text, this.matcher.date, errors)
		return Parser.fixDate(date, errors)
	}

	private parseCurrencyCode(text: string, errors: string[]): Currency.Code | undefined {
		const codeString = ParserSingle.match(text, this.matcher.currencyCode, errors)

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
		const total = ParserSingle.match(text, this.matcher.total, errors)
		return ParserSingle.convertToValidAmount(total)
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
}
