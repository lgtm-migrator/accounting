<?php namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;

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
		if ($apiKey) {
			if ($auth->verifyApiKey($apiKey)) {
				log_message('debug', 'AuthFilter::before() Authorized through api_key');
				return;
			}
		}
		
		// TODO redirect to login page '/';
		log_message('debug', 'AuthFilter::before() Not authorized, redirecting to /');
		return redirect('/');
	}

	public function after(RequestInterface $request, ResponseInterface $response) {

	}
}