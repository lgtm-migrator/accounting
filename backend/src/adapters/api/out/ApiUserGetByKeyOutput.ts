import { Id } from '../../../app/core/definitions/Id'
import { UserGetByKeyOutput } from '../../../app/user/get-by-key/UserGetByKeyOutput'
import { Immutable } from '../../../app/core/definitions/Immutable'

export interface ApiUserGetByKeyOutput {
	readonly userId: Id
	readonly username: string
	readonly firstName: string
	readonly lastName: string
	readonly localCurrencyCode: string
}

export namespace ApiUserGetByKeyOutput {
	export function fromInteractorOutput(interactorOutput: UserGetByKeyOutput): Immutable<ApiUserGetByKeyOutput> {
		return {
			userId: interactorOutput.user.id!,
			username: interactorOutput.user.username,
			firstName: interactorOutput.user.firstName,
			lastName: interactorOutput.user.lastName,
			localCurrencyCode: interactorOutput.user.localCurrencyCode.name,
		}
	}
}
