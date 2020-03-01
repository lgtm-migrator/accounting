<?php namespace App\Models;

use CodeIgniter\Model;

class TransactionModel extends Model {
	protected $table = 'transaction';
	protected $returnType = 'App\Entities\Transaction';
	protected $allowedFields = [
		'verification_id',
		'account_id',
		'date',
		'amount',
		'currency',
		'original_amount',
		'exchange_rate',
	];

	public function getByVerificationId($verificationId) {
		return $this->where('verification_id', $verificationId)->findAll();
	}
}
