<?php namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;
use Config\Services;

class AuthFilter implements FilterInterface {
	public function before(RequestInterface $request) {
		$auth = \Config\Services::auth();

		// Logged in
		if ($auth->isLoggedIn()) {
			log_message('debug', 'AuthFilter::before() Authorized through session isLoggedIn()');
			return;
		}

		// Try through API key
		$apiKey = null;

		// Used json to send the request?
		$json = $request->getJSON();
		if ($json && isset($json->apiKey)) {
			$apiKey = $json->apiKey;
		}

		// Get request or similar
		else {
			$apiKey = $request->getGet('apiKey');
		}

		// Verify API key
		$errorMessage = '';
		if ($apiKey) {
			if ($auth->verifyApiKey($apiKey)) {
				log_message('debug', 'AuthFilter::before() Authorized through api_key');
				return;
			} else {
				$errorMessage = 'Invalid API key.';
			}
		} else {
			$errorMessage = 'Missing API key.';
		}

		// Access denied
		log_message('debug', 'AuthFilter::before() Not authorized, redirecting to /');
		$response = Services::response();
		$response->setStatusCode(401, $errorMessage);
		return $response;
	}

	public function after(RequestInterface $request, ResponseInterface $response) {

	}
}