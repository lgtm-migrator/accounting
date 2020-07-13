import { Input } from '../../core/definitions/Input'
import { Id } from '../../core/definitions/Id'

export interface VerificationNewFromParserInput extends Input {
	userId: Id
	files: string[]
}
