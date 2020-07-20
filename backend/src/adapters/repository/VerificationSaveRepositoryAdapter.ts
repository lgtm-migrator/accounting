import { BaseAdapter } from './BaseAdapter'
import { VerificationSaveRepository } from '../../app/verification/save/VerificationSaveRepository'
import { Verification } from '../../app/core/entities/Verification'
import { Id } from '../../app/core/definitions/Id'

export class VerificationSaveRepositoryAdapter extends BaseAdapter implements VerificationSaveRepository {
	async saveVerification(verification: Verification): Promise<Id> {
		return BaseAdapter.dbGateway.saveVerification(verification)
	}

	async saveFiles(files: string[], verification: Verification): Promise<Verification> {
		// TODO implement saveFiles
		throw new Error('Method not implemented.')
	}

	async getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined> {
		return BaseAdapter.dbGateway.getExistingVerification(verification)
	}
}
