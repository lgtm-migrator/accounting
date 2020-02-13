<?php namespace App\Controllers\API;

class Account extends ApiController {
	public function fill() {
		$file = $this->request->getFile('file');

		if ($file === FALSE && !$file->isValid()) {
			throw new RuntimeException($file->getErrorString().'(').$file->getError().')');
		}


	}
}
