<?php namespace App\Models;

use CodeIgniter\Model;

class VerificationModel extends Model {
	protected $table = 'verification';
	protected $returnType = 'App\Entities\Verification';
	protected $allowedFields = [
		'user_id',
		'fiscal_id',
		'verification_number',
		'date',
		'commit_date',
		'internal_name',
		'name',
		'description',
		'total',
		'total_sek',
		'type',
		'file_count',
		'invoice_id',
		'require_confirmation',
		'deleted',
	];

	public function getDuplicate($verification) {
		$result = $this
			->where('user_id', $verification->user_id)
			->where('date', $verification->date)
			->where('type', $verification->type)
			->where('total', $verification->total)
			->first();

		if (!$result) {
			$result = $this
				->where('user_id', $verification->user_id)
				->where('date', $verification->date)
				->where('total_sek', $verification->total_sek)
				->first();
		}

		return $result;
	}

	public function getAll(int $userId, $fiscalId) {
		if ($fiscalId != NULL) {
			return $this->
				where('user_id', $userId)->
				where('fiscal_id', $fiscalId)->
				orderBy('date', 'ASC')->
				findAll();
		} else {
			return $this->
				where('user_id', $userId)->
				orderBy('date', 'ASC')->
				findAll();
		}
	}
}
