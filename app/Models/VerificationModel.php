<?php namespace App\Models;

use CodeIgniter\Model;

class VerificationModel extends Model {
	protected $table = 'verification';
	protected $returnType = 'App\Entities\Verification';
	protected $allowedFields = [
		'user_id',
		'verification_number',
		'date',
		'commit_date',
		'internal_name',
		'name',
		'description',
		'total',
		'type',
		'file',
		'invoice_id',
		'require_confirmation',
	];

	public function isDuplicate($verification) {
		$result = $this->
			where('user_id', $verification->user_id)->
			where('date', $verification->date)->
			where('total', $verification->total)->
			first();
		
		return $result !== null;
	}

	public function getAll(int $userId, $fiscalId = null) {
		$builder = $this->where('user_id', $userId);

		// TODO fiscal ID
		// if ($fiscalId) {
		// 	$builder = $builder->where('fiscal_id', $fiscalId);
		// }
		
		$builder = $builder->orderBy('date', 'ASC');
		
		return $builder->findAll();
	}

	public function insert($data = null, bool $returnID = true) {
		// TODO automatically get the correct fiscal id

		return parent::insert($data, $returnID);
	}
}
