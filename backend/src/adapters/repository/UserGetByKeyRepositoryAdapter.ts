import { BaseAdapter } from './BaseAdapter'
import { UserGetByKeyRepository } from '../../app/user/get-by-key/UserGetByKeyRepository'
import { Id } from '../../app/core/definitions/Id'

export class UserGetByKeyRepositoryAdapter extends BaseAdapter implements UserGetByKeyRepository {
	async findUserWithApiKey(apiKey: string): Promise<Id> {
		return BaseAdapter.dbGateway.getUser(apiKey).then((user) => {
			return user.id!
		})
	}
}
