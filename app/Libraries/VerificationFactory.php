<?php namespace App\Libraries;

use App\Entities\Transaction;
use App\Entities\Verification;
use App\Models\AccountModel;
use App\Models\TransactionModel;
use App\Models\VerificationModel;
use Config\Services;

const VALID_PROPERTIES = [
	'date' => true,
	'type' => true,
	'name' => true,
	'file' => true,
	'internal_name' => true,
	'invoice_name' => true,
	'invoice_amount' => true,
	'payed_in_sek' => true,
	'currency' => true,
	'account_from' => true,
	'account_to' => true,
	'require_confirmation' => true
];

class VerificationFactory {
	private $properties = [];
	private $exchange_rate = 1;
	private $invoice_sek = null;
	private $invoice_exchange_rate = 1;
	private $currency_gain_loss = 0;
	private $bank_expenses = 0;
	private $vat_code = null;

	public function __construct($data = null)	{
		if ($data) {
			$this->properties = $data;
		}
		if (!isset($this->transactions)) {
			$this->properties['transactions'] = [];
		}
	}

	public function __get($propertyName) {
		return $this->properties[$propertyName];
	}

	public function __isset(string $key) {
		return isset($this->properties[$key]);
	}

	public function setDate($date) {
		$this->properties['date'] = $date;
		return $this;
	}

	public function setType($type) {
		$this->properties['type'] = $type;
		return $this;
	}

	public function setName($name) {
		$this->properties['name'] = $name;
		return $this;
	}

	public function setFile($file) {
		$this->properties['file'] = $file;
		return $this;
	}

	public function setInternalName($internal_name) {
		$this->properties['internal_name'] = $internal_name;
		return $this;
	}

	public function setInvoiceName($invoice_name) {
		$this->properties['invoice_name'] = $invoice_name;
		return $this;
	}

	public function setInvoiceAmount($invoice_amount) {
		$this->properties['invoice_amount'] = $invoice_amount;
		if (!isset($this->amount)) {
			$this->setAmount($invoice_amount);
		}
		return $this;
	}

	public function setAmount($amount) {
		$this->properties['amount'] = $amount;
		return $this;
	}

	public function setPayedInSek($payed_in_sek) {
		$this->properties['payed_in_sek'] = $payed_in_sek;
		return $this;
	}

	public function setCurrency($currency) {
		$this->properties['currency'] = $currency;
		return $this;
	}

	public function setAccountFrom($account_from) {
		$this->properties['account_from'] = $account_from;
		return $this;
	}

	public function setAccountTo($account_to) {
		$this->properties['account_to'] = $account_to;
		return $this;
	}

	public function setRequireConfirmation($require_confirmation) {
		$this->properties['require_confirmation'] = $require_confirmation;
		return $this;
	}

	/**
	 * Add a manual transaction. Only works if type of the transaction is set
	 * to {Verification::TRANSACTION}.
	 * @param int $account_id 
	 * @param float $amount 
	 * @param string $currency 
	 * @return void 
	 */
	public function addTransaction(int $account_id, float $amount, $currency = 'SEK') {
		$this->transactions[] = [
			'account_id' => $account_id,
			'amount' => $amount,
			'currency' => $currency
		];
	}

	private function validate() {
		// TODO
	}

	private static function validateTransactionSum(&$verification) {
		$sum = 0;
			foreach ($verification->transactions as $transaction) {
				$sum += $transaction->amount;
			}
			
			if (round($sum, 4) != 0) {
				throw new RuntimeException("Transactions doesn't sum to 0. Sum: $sum");
			}
	}

	private function calculateAmountFromTransactions() {
		$minAmount = 0;
		$maxAmount = 0;
		foreach ($this->properties['transactions'] as $transaction) {
			$amount = $transaction['amount'];
			
			$minAmount = min($minAmount, $amount);
			$maxAmount = max($maxAmount, $amount);
		}

		$minAmount *= -1;
		return max($minAmount, $minAmount);
	}

	public function create() {
		$this->validate();

		$verification = new Verification();
		$verification->user_id = Services::auth()->getUserId();
		$verification->date = $this->date;
		$verification->name = $this->name;
		$verification->internal_name = $this->internal_name;

		// Total amount
		if (!isset($this->amount)) {
			$this->setAmount($this->calculateAmountFromTransactions());
		}
		$verification->total = $this->amount;
		
		if (isset($this->setRequireConfirmation)) {
			$verification->require_confirmation = $this->require_confirmation ? 1 : 0;
		}

		if (isset($this->currency) && $this->currency != 'SEK') {
			helper('currency');
			$this->exchange_rate = exchangeRateToSek($this->currency, $this->date);
		}
		$this->createTransactions($verification);
		static::validateTransactionSum($verification);
		return $verification;
	}

	private function getConvertedTotal() {
		return round($this->invoice_amount * $this->exchange_rate, 2);
	}

	private function findAndBindInvoiceId($verification) {
		$verificationModel = new VerificationModel();

		$invoiceVerification = $verificationModel->
			where('user_id', $verification->user_id)->
			where('type', Verification::TYPE_INVOICE_IN)->
			where('total', $verification->total)->
			where('internal_name', $this->invoice_name)->
			where("date < '" . $this->date . "'")->
			orderBy('date', 'DESC')->
			first();

		// Found
		if ($invoiceVerification !== null) {
			$verification->invoice_id = $invoiceVerification->id;
		} else {
			$verification->require_confirmation = 1;
		}
	}

	private function fetchInvoiceAmounts($verification) {
		// Get 2440 Leverantörsskulder from invoice
		$transactionModel = new TransactionModel();
		$invoice_sek_row = $transactionModel->
			where('verification_id', $verification->invoice_id)->
			where('account_id', 2440)->
			first();

		// Get amount
		if ($invoice_sek_row !== null) {
			$this->invoice_sek = $invoice_sek_row->credit;
			$this->invoice_exchange_rate = $invoice_sek_row->exchange_rate;
		}
		// Just return this verification payed amount
		else {
			$this->invoice_sek = $this->invoice_amount;
			$this->invoice_exchange_rate = 1;
		}
	}

	private function calculateBankAndRateExpenses() {
		$this->currency_gain_loss = round(($this->invoice_exchange_rate - $this->exchange_rate) * $this->invoice_amount, 2);

		$this->bank_expenses = round($this->payed_in_sek - $this->invoice_sek + $this->currency_gain_loss, 2);
	}

	private function setDefaults() {
		// INVOICE_IN
		if ($this->type == Verification::TYPE_INVOICE_IN) {
			$this->setPayedInSek($this->getConvertedTotal());
			$this->setAccountFrom(2440);

			// Get VAT code from the 'to' account
			$accountModel = new AccountModel();
			$account = $accountModel->find($this->account_to);
			$this->vat_code = $account->vat_code;
		}
		// INVOICE_IN_PAYMENT
		elseif($this->type == Verification::TYPE_INVOICE_IN_PAYMENT) {
			$this->setAccountTo(2440);
		}
	}

	private function createTransactions($verification) {
		if ($this->type == Verification::TYPE_TRANSACTION) {
			$this->createManualTransactions($verification);
		} else {
			$this->createAutomaticTransactions($verification);
		}
	}

	private function createManualTransactions($verification) {
		foreach ($this->transactions as $data) {
			$transaction = new Transaction($verification);
			$transaction->fill($data);
			$verification->transactions[] = $transaction;
		}
	}

	private function createAutomaticTransactions($verification) {
		$this->setDefaults();

		$account_to_payed = $this->payed_in_sek;
		$account_to_exchange_rate = $this->exchange_rate;

		// TODO INVOICE_IN -> SEK VAT

		// INVOICE_IN
		if ($this->type == Verification::TYPE_INVOICE_IN) {
			// Reverse VAT
			if ($this->vat_code == 21 || $this->vat_code == 22) {
				// 2614 Utgående moms utl.
				$transaction = new Transaction($verification);
				$transaction->account_id = 2614;
				$transaction->credit = $this->payed_in_sek * 0.25;
				$verification->transactions[] = $transaction;

				// 2645 Ingående moms utl.
				$transaction = new Transaction($verification);
				$transaction->account_id = 2645;
				$transaction->debit = $this->payed_in_sek * 0.25;
				$verification->transactions[] = $transaction;
			}
		}
		// INVOICE_IN_PAYMENT -> Exchange rate win/loss + bank expenses
		elseif ($this->type == Verification::TYPE_INVOICE_IN_PAYMENT) {
			$this->findAndBindInvoiceId($verification);
		  if ($this->currency !== 'SEK') {
				$this->fetchInvoiceAmounts($verification);
				$this->calculateBankAndRateExpenses();
				
				if ($this->invoice_sek) {
					$account_to_payed = $this->invoice_sek;
					$account_to_exchange_rate = $this->invoice_exchange_rate;
				}

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

		// From account
		$transaction = new Transaction($verification);
		$transaction->account_id = $this->account_from;
		$transaction->exchange_rate = $this->exchange_rate;
		$transaction->credit = $this->payed_in_sek;
		$transaction->original_amount = $this->invoice_amount;
		$transaction->currency = $this->currency;
		$verification->transactions[] = $transaction;

		// To account
		$transaction = new Transaction($verification);
		$transaction->account_id = $this->account_to;
		$transaction->exchange_rate = $account_to_exchange_rate;
		$transaction->debit = $account_to_payed;
		$transaction->original_amount = $this->invoice_amount;
		$transaction->currency = $this->currency;
		$verification->transactions[] = $transaction;
	}
}