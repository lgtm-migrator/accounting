import { Immutable } from '../../core/definitions/Immutable'
import { Output } from '../../core/definitions/Output'
import { ImmutableVerification } from '../../core/entities/Verification'

interface VerificationNewOutputInterface extends Output, ImmutableVerification {}

export type VerificationNewOutput = Immutable<VerificationNewOutputInterface>
