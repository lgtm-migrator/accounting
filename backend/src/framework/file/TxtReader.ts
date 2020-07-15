import { FileReader } from './FileReader'
import { readFileSync } from 'fs'
import { InternalError } from '../../app/core/definitions/InternalError'

export class TxtReader implements FileReader {
	async read(file: string): Promise<string> {
		const promise = new Promise<string>((resolve) => {
			try {
				const data = readFileSync(file, 'utf8')
				resolve(data)
			} catch (error) {
				throw new InternalError(InternalError.Types.fileNotFound, error)
			}
		})
		return promise
	}
}
