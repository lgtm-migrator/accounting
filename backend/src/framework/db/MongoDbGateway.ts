import { DbGateway } from './DbGateway'
import { Verification } from '../../app/core/entities/Verification'
import { Parser } from '../../app/core/entities/Parser'
import { Id } from '../../app/core/definitions/Id'
import { MongoClient, Db, Collection, ObjectId } from 'mongodb'
import { Currency } from '../../app/core/entities/Currency'
import { Account } from '../../app/core/entities/Account'
import { User } from '../../app/core/entities/User'
import { config } from '../../config'
import { InternalError } from '../../app/core/definitions/InternalError'
import { Entity } from '../../app/core/entities/Entity'
import { MongoConverter } from './MongoConverter'
import { OutputError } from '../../app/core/definitions/OutputError'
import { EntityErrors } from '../../app/core/definitions/EntityErrors'

export enum Collections {
	Verification = 'Verification',
	User = 'User',
	Account = 'Account',
	FiscalYear = 'FiscalYear',
	Parser = 'Parser',
}

export class MongoDbGateway implements DbGateway {
	private mongoClient?: MongoClient
	private db?: Db
	private connectedPromise: Promise<void>

	constructor() {
		this.connectedPromise = MongoClient.connect(config.mongoDb.url(), { useUnifiedTopology: true })
			.then((mongoClient) => {
				this.mongoClient = mongoClient
				this.db = this.mongoClient.db(config.mongoDb.database)
			})
			.catch((reason) => {
				throw new InternalError(InternalError.Types.dbConnectionError, reason)
			})
	}

	/**
	 * @return promise that is resolved once the gateway has connected to Mongo DB
	 */
	async waitUntilConnected(): Promise<void> {
		return this.connectedPromise
	}

	/**
	 * Get a promise of returning a collection
	 * @param collection the collection to get from the DB
	 * @return promise containing a collection
	 */
	private async collection(collection: Collections): Promise<Collection> {
		return this.waitUntilConnected().then(() => {
			return this.db!.collection(collection)
		})
	}

	private async save(entity: Entity, collection: Collections): Promise<Id> {
		const validation = entity.validate()

		if (validation.length > 0) {
			throw new OutputError(OutputError.Types.invalidInput, validation)
		}

		const dbObject = MongoConverter.toDbObject(entity)

		return this.collection(collection)
			.then(async (collection) => {
				return collection.updateOne({ _id: dbObject._id }, { $set: dbObject }, { upsert: true })
			})
			.then((result) => {
				if (result.modifiedCount + result.upsertedCount === 1) {
					return dbObject._id.toHexString()
				} else {
					throw new InternalError(InternalError.Types.dbError, 'Could save Entity to MongoDB')
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					throw reason
				} else {
					throw new InternalError(InternalError.Types.dbError, reason)
				}
			})
	}

	async saveVerification(verification: Verification): Promise<Id> {
		return this.save(verification, Collections.Verification)
	}

	async getExistingVerification(verification: Verification.Comparable): Promise<Verification | undefined> {
		const searchObject = MongoConverter.toDbObject(verification, 'dont-add-id')

		return this.collection(Collections.Verification)
			.then(async (collection) => {
				return collection.findOne(searchObject)
			})
			.then((foundObject) => {
				// Found object, but might still be different from the comparable verification
				if (foundObject) {
					const foundVerification = MongoConverter.toVerification(foundObject)

					if (verification.isEqualTo(foundVerification.getComparable())) {
						return foundVerification
					}
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async saveParser(parser: Parser): Promise<Id> {
		return this.save(parser, Collections.Parser)
	}

	async getLocalCurrency(userId: Id): Promise<Currency.Code> {
		throw new Error('Method not implemented.')
	}

	async getAccount(userId: Id, accountNumber: number): Promise<Account> {
		return this.collection(Collections.Account)
			.then(async (collection) => {
				return collection.findOne({
					userId: new ObjectId(userId),
					number: accountNumber,
				})
			})
			.then((foundObject) => {
				if (foundObject) {
					return MongoConverter.toAccount(foundObject)
				} else {
					throw OutputError.create(
						OutputError.Types.invalidInput,
						EntityErrors.accountNumberNotFound,
						String(accountNumber)
					)
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getVerification(userId: Id, verificationId: Id): Promise<Verification> {
		return this.collection(Collections.Verification)
			.then(async (collection) => {
				return collection.findOne({
					_id: new ObjectId(verificationId),
					userId: new ObjectId(userId),
				})
			})
			.then((foundObject) => {
				if (foundObject) {
					return MongoConverter.toVerification(foundObject)
				} else {
					throw OutputError.create(
						OutputError.Types.invalidInput,
						EntityErrors.verificationNotFound,
						String(verificationId)
					)
				}
			})
			.catch((reason) => {
				if (reason instanceof InternalError || reason instanceof OutputError) {
					throw reason
				}
				throw new InternalError(InternalError.Types.dbError, reason)
			})
	}

	async getUser(apiKey: string): Promise<User> {
		throw new Error('Method not implemented.')
	}

	async getParsers(userId: Id): Promise<Parser[]> {
		throw new Error('Method not implemented.')
	}
}
