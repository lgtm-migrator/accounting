import { Verification, ImmutableVerification } from '../../core/entities/Verification'
import { Output } from '../../core/definitions/Output'

interface VerificationNewCustomTransactionOutputInterface extends Output, ImmutableVerification {}

export type VerificationNewCustomTransactionOutput = VerificationNewCustomTransactionOutputInterface
