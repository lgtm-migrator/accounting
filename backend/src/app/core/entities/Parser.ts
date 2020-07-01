import { Id } from '../definitions/Id'
import { Entity } from './Entity'
import { Verification } from './Verification'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'
import { EntityErrors } from '../definitions/EntityErrors'

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
		userId: Id
		verification: VerificationInfo
		matcher: MatcherInfo
		isMultiple?: boolean
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
	userId: Id
	verification: VerificationInfo
	matcher: MatcherInfo
	isMultiple: boolean

	constructor(data: Parser.Option) {
		super(data)

		this.userId = data.userId
		this.verification = data.verification
		this.matcher = data.matcher
		this.isMultiple = Boolean(data.isMultiple)
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
		const date = this.parseDate(text)
		const total = this.parseTotal(text)
		const code = this.parseCurrencyCode(text)

		return {
			...this.verification,
			date: date,
			total: total,
			code: code,
		}
	}

	private parseDate(text: string): string {
		return Parser.match(text, this.matcher.date)
	}

	private parseCurrencyCode(text: string): Currency.Code {
		const codeString = Parser.match(text, this.matcher.currencyCode)
		const code = Currency.Codes.fromString(codeString)

		if (!code) {
			throw new OutputError(OutputError.Types.invalidInput, [EntityErrors.parserInvalidCurrencyCode, codeString])
		}

		return code
	}

	private parseTotal(text: string): number {
		const total = Parser.match(text, this.matcher.total)
		return Parser.convertToValidAmount(total)
	}

	/**
	 * Matches the text with a find and replace info
	 * @param text the text to parse
	 * @param findAndReplaceInfo what to find and optionally replace the match with
	 * @return the matched (and potentially replaced) string
	 */
	private static match(text: string, findAndReplaceInfo: FindAndReplaceInfo): string {
		if (findAndReplaceInfo.find) {
			const matched = text.match(findAndReplaceInfo.find)

			if (!matched) {
				const errors: string[] = [EntityErrors.parserPatternNotFound, String(findAndReplaceInfo.find)]
				throw new OutputError(OutputError.Types.invalidInput, errors)
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

		throw new OutputError(OutputError.Types.internalError, [EntityErrors.parserInvalidMatcherFindAndReplace])
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
		return Number.parseFloat(amount.replace(regex, replacement))
	}
}
