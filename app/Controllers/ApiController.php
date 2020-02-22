<?php namespace App\Controllers;

use CodeIgniter\Controller;
use CodeIgniter\API\ResponseTrait;

class ApiController extends Controller {
	use ResponseTrait;
	protected const STATUS_OK = '{"status": "OK"}';
	protected const STATUS_ERROR = '{"status": "ERROR"}';

	public function initController(\CodeIgniter\HTTP\RequestInterface $request, \CodeIgniter\HTTP\ResponseInterface $response, \Psr\Log\LoggerInterface $logger)
	{
		// Do Not Edit This Line
		parent::initController($request, $response, $logger);

		// Preload any models, libraries, etc, here

		// Allow CORS in development
		if ($_SERVER['CI_ENVIRONMENT'] === 'development') {
			$response->setHeader('Access-Control-Allow-Origin', '*');
			$response->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS' );
			$response->setHeader('Access-Control-Allow-Headers', '*');
		}
	}

	public function allowCorbs() {
	}
}
