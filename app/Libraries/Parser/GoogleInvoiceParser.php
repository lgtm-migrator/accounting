<?php namespace App\Libraries\Parser;

use App\Entities\Transaction;
use App\Entities\Verification;
use DateTime;

class GoogleInvoiceParser extends BaseParser {
	public function __construct(string &$text) {
		parent::__construct();
		$verification = $this->verification;
		$verification->type = Verification::TYPE_INVOICE;;

		$this->currency = $this->findCurrency($text);
		$verification->total = $this->findTotal($text);
		$this->setDate($this->findDate($text));

		if ($this->currency == 'EUR') {
			$verification->name = 'Google G Suite (faktura)';
			$verification->internal_name = BaseParser::GOOGLE_INVOICE_G_SUITE_EUR;
		} elseif ($this->currency == 'USD') {
			$verification->name = 'Google Cloud Platform (faktura)';
			$verification->internal_name = BaseParser::GOOGLE_INVOICE_CLOUD_PLATFORM_USD;
		}
	}

	private function findDate(string &$text) {
		$found = preg_match('/[JFMASOND][aepuco][nbrylgptvc]\ \d{2},\ 20\d{2}/', $text, $matches);

		if ($found === 1) {
			return $matches[0];
		} else {
			return null;
		}
	}

	private function findCurrency(string &$text) {
		if (strpos($text, 'EUR') !== FALSE) {
			return 'EUR';
		} elseif (strpos($text, 'USD') !== FALSE) {
			return 'USD';
		} else {
			return null;
		}
	}

	private function findTotal(string &$text) {
		$found = preg_match('/[$€](\d{1,2}\.\d{2})/', $text, $matches);

		if ($found === 1) {
			return doubleval($matches[1]);
		} else {
			return null;
		}
	}

	// Convert date from Jan 31, 2019 --> 2019-01-31
	private function setDate($date) {
		$date_time = DateTime::createFromFormat('M d, Y', $date);
		$this->verification->date = $date_time->format('Y-m-d');
	}

	public function createTransactions(&$verification) {
		$converted_amount = $this->getConvertedTotal();
		$verification = $this->verification;

		// 2440 Leverantörsskulder
		$transaction = new Transaction($verification);
		$transaction->account_id = 2440;
		$transaction->exchange_rate = $this->exchange_rate;
		$transaction->credit = $converted_amount;
		$transaction->original_amount = $verification->total;
		$transaction->currency = $this->currency;
		$verification->transactions[] = $transaction;

		// 2614 Utgående moms utl.
		$transaction = new Transaction($verification);
		$transaction->account_id = 2614;
		$transaction->credit = $converted_amount * 0.25;
		$verification->transactions[] = $transaction;

		// 2645 Ingående moms utl.
		$transaction = new Transaction($verification);
		$transaction->account_id = 2645;
		$transaction->debit = $converted_amount * 0.25;
		$verification->transactions[] = $transaction;

		// 4646 EU / 4661 US
		$transaction = new Transaction($verification);
		$transaction->account_id = $this->currency == 'EUR' ? 4646 : 4661;
		$transaction->exchange_rate = $this->exchange_rate;
		$transaction->debit = $converted_amount;
		$transaction->original_amount = $verification->total;
		$transaction->currency = $this->currency;
		$verification->transactions[] = $transaction;		
	}
}
