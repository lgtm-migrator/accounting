<?php namespace App\Filters;

use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Filters\FilterInterface;

class Auth implements FilterInterface {
	public function before(RequestInterface $request) {
		$auth = \Config\Services::auth();

		// Logged in
		if ($auth->isLoggedIn()) {
			return;
		}

		// Verify api key
		$json = $request->getJSON();
		if ($json && isset($json->api_key)) {
			if ($auth->verifyApiKey($json->api_key)) {
				return;
			}
		}
		
		// TODO redirect to login page '/';
		return redirect('/');
	}

	public function after(RequestInterface $request, ResponseInterface $response) {

	}
}