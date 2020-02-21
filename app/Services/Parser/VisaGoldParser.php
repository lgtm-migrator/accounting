<?php namespace App\Services\Parser;

use App\Entities\Verification;
use App\Entities\Transaction;
use App\Models\VerificationModel;
use App\Models\TransactionModel;
use RuntimeException;

class VisaGoldParser extends BaseParser {
	private const REGEX_PATTERN = '/(20\d{2}-\d{2}-\d{2})\n(.+\n{0,1}\D*)\n([0-9,]+)\n.*\n([0-9,]+)\n(\w+)\n/m';
	
	public function __construct(string &$text) {
		parent::__construct();
		$this->verification->type = Verification::TYPE_PAYMENT;

		// TODO remove
		$this->exchange_rate = 10.3663;

		$this->parse($text);
		$this->figureOutName();
		$this->findAndBindInvoiceId();
	}

	private function parse(string &$text) {
		$found = preg_match(VisaGoldParser::REGEX_PATTERN, $text, $matches);

		if ($found !== 1) {
			throw new RuntimeException("Could not parse the PDF as VisaGoldParser.");
		}
		if (count($matches) != 6) {
			throw new RuntimeException("Could not parse the PDF as VisaGoldParser; invalid number of matches.");
		}

		$verification = $this->verification;
		$verification->date = $matches[1];
		$verification->name = $matches[2];
		$this->payed = BaseParser::convertToValidAmount($matches[3]);
		$verification->total = BaseParser::convertToValidAmount($matches[4]);
		$this->currency = $matches[5];
	}

	private function figureOutName() {
		$verification = $this->verification;
		if (strpos($verification->name, 'GSUITE') !== FALSE) {
			$verification->internal_name = BaseParser::VISA_GOLD_GOOGLE_G_SUITE_PAYMENT;
			$this->invoice_name = BaseParser::GOOGLE_INVOICE_G_SUITE_EUR;
			$verification->name = 'Google G Suite (betalning) - Visa Gold';
		} else {
			$verification->internal_name = BaseParser::GENERIC;
			$this->invoice_name = BaseParser::GENERIC;
			$verification->require_confirmation = 1;
		}
	}

	private function findAndBindInvoiceId() {
		$verificationModel = new VerificationModel();

		$invoiceVerification = $verificationModel->
			where('type', Verification::TYPE_INVOICE)->
			where('total', $this->verification->total)->
			where('internal_name', $this->invoice_name)->
			where("date < '" . $this->verification->date . "'")->
			orderBy('date', 'DESC')->
			first();

		// Found
		if ($invoiceVerification !== null) {
			$this->verification->invoice_id = $invoiceVerification->id;
		} else {
			$this->verification->require_confirmation = 1;
		}
	}

	public function createTransactions(&$verification) {
		$this->fetchInvoiceAmounts();
		$this->calculateBankAndRateExpenses();

		// 2440 Leverantörsskulder
		$transaction = new Transaction($verification);
		$transaction->account_id = 2440;
		$transaction->debit = $this->invoice_sek;
		$verification->transactions[] = $transaction;

		// 2499 Andra övriga kortfristiga skulder
		$transaction = new Transaction($verification);
		$transaction->account_id = 2449;
		$transaction->credit = $this->payed;
		$verification->transactions[] = $transaction;

		// Different currency, do other things
		if ($this->currency != 'SEK') {
			// 6570 Bankutgifter
			$transaction = new Transaction($verification);
			$transaction->account_id = 6570;
			$transaction->debit = $this->bank_expenses;
			$verification->transactions[] = $transaction;

			// 7960 Valutaförluster / 3960 Valutavinster
			if ($this->currency_gain_loss != 0) {
				$loss = $this->currency_gain_loss < 0;
				$transaction = new Transaction($verification);
				$transaction->account_id = $loss ? 7960 : 3960;
				if ($loss) {
					$transaction->debit = -$this->currency_gain_loss;
				} else {
					$transaction->credit = $this->currency_gain_loss;
				}
				$verification->transactions[] = $transaction;
			}
		}
	}

	private function fetchInvoiceAmounts() {
		// Get 2440 Leverantörsskulder from invoice
		$transactionModel = new TransactionModel();
		$invoice_sek_row = $transactionModel->
			where('verification_id', $this->verification->invoice_id)->
			where('account_id', 2440)->
			first();

		// Get amount
		if ($invoice_sek_row !== null) {
			$this->invoice_sek = $invoice_sek_row->credit;
			$this->invoice_exchange_rate = $invoice_sek_row->exchange_rate;
		}
		// Just return this verification payed amount
		else {
			$this->invoice_sek = $this->payed;
			$this->invoice_exchange_rate = 1;
		}
	}

	private function calculateBankAndRateExpenses() {
		$this->currency_gain_loss = round(($this->invoice_exchange_rate - $this->exchange_rate) * $this->verification->total, 2);

		$this->bank_expenses = $this->payed - $this->invoice_sek + $this->currency_gain_loss;
	}
}
