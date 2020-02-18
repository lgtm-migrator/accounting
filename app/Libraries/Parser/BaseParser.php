<?php namespace App\Libraries\Parser;

use App\Entities\Verification;

abstract class BaseParser {
	public $name;
	public $description = '';
	public $currency = null;
	public $exchange_rate = 10.35306300;
	public $amount;
	public $date;
	public $invoice_id = null;

	// All internal names for the parsers
	public const GOOGLE_INVOICE_G_SUITE_EUR = 'GOOGLE_INVOICE_G_SUITE_EUR';
	public const GOOGLE_INVOICE_CLOUD_PLATFORM_USD = 'GOOGLE_INVOICE_CLOUD_PLATFORM_USD';

	public function createVerifications() {
		helper('currency');
		
		$verification = new Verification();
		$verification->name = $this->name;
		$verification->internal_name = $this->internal_name;
		$verification->date = $this->date;
		$verification->description = $this->description;
		$verification->invoice_id = $this->invoice_id;

		if ($this->currency != null) {
// 			$this->exchange_rate = exchangeRateToSek($this->currency, $this->date);
		}

		$verification->transactions = $this->createTransactions();

		return [$verification];
	}

	public abstract function createTransactions();
}
