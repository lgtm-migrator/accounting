<?php namespace App\Services;

use App\Models\UserModel;
use App\Entities\User;
use RandomLib\Factory;

class Auth {
	private $userModel = null;
	private $loggedIn = false;
	private $apiKey = null;

	public function __construct() {
		$this->userModel = new UserModel();
	}

	public function register($email, $password) {
		$user = new User();
		$user->email = $email;
		$user->password = $password;
		$user->api_key = static::generateApiKey();
		$this->apiKey = $user->api_key;
		$id = $this->userModel->insert($user);
		$user->id = $id;
		unset($user->password);
		$this->loggedIn = true;
		$this->saveToSession();
		return $user;
	}

	public function login($email, $password) {

		$user = $this->userModel
			->where('email', $email)
			->first();

		if ($user && $user->verifyPassword($password)) {
			unset($user->password);
			$this->loggedIn = true;
			$this->apiKey = $user->api_key;
			$this->saveToSession();
			return $user;
		}

		return null;
	}

	public function isAnyoneRegistered() {
		return $this->userModel->countAll() > 0;
	}

	public function verifyApiKey($key) {
		$valid = false;
		 if ($this->apiKey != null) {
			 $valid = $this->apiKey == $key;
		 }

		 // Check against database
		 if (!$valid) {
			$user = $this->userModel->where('api_key', $key)->first();

			if ($user) {
				$valid = true;
				unset($user->password);
				$this->apiKey = $key;
				$this->saveToSession();
			}
		 }

		 return $valid;
	}

	public function isLoggedIn() {
		return $this->loggedIn;
	}

	public function logout() {
		$this->loggedIn = false;
		$this->apiKey = null;
		$this->saveToSession();
	}

	private static function generateApiKey(): string {
		$factory = new Factory();
		$generator = $factory->getMediumStrengthGenerator();
		return $generator->generateString(32);
	}

	private function saveToSession() {
		$data = [
			'Auth::loggedIn' => $this->loggedIn,
			'Auth::apiKey' => $this->apiKey,
		];

		$session = session();
		$session->set($data);
	}

	private function readFromSession() {
		$session = session();

		if ($session->has('Auth::loggedIn')) {
			$this->loggedIn = $session->get('Auth::loggedIn');
			$this->apiKey = $session->get('Auth::apiKey');
		}
	}
} 
