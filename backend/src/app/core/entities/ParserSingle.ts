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
	amount: FindAndReplaceInfo
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
	validate(): OutputError.Info[] {
		const errors = super.validate()

		// Verification name
		if (this.verification.name.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ error: EntityErrors.nameTooShort })
		}

		// Verification internal name
		if (this.verification.internalName.length < Consts.NAME_LENGTH_MIN) {
			errors.push({ error: EntityErrors.internalNameTooShort })
		}

		// Verification type
		if (this.verification.type == Verification.Types.INVALID) {
			errors.push({ error: EntityErrors.verificationTypeInvalid })
		}

		// Account From
		if (
			this.verification.accountFrom < Consts.ACCOUNT_NUMBER_START ||
			this.verification.accountFrom > Consts.ACCOUNT_NUMBER_END
		) {
			errors.push({ error: EntityErrors.accountNumberOutOfRange })
		}

		// Account To
		if (
			this.verification.accountTo < Consts.ACCOUNT_NUMBER_START ||
			this.verification.accountTo > Consts.ACCOUNT_NUMBER_END
		) {
			errors.push({ error: EntityErrors.accountNumberOutOfRange })
		}

		// Matcher
		ParserSingle.validateMatcher(this.matcher.date, 'date', errors)
		ParserSingle.validateMatcher(this.matcher.currencyCode, 'code', errors)
		ParserSingle.validateMatcher(this.matcher.amount, 'total', errors)

		return errors
	}

	/**
	 * Validate a matcher
	 * @param matcher the matcher to validate
	 * @param name the name of the matcher (for printing and logging errors)
	 * @param errors all errors will be added to this array
	 */
	private static validateMatcher(matcher: FindAndReplaceInfo, name: string, errors: OutputError.Info[]) {
		if (matcher.find) {
			if (matcher.replace && !matcher.replacement) {
				errors.push({ error: EntityErrors.parserMatcherReplacementMissing, data: name })
			} else if (matcher.replacement && !matcher.replace) {
				errors.push({ error: EntityErrors.parserMatcherReplaceMissing, data: name })
			}
		} else if (matcher.replacement) {
			if (matcher.replace) {
				errors.push({ error: EntityErrors.parserMatcherFindMissing, data: name })
			}
		} else {
			errors.push({ error: EntityErrors.parserMatcherInvalid, data: name })
		}
	}

	parse(text: string): Parser.VerificationInfo[] {
		const errors: OutputError.Info[] = []
		let date!: string
		let amount!: number
		let code!: Currency.Code

		try {
			date = this.parseDate(text)
		} catch (exception) {
			Parser.addInvalidInputErrors(exception, errors)
		}
		try {
			amount = this.parseAmount(text)
		} catch (exception) {
			Parser.addInvalidInputErrors(exception, errors)
		}
		try {
			code = this.parseCurrencyCode(text)
		} catch (exception) {
			Parser.addInvalidInputErrors(exception, errors)
		}

		if (errors.length > 0) {
			throw new OutputError(OutputError.Types.invalidInput, errors)
		}

		const verificationInfo: Parser.VerificationInfo[] = []

		verificationInfo.push({
			...this.verification,
			date: date,
			amount: amount,
			code: code,
		})

		return verificationInfo
	}

	private parseDate(text: string): string {
		let date = ParserSingle.match(text, this.matcher.date)
		return Parser.fixDate(date)
	}

	private parseCurrencyCode(text: string): Currency.Code {
		const codeString = ParserSingle.match(text, this.matcher.currencyCode)

		if (codeString.length > 0) {
			const code = Currency.Codes.fromString(codeString)

			if (!code) {
				throw OutputError.create(OutputError.Types.invalidInput, EntityErrors.parserCurrencyCodeInvalid, codeString)
			}

			return code
		}

		throw OutputError.create(OutputError.Types.invalidInput, EntityErrors.parserCurrencyCodeInvalid)
	}

	private parseAmount(text: string): number {
		const total = ParserSingle.match(text, this.matcher.amount)
		return ParserSingle.fixAmount(total)
	}

	/**
	 * Matches the text with a find and replace info
	 * @param text the text to parse
	 * @param findAndReplaceInfo what to find and optionally replace the match with
	 * @return the matched (and potentially replaced) string, empty string if errors were added
	 * @throws {OutputError.Types.internalError} if the matcher is invalid
	 * @throws {OutputError.Types.invalidInput} if we couldn't find a match
	 */
	private static match(text: string, findAndReplaceInfo: FindAndReplaceInfo): string {
		if (findAndReplaceInfo.find) {
			const matched = text.match(findAndReplaceInfo.find)

			if (!matched) {
				throw OutputError.create(
					OutputError.Types.invalidInput,
					EntityErrors.parserPatternNotFound,
					String(findAndReplaceInfo.find)
				)
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

		throw OutputError.create(OutputError.Types.internalError, EntityErrors.parserMatcherInvalid)
	}
}
