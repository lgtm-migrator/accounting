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
		'total_sek',
		'type',
		'file_count',
		'invoice_id',
		'require_confirmation',
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

	public function getAll(int $userId) {
		$builder = $this->where('user_id', $userId);
		
		$builder = $builder->orderBy('date', 'ASC');
		
		return $builder->findAll();
	}
}
