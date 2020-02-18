<?php namespace App\Models;

use CodeIgniter\Model;

class AccountModel extends Model {
	protected $table = 'account';
	protected $returnType = 'App\Entities\Account';
	protected $allowedFields = [
		'name',
		'vat_code'
	];

	public function updateAccount($id, $name) {
		$query = $this->db->table($this->table)->where('id', $id)->limit(1)->get();

		$row = $query->getRow();

		// New
		if (!isset($row)) {
			$sql = "INSERT INTO $this->table (id, name) VALUES(" . $this->db->escape($id) . ", " . $this->db->escape($name) . ")";
			$this->db->query($sql);
		}
	}
}
