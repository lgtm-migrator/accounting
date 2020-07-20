import { BaseAdapter } from './BaseAdapter'
import { VerifyApiKeyRepository } from '../../app/util/verify-api-key/VerifyApiKeyRepository'
import { Id } from '../../app/core/definitions/Id'

export class VerifyApiKeyRepositoryAdapter extends BaseAdapter implements VerifyApiKeyRepository {
	async findUserWithApiKey(apiKey: string): Promise<Id> {
		return BaseAdapter.dbGateway.getUser(apiKey).then((user) => {
			return user.id!
		})
	}
}
