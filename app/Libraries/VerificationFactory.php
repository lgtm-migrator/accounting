<?php namespace App\Libraries;

use App\Entities\Transaction;
use App\Entities\Verification;
use App\Models\AccountModel;
use App\Models\TransactionModel;
use App\Models\VerificationModel;
use Config\Services;
use RuntimeException;

const VALID_PROPERTIES = [
	'date' => true,
	'type' => true,
	'name' => true,
	'internal_name' => true,
	'invoice_name' => true,
	'invoice_amount' => true,
	'amount' => true,
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
	private $vat_code = null;

	public function __construct($data = null)	{
		if ($data) {
			$this->properties = $data;

			// Set correct amounts
			if (
				(isset($this->payed_in_sek) && $this->payed_in_sek == '') || 
				(isset($this->type) && $this->type == Verification::TYPE_INVOICE_IN)
			) {
				unset($this->properties['payed_in_sek']);
			}
			if (isset($this->invoice_amount)) {
				$this->setInvoiceAmount(floatval($this->invoice_amount));
			}
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
		if (!isset($this->payed_in_sek)) {
			$this->setPayedInSek($amount);
		}
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
		$this->properties['transactions'][] = [
			'account_id' => $account_id,
			'amount' => $amount,
			'currency' => $currency
		];
		return $this;
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

		// log_message('debug', "create() Properties:\n" . var_export($this->properties, true));

		$verification = new Verification();
		$verification->user_id = Services::auth()->getUserId();
		$verification->type = $this->type;
		$verification->date = $this->date;
		$verification->name = $this->name;
		$verification->internal_name = $this->internal_name;

		// Total amount
		if (!isset($this->amount)) {
			$this->setAmount($this->calculateAmountFromTransactions());
		}
		$verification->total = $this->amount;
		$verification->total_sek = $this->payed_in_sek;
		
		if (isset($this->setRequireConfirmation)) {
			$verification->require_confirmation = $this->require_confirmation ? 1 : 0;
		}

		if (isset($this->currency) && $this->currency != 'SEK') {
			helper('currency');
			$this->exchange_rate = exchangeRateToSek($this->currency, $this->date);

			// Only set payed in sek if we didn't set it already
			if ($this->payed_in_sek == $this->amount) {
				// log_message('debug', "creat() Setting payed_in_sek");
				$this->setPayedInSek($this->exchange_rate * $this->amount);
				$verification->total_sek = $this->payed_in_sek;
			}
			// log_message('debug', "create() Properties:\n" . var_export($this->properties, true));
			// log_message('debug', "create() Verification:\n" . var_export($verification, true));
		}

		$this->createTransactions($verification);
		static::validateTransactionSum($verification);
		return $verification;
	}

	private function getConvertedTotal() {
		return round($this->invoice_amount * $this->exchange_rate, 2);
	}

	private function findAndBindInvoiceId(Verification $payment) {
		$verificationModel = new VerificationModel();

		$earliest_date = date_create("$this->date -1 month")->format('Y-m-d');

		$invoiceVerification = $verificationModel->
			where('user_id', $payment->user_id)->
			where('type', Verification::TYPE_INVOICE_IN)->
			where('total', $payment->total)->
			where("date <= '$this->date'")->
			where("date >= '$earliest_date'")->
			orderBy('date', 'DESC')->
			first();

		// Found
		if ($invoiceVerification !== null) {
			$payment->invoice_id = $invoiceVerification->id;
		} else {
			$payment->require_confirmation = 1;
		}
	}

	private static function findPaymentForInvoice(Verification $invoice) {
		$verificationModel = new VerificationModel();

		$latest_date = date_create("$invoice->date +1 month")->format('Y-m-d');

		$payment = $verificationModel
			->where('user_id', $invoice->user_id)
			->where('type', Verification::TYPE_INVOICE_IN_PAYMENT)
			->where('total', $invoice->total)
			->where("date >= '$invoice->date'")
			->where("date <= '$latest_date'")
			->orderBy('date', 'ASC')
			->first();

		// Fetch payment transactions
		if ($payment) {
			$transactionModel = new TransactionModel();
			$payment->transactions = $transactionModel->getByVerificationId($payment->id);
		}

		return $payment;
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
			$this->invoice_sek = abs($invoice_sek_row->amount);
			$this->invoice_exchange_rate = $invoice_sek_row->exchange_rate;
		}
		// Just return this verification payed amount
		else {
			$this->invoice_sek = $this->invoice_amount;
			$this->invoice_exchange_rate = 1;
		}
	}

	private static function calculateCurrencyGainLoss($invoice_exchange_rate, $payment_exchange_rate, $amount) {
		return round(($payment_exchange_rate - $invoice_exchange_rate) * $amount, 2);
	}

	private static function createBankExpensesTransaction($verification, $invoice_amount, $payment_amount, $currency_gain_loss) {
		$amount = round($payment_amount - $invoice_amount - $currency_gain_loss, 2);
		
		if ($amount == 0) {
			return null;
		}

		$transaction = new Transaction($verification);
		$transaction->account_id = 6570;
		$transaction->amount = $amount;
		return $transaction;
	}

	private static function createGainLossTransaction($verification, $currency_gain_loss) {
		$loss = $currency_gain_loss > 0;
		$transaction = new Transaction($verification);
		$transaction->account_id = $loss ? 7960 : 3960;
		$transaction->amount = $currency_gain_loss;
		return $transaction;
	}

	private function setDefaults() {
		// INVOICE_IN
		if ($this->type == Verification::TYPE_INVOICE_IN) {
			$this->setPayedInSek($this->getConvertedTotal());
			$this->setAccountFrom(2440);
		}
		// INVOICE_IN_PAYMENT
		elseif($this->type == Verification::TYPE_INVOICE_IN_PAYMENT) {
			$this->setAccountTo(2440);
		}

		// Get VAT code from the 'to' account
		$accountModel = new AccountModel();
		$account = $accountModel->find($this->account_to);
		$this->vat_code = $account->vat_code;
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

		// INVOICE_IN
		if ($this->type == Verification::TYPE_INVOICE_IN) {
			// Add Swedish VAT 25%
			if ($this->vat_code == 1025) {
				$account_to_payed = round($this->payed_in_sek / 1.25, 2);
				$vat_amount = $this->payed_in_sek - $account_to_payed;

				// 2640 Ingåenge moms
				$transaction = new Transaction($verification);
				$transaction->account_id = 2640;
				$transaction->debit = $vat_amount;
				$verification->transactions[] = $transaction;
			}
			// Reverse VAT
			elseif ($this->vat_code == 21 || $this->vat_code == 22) {
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
		  if (isset($verification->invoice_id) && $this->currency !== 'SEK') {
				$this->fetchInvoiceAmounts($verification);
				$currency_gain_loss = static::calculateCurrencyGainLoss($this->invoice_exchange_rate, $this->exchange_rate, $this->invoice_amount);

				if ($this->invoice_sek) {
					$account_to_payed = $this->invoice_sek;
					$account_to_exchange_rate = $this->invoice_exchange_rate;
				}

				// 6570 Bankutgifter
				$transaction = static::createBankExpensesTransaction(
					$verification,
					$this->invoice_sek,
					$this->payed_in_sek,
					$currency_gain_loss
				);
				if ($transaction) {
					$verification->transactions[] = $transaction;
				}

				// 7960 Valutaförluster / 3960 Valutavinster
				if ($currency_gain_loss != 0) {
					$verification->transactions[] = static::createGainLossTransaction(
						$verification,
						$currency_gain_loss
					);
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

	public static function updatePaymentInfoFromInvoice(Verification $invoice) {
		$payment = static::findPaymentForInvoice($invoice);

		// No payment found
		if (!$payment) {
			return;
		}

		// Bind payment to invoice
		$payment->invoice_id = $invoice->id;
		$payment->require_confirmation = 0;
		
		// Add bank expenses and currency exchange loss/win
		if ($invoice->total != $invoice->total_in_sek) {
			$transactionModel = new TransactionModel();
			$invoice_sek = $invoice->total_sek;
			$payment_sek = $payment->total_sek;

			// Get info from invoice
			$invoice_exchange_rate = 0;
			foreach ($invoice->transactions as $transaction) {
				if ($transaction->account_id == 2440) {
					$invoice_exchange_rate = $transaction->exchange_rate;
					break;
				}
			}

			// Get info from payment
			$payment_exchange_rate = 0;
			foreach($payment->transactions as $transaction) {
				if ($transaction->account_id == 2440) {
					$payment_exchange_rate = $transaction->exchange_rate;

					// Update 2440 and set the amount to the invoice
					$transaction->amount = $invoice_sek;
					$transaction->exchange_rate = $invoice_exchange_rate;

					
					$transactionModel->save($transaction);
				}
			}

			$currency_gain_loss = static::calculateCurrencyGainLoss(
				$invoice_exchange_rate,
				$payment_exchange_rate,
				$invoice->total
			);
			
			// 6570 Bankutgifter
			$transaction = static::createBankExpensesTransaction(
				$payment,
				$invoice_sek,
				$payment_sek,
				$currency_gain_loss
			);
			if ($transaction) {
				$transactionModel->save($transaction);
			}

			// 7960 Valutaförluster / 3960 Valutavinster
			if ($currency_gain_loss != 0) {
				$transaction = static::createGainLossTransaction(
					$payment,
					$currency_gain_loss
				);
				$transactionModel->save($transaction);
			}
		}

		// Save payment
		$VerificationModel = new VerificationModel();
		$VerificationModel->save($payment);
	}
}