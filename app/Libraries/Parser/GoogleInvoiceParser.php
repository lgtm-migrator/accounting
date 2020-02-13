<?php namespace App\Libraries\Parser;

use App\Libraries\Parser\BaseParser;
use App\Entities\Transaction;
use DateTime;

class GoogleInvoiceParser extends BaseParser {
	public function __construct(string &$text) {
		$this->currency = $this->findCurrency($text);
		$this->amount = $this->findAmount($text);
		$this->setDate($this->findDate($text));

		if ($this->currency == 'EUR') {
			$this->name = 'Google G Suite (faktura)';
			$this->internal_name = BaseParser::GOOGLE_INVOICE_G_SUITE_EUR;
		} elseif ($this->currency == 'USD') {
			$this->name = 'Google Cloud Platform (faktura)';
			$this->internal_name = BaseParser::GOOGLE_INVOICE_CLOUD_PLATFORM_USD;
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

	private function findAmount(string &$text) {
		$found = preg_match('/[$€](\d{1,2}\.\d{2})/', $text, $matches);

		if ($found === 1) {
			return $matches[1];
		} else {
			return null;
		}
	}

	// Convert date from Jan 31, 2019 --> 2019-01-31
	private function setDate($date) {
		$date_time = DateTime::createFromFormat('M d, Y', $date);
		$this->date = $date_time->format('Y-m-d');
	}

	public function createTransactions() {
		$transactions = [];

		$converted_amount = $this->amount * $this->exchange_rate;

		// 2440 Leverantörsskulder
		$transaction = new Transaction();
		$transaction->account_id = 2440;
		$transaction->date = $this->date;
		$transaction->exchange_rate = $this->exchange_rate;
		$transaction->credit = $this->amount;
		$transaction->currency = $this->currency;
		$transactions[] = $transaction;

		// 2614 Utgående moms utl.
		$transaction = new Transaction();
		$transaction->account_id = 2614;
		$transaction->date = $this->date;
		$transaction->credit = $converted_amount;
		$transactions[] = $transaction;

		// 2645 Ingående moms utl.
		$transaction = new Transaction();
		$transaction->account_id = 2645;
		$transaction->date = $this->date;
		$transaction->debit = $converted_amount;
		$transactions[] = $transaction;

		// 4646 EU / 4661 US
		$transaction = new Transaction();
		$transaction->account_id = $transaction->currency == 'EUR' ? 4646 : 4661;
		$transaction->date = $this->date;
		$transaction->exchange_rate = $this->exchange_rate;
		$transaction->debit = $this->amount;
		$transaction->currency = $this->currency;
		$transactions[] = $transaction;		

		return $transactions;
	}
}
