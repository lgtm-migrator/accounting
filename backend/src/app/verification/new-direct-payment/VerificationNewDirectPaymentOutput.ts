import { Immutable } from '../../core/definitions/Immutable'
import { Output } from '../../core/definitions/Output'
import { ImmutableVerification } from '../../core/entities/Verification'

interface VerificationNewDirectPaymentOutputInterface extends Output, ImmutableVerification {}

export type VerificationNewDirectPaymentOutput = Immutable<VerificationNewDirectPaymentOutputInterface>
