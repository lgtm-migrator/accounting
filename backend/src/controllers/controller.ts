import { Request, Response } from 'express'

export default abstract class Controller {
	public readonly request: Request
	public readonly response: Response

	constructor(request: Request, response: Response) {
		this.request = request
		this.response = response
	}

	abstract run(): void
}
