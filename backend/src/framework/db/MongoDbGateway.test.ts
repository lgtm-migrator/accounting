import { MongoDbGateway, Collections } from './MongoDbGateway'
import { Verification } from '../../app/core/entities/Verification'
import { MongoClient, Db, ObjectId } from 'mongodb'
import { config } from '../../config'
import * as faker from 'faker'
import { MongoConverter } from './MongoConverter'
import { InternalError } from '../../app/core/definitions/InternalError'

const USER_ID = new ObjectId().toHexString()

function fakerTime(): number {
	return faker.date.between('2000-01-01', new Date()).getTime()
}

function fakerVerificationFull(): Verification {
	const created = fakerTime()
	const modified = created + 1

	const option: Verification.Option = {
		id: new ObjectId().toHexString(),
		userId: USER_ID,
		name: faker.commerce.productName(),
		internalName: faker.commerce.product(),
		number: faker.random.number(),
		date: '2020-01-01',
		dateFiled: modified,
		dateCreated: created,
		dateModified: modified,
		dateDeleted: modified,
		type: Verification.Types.TRANSACTION,
		description: 'A description',
		totalAmount: {
			amount: 1n,
			localAmount: 10n,
			code: 'USD',
			localCode: 'SEK',
			exchangeRate: 10,
		},
		files: ['hello', 'another file'],
		invoiceId: new ObjectId().toHexString(),
		paymentId: new ObjectId().toHexString(),
		requireConfirmation: true,
		transactions: [
			{
				dateCreated: created,
				dateModified: modified,
				accountNumber: 2020,
				currency: {
					amount: 1n,
					localAmount: 10n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				},
			},
			{
				dateCreated: created,
				dateModified: modified,
				accountNumber: 4661,
				currency: {
					amount: -1n,
					localAmount: -10n,
					code: 'USD',
					localCode: 'SEK',
					exchangeRate: 10,
				},
			},
		],
	}

	const verification = new Verification(option)
	return verification
}

function fakerVerificationMinimal(): Verification {
	const option: Verification.Option = {
		userId: USER_ID,
		name: faker.commerce.productName(),
		date: '2020-01-01',
		type: Verification.Types.TRANSACTION,
		transactions: [
			{
				accountNumber: 2020,
				currency: {
					amount: 1n,
					code: 'USD',
				},
			},
			{
				accountNumber: 4661,
				currency: {
					amount: -1n,
					code: 'USD',
				},
			},
		],
	}

	const verification = new Verification(option)
	return verification
}

describe('MongoDBGateway testing connection to the DB #db', () => {
	let gateway: MongoDbGateway
	let client: MongoClient
	let db: Db

	beforeAll(async () => {
		gateway = new MongoDbGateway()
		const connectedPromise = MongoClient.connect(config.mongoDb.url(), { useUnifiedTopology: true })
			.then((mongoClient) => {
				client = mongoClient
				db = client.db(config.mongoDb.database)
			})
			.catch(() => {
				throw new Error('Could not connect to Mongo DB')
			})

		await connectedPromise
	})

	afterEach(async () => {
		await db.dropDatabase()
	})

	afterAll(async () => {
		await client.close()
	})

	it('Test connection', async () => {
		const gateway = new MongoDbGateway()
		await expect(gateway.waitUntilConnected()).resolves.toBe(undefined)
	})

	it('saveVerification() full', async () => {
		const verification = fakerVerificationFull()
		delete verification.id
		const promise = gateway.saveVerification(verification)

		expect.assertions(1)
		await promise
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const option: Verification.Option = MongoConverter.toOption(object)
				verification.id = option.id
				const dbVerification = new Verification(option)
				expect(dbVerification).toEqual(verification)
			})
	})

	it('saveVerification() Minimal', async () => {
		const verification = fakerVerificationMinimal()
		const promise = gateway.saveVerification(verification)

		expect.assertions(1)
		await promise
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const option: Verification.Option = MongoConverter.toOption(object)
				verification.id = option.id
				const dbVerification = new Verification(option)
				expect(dbVerification).toEqual(verification)
			})
	})

	it('saveVerification() update existing', async () => {
		const verification = fakerVerificationMinimal()
		const promise = gateway.saveVerification(verification)

		expect.assertions(2)
		await promise
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const option: Verification.Option = MongoConverter.toOption(object)
				verification.id = option.id
				const dbVerification = new Verification(option)
				expect(dbVerification).toEqual(verification)

				verification.files = ['some files']
				verification.name = 'Another name'
				return gateway.saveVerification(verification)
			})
			.then((id) => {
				return db.collection(Collections.Verification).findOne({ _id: new ObjectId(id) })
			})
			.then((object) => {
				const option: Verification.Option = MongoConverter.toOption(object)
				const dbVerification = new Verification(option)
				expect(dbVerification).toEqual(verification)
			})
	})

	it('getVerification() get existing', async () => {
		const verification = fakerVerificationMinimal()
		const object = MongoConverter.toDbObject(verification)
		verification.id = object._id.toHexString()
		await db.collection(Collections.Verification).insertOne(object)

		const promise = gateway.getVerification(USER_ID, verification.id)
		await expect(promise).resolves.toStrictEqual(verification)
	})

	it('getVerification() searching for id that does not exist', async () => {
		const verification = fakerVerificationMinimal()
		const object = MongoConverter.toDbObject(verification)
		verification.id = object._id.toHexString()
		await db.collection(Collections.Verification).insertOne(object)

		const promise = gateway.getVerification(USER_ID, new ObjectId().toHexString())
		await expect(promise).rejects.toMatchObject({ type: InternalError.Types.dbSearchReturnedEmpty })
	})

	it('getVerification() verification id exists, but wrong userId', async () => {
		const verification = fakerVerificationMinimal()
		const object = MongoConverter.toDbObject(verification)
		verification.id = object._id.toHexString()
		await db.collection(Collections.Verification).insertOne(object)

		const promise = gateway.getVerification(new ObjectId().toHexString(), verification.id)
		await expect(promise).rejects.toMatchObject({ type: InternalError.Types.dbSearchReturnedEmpty })
	})

	it('verificationExists()', async () => {
		// TODO
	})
})
