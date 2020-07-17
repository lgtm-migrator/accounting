import { Entity } from './Entity'
import { Currency } from './Currency'
import { OutputError } from '../definitions/OutputError'

export namespace User {
	export interface Option extends Entity.Option {
		username: string
		firstName: string
		lastName: string
		localCurrencyCode: Currency.Code | string
		apiKey?: string
	}
}

export class User extends Entity implements User.Option {
	username: string
	firstName: string
	lastName: string
	localCurrencyCode: Currency.Code
	apiKey?: string

	constructor(data: User.Option) {
		super(data)

		this.username = data.username
		this.firstName = data.firstName
		this.lastName = data.lastName
		this.apiKey = data.apiKey

		if (typeof data.localCurrencyCode === 'string') {
			const code = Currency.Codes.fromString(data.localCurrencyCode)
			if (!code) {
				throw OutputError.create(OutputError.Types.currencyCodeInvalid, data.localCurrencyCode)
			}
			this.localCurrencyCode = code
		} else {
			this.localCurrencyCode = data.localCurrencyCode
		}
	}
}
