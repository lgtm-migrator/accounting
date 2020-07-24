import { Id } from '../../core/definitions/Id'
import { Output } from '../../core/definitions/Output'

export interface UserGetByKeyOutput extends Output {
	readonly id: Id
}
