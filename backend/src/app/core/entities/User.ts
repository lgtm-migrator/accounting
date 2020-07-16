import { Entity } from './Entity'

export namespace User {
	export interface Option extends Entity {
		username: string
		firstName: string
		lastName: string
		apiKey?: string
	}
}

export class User extends Entity implements User.Option {
	username: string
	firstName: string
	lastName: string
	apiKey?: string

	constructor(data: User.Option) {
		super(data)

		this.username = data.username
		this.firstName = data.firstName
		this.lastName = data.lastName
		this.apiKey = data.apiKey
	}
}
