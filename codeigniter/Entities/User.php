<?php namespace App\Entities;

class User extends Entity {
	public function setPassword(string $password) {
		$this->attributes['password'] = password_hash($password, PASSWORD_BCRYPT);
	}

	public function verifyPassword(string $password) {
		return password_verify($password, $this->password);
	}
}