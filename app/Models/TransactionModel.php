<?php namespace App\Models;

use CodeIgniter\Model;

class TransactionModel extends Model {
	protected $table = 'transaction';
	protected $returnType = 'App\Entities\Transaction';
	protected $allowedFields = [
		'verification_number',
		'account_id',
		'date',
		'debit',
		'credit',
		'currency',
		'exchange_rate',
		'invoice_id'
	];
}
