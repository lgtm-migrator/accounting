<?php namespace App\Models;

use CodeIgniter\Model;

class VerificationModel extends Model {
	protected $table = 'verification';
	protected $returnType = 'App\Entities\Verification';
	protected $allowedFields = [
		'verification_number',
		'date',
		'internal_name',
		'name',
		'description',
		'file',
		'invoice_id'
	];

	public function isDuplicate($verification) {
		$result = $this->
			where('date', $verification->date)->
			where('internal_name', $verification->internal_name)->
			first();
		
		var_dump($result);
		return $result !== null;
	}
}
