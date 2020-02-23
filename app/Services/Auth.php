<?php namespace App\Services;

use App\Models\UserModel;
use App\Entities\User;
use RandomLib\Factory;

class Auth {
	private $userModel = null;
	private $loggedIn = false;
	private $apiKey = null;
	private $userId = null;

	public function __construct() {
		$this->userModel = new UserModel();
		$this->readFromSession();
	}

	public function register($email, $password) {
		$user = new User();
		$user->email = $email;
		$user->password = $password;
		$user->api_key = static::generateApiKey();
		$this->apiKey = $user->api_key;
		$id = $this->userModel->insert($user);
		$user->id = $id;
		$this->userId = $id;
		unset($user->password);
		$this->loggedIn = true;
		$this->saveToSession();
		return $user;
	}

	public function login($email, $password) {

		$user = $this->userModel->getByEmail($email);

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

	public function verifyApiKey($apiKey) {
		log_message('debug', "Auth::verifyApiKey()");
		$valid = false;
		 if ($this->apiKey != null) {
			 $valid = $this->apiKey == $apiKey;
		 }

		 // Check against database
		 if (!$valid) {
			$user = $this->userModel->getByApiKey($apiKey);

			if ($user) {
				log_message('debug', "Auth::verifyApiKey() Found user with apiKey: $apiKey");
				$valid = true;
				unset($user->password);
				$this->apiKey = $apiKey;
				$this->userId = $user->id;
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

	public function getUserId() {
		return $this->userId;
	}

	private static function generateApiKey(): string {
		$factory = new Factory();
		$generator = $factory->getMediumStrengthGenerator();
		return $generator->generateString(32);
	}

	private function saveToSession() {
		// $data = [
		// 	'Auth::loggedIn' => $this->loggedIn,
		// 	'Auth::apiKey' => $this->apiKey,
		// 	'Auth::userId' => $this->userId,
		// ];

		// $session = session();
		// $session->set($data);
		// $session->destroy();
		// log_message('debug', 'Auth::saveToSession() Saving auth to session');
	}

	private function readFromSession() {
		// $session = session();

		// if ($session->has('Auth::loggedIn')) {
		// 	$this->loggedIn = $session->get('Auth::loggedIn');
		// 	$this->apiKey = $session->get('Auth::apiKey');
		// 	$this->userId = $session->get('Auth::userId');
		// 	log_message('debug', 'Auth::readFromSession() Found session variables');
		// }
		// $session->destroy();
	}
} 
