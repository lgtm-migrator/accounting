import { Request, Response } from 'express'
import Controller from '../controller'

export default abstract class ApiController extends Controller {
	constructor(request: Request, response: Response) {
		super(request, response)
		this.response.type('json')
	}

	abstract run(): void
}
