<?php namespace App\Controllers;

class User extends ApiController {
	public function login() {
		$auth = \Config\Services::auth();

		$input = $this->request->getJSON();

		// No email and password supplied
		if ($input->email == null || $input->password == null) {
			return $this->failValidationError('No email or password specified');
		}

		// Try logging in
		$user = $auth->login($input->email, $input->password);
		
		// Check if there are no users registered, then we want to register
		if ($user == null && !$auth->isAnyoneRegistered()) {
			log_message('debug', "Creating new user");
			$user = $auth->register($input->email, $input->password);
		}

		// Send back the user somehow
		if ($user) {
			return $this->respond($user);
		} else {
			return $this->failValidationError('No email with that password');
		}
	}
}
