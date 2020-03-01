<?php namespace App\Entities;

use JsonSerializable;

class Entity extends \CodeIgniter\Entity implements JsonSerializable {
	public function __construct()	{
		parent::__construct();
	}

	public function jsonSerialize() {
		return $this->attributes;
	}
}