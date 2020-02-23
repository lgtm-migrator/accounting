<?php namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model {
	protected $table = 'user';
	protected $returnType = 'App\Entities\User';
	protected $allowedFields = [
		"email",
		"password",
		"name",
		"api_key"
	];

	public function getByApiKey($apiKey) {
		return $this->where('api_key', $apiKey)->first();
	}

	public function getByEmail($email) {
		return $this->where('email', $email)->first();
	}
}