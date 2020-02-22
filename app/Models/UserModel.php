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
}