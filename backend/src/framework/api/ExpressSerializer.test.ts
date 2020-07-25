import { ExpressSerializer } from './ExpressSerializer'

describe('Express Serializer #cold #api', () => {
	it('serialize() minimal object', () => {
		const data = {
			test: 'hello',
			age: 13,
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(data)
	})

	it('serialize() bigint test', () => {
		const data = {
			text: 'some text',
			big: 13557665468864665468469843168468n,
			big2: -1n,
			age: 15,
		}

		const valid = {
			text: data.text,
			big: '13557665468864665468469843168468n',
			big2: `-1n`,
			age: data.age,
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(valid)
	})

	it('serialize() regexp', () => {
		const data = {
			text: 'some text',
			regex: /some regex/,
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(data)
	})

	it('serialize() recursive object', () => {
		const data = {
			text: 'some text',
			big: 12n,
			child: {
				big: 123n,
			},
		}

		const valid = {
			text: data.text,
			big: '12n',
			child: {
				big: '123n',
			},
		}

		expect(ExpressSerializer.serialize(data)).toStrictEqual(valid)
	})
})
