<?php namespace App\Controllers;

use App\Models\AccountModel;
use App\Models\TransactionModel;
use App\Models\VerificationModel;
use stdClass;

class Sie extends ApiController {
	public function export() {
		$verifications = $this->getVerifications();


		$sie = $this->readPrefix();
		$sie .= $this->createOutAmounts($verifications);
		$sie .= $this->createSieVerifications($verifications);

		$this->saveSie($sie);

		$sie = $this->prettify($sie);
		return $this->response->
			setStatusCode(200)->
			setBody($sie)->
			setHeader('Content-Type', 'text/html');
	}

	private function createSieVerifications($verifications) {
		$sie = '';

		$verificationNumber = 1;
		foreach ($verifications as $verification) {
			// Verification number
			$verSie = '#VER A ' . $verificationNumber . ' ';

			// Date
			$verSie .= str_replace('-', '', $verification->date) . ' ';

			// Name
			$verSie .= '"' . $verification->name . '" ';

			// Filed date
			$verSie .= $this->calculateFiledDate($verification->date) . "\n";

			// Transactions
			$transactionsSie = '';
			foreach ($verification->transactions as $transaction) {
				$transactionSie = '#TRANS ';
				$added = false;
				$removed = false;
				// Removed
				if ($transaction->deleted) {
					$transactionSie = '#BTRANS ';
					$removed = true;
				}
				// Added
				else if ($transaction->date != $verification->date) {
					$transactionSie = '#RTRANS ';
					$added = true;
				}

				// Account number
				$transactionSie .= $transaction->account_id;

				// Extra
				$transactionSie .= ' {} ';

				// Amount
				$transactionSie .= $transaction->amount;

				// Added or removed
				if ($added || $removed) {
					if ($removed) {
						$modifiedDate = $transaction->deleted;
					} else {
						$modifiedDate = $transaction->date;
					}
					$modifiedDate = str_replace('-', '', $modifiedDate);

					$transactionSie .= " $modifiedDate \"\" \"\" \"Matteus Magnusson\"";
				}

				// Append to Verification SIE
				$transactionsSie .= $transactionSie . "\n";
			}
			$verSie .= "{\n" . $transactionsSie . "}\n";

			// Append to SIE
			$sie .= $verSie;

			$verificationNumber++;
		}

		return $sie;
	}

	private function calculateFiledDate($date) {
		[$year, $month, $day] = explode('-', $date);

		$month += 1;
		if ($month === 13) {
			$month = 1;
			$year += 1;
		}

		return $year . str_pad($month, 2, '0', STR_PAD_LEFT) . '01';
	}

	private function getVerifications() {
		$verificationModel = new VerificationModel();
		$transactionModel = new TransactionModel();
		$accountModel = new AccountModel();

		$userId = \Config\Services::auth()->getUserId();
		if ($userId === null) {
			return $this->fail('Failed to get user');
		}

		$verifications = $verificationModel->getAll($userId, 1);


		// Get all transactions
		foreach ($verifications as $verification) {
			$verification->transactions = $transactionModel->getByVerificationId($verification->id);

			// Get all account names for the transactions
			foreach ($verification->transactions as $transaction) {
				$account = $accountModel->find($transaction->account_id);

				if ($account) {
					$transaction->account_name = $account->name;
				}
			}
		}

		return $verifications;
	}

	private function createOutAmounts($verifications) {
		$sie = '';

		$result = 0;

		$funds = 0;
		$debts = 0;

		$amounts = $this->calculateAmounts($verifications);

		foreach ($amounts as $accountNumber => $amount) {
			$amount = round($amount, 2);
			$amount = number_format($amount, 2, '.', '');
			if ($amount != 0) {
				// Out
				if ($accountNumber < 3000) {
					$sie .= '#UB 0 ';

					// Funds
					if ($accountNumber < 2000) {
						$funds += $amount;
					}
					// Debts
					else {
						$debts += $amount;
					}
				}
				// Result
				else {
					$sie .= '#RES 0 ';

					if (3000 <= $accountNumber && $accountNumber < 4000) {
						$result -= $amount;
					} else {
						$result -= $amount;
					}
				}

				$sie .= $accountNumber . ' ' . $amount . "\n";
			}
		}

		$diffFundDebts = round($funds + $debts, 2);
		if ($diffFundDebts != 0) {
			$sie .= '#FUNDS ' . $funds . "\n";
			$sie .= '#DEBTS ' . $debts . "\n";
			$sie .= '#FUNDSDIFF ' . $diffFundDebts . "\n";
		}

		$result = round($result, 2);
		if ($result != 0) {
			$sie .= '#ENDRESULT ' . $result . "\n";
		}

		return $sie;
	}

	private function calculateAmounts($verifications) {
		$amounts = $this->getStartingAmounts();

		foreach ($verifications as $verification) {
			foreach ($verification->transactions as $transaction) {
				if (!$transaction->deleted) {
					$accountNumber = $transaction->account_id;

					// Set amount as 0 by default (if amounts doesn't exist)
					if (!array_key_exists($accountNumber, $amounts)) {
						$amounts[$accountNumber] = 0;
					}

					$amounts[$accountNumber] += $transaction->amount;
				}
			}
		}

		ksort($amounts);

		return $amounts;
	}

	private function getStartingAmounts() {
		$amounts = [
			1510 => 490.00,
			1630 => 933.00,
			1650 => 1374.80,
			1920 => 23385.00,
			1940 => 144.24,
			1944 => 65.13,
			2081 => -50000.00,
			2091 => 262800.91,
			2093 => -293245.16,
			2099 => 51433.18,
			2440 => -108.95,
			2499 => -286.15,
			2518 => 3014.00,
		];

		return $amounts;
	}

	public function old() {
		$sie = file_get_contents(WRITEPATH . 'sie-2018.se');
		$sie = $this->prettify($sie);
		return $this->response->
			setStatusCode(200)->
			setBody($sie)->
			setHeader('Content-Type', 'text/html');
	}

	private function readPrefix() {
		$filename = WRITEPATH . 'sie-prefix.se';
		return file_get_contents($filename);
	}

	private function saveSie($sieContent) {
		$filename = WRITEPATH . 'exported.se';
		file_put_contents($filename, $sieContent);
	}

	private function prettify($sieContent) {
		$search = array();
		$replace = array();

		// Code
		$search[] = '/(#\w+ )/';
		$replace[] = '<span style="color: #ba68c8;">$1</span> ';

		// Date numbers
		$search[] = '/(?<= )(20\d{6})(?=[ \n])/';
		$replace[] = ' <span style="color: #66bb6a;">$1</span>';

		// Numbers
		$search[] = '/( -?[\d\.]+)/';
		$replace[] = ' <span style="color: #d4e157;">$1</span>';

		// Strings
		$search[] = '/( "[\w\dåäöÅÄÖ\(\)-\/ %\>]+")/';
		$replace[] = ' <span style="color: #f4511e;">$1</span> ';

		// Replace
		$sieContent = preg_replace($search, $replace, $sieContent);

		// Newline
		$sieContent = str_replace("\n", "\n<br />", $sieContent);

		// Wrap in body
		$sieContent = '<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body style="font-family: Courier New; color: #fafafa; background-color: #212121; marging: 20px;">' . $sieContent . '</body></html>';
		// $sieContent = '<body style="font-family: Courier New; color: #fafafa; background-color: #212121; marging: 20px;">' . $sieContent . '</body>';

		return $sieContent;
	}

	public function ledger() {
		$ledger = $this->calculateLedger();
		$text = $this->ledgerToText($ledger);

		return $this->response->
			setStatusCode(200)->
			setBody($text)->
			setHeader('Content-Type', 'text/html');
	}

	private function calculateLedger() {
		$ledger = array();

		// Add starting amounts
		$startingAmounts = $this->getStartingAmounts();

		foreach ($startingAmounts as $accountNumber => $amount) {
			$this->appendToLedger($ledger, $accountNumber, '20190101', 'Starting balance', $amount, false);
		}

		// Add verifications
		$verifications = $this->getVerifications();

		foreach ($verifications as $verification) {
			$date = str_replace('-', '', $verification->date);

			foreach ($verification->transactions as $transaction) {
				$deleted = !!$transaction->deleted;
				$this->appendToLedger($ledger, $transaction->account_id, $date, $verification->name, $transaction->amount, $deleted);
			}
		}

		ksort($ledger);

		return $ledger;
	}

	private function appendToLedger(&$ledger, int $accountNumber, string $date, string $name, float $amount, bool $deleted) {
		// Create arrays
		if (!array_key_exists($accountNumber, $ledger)) {
			$ledger[$accountNumber] = array();
		}

		if (!array_key_exists($date, $ledger[$accountNumber])) {
			$ledger[$accountNumber][$date] = array();
		}

		// Add data
		$row = new stdClass();
		$row->name = $name;
		$row->amount = $amount;
		$row->deleted = $deleted;
		$ledger[$accountNumber][$date][] = $row;
	}

	private function ledgerToText(&$ledger) {
		$text = '';

		foreach ($ledger as $accountNumber => $dates) {
			$total = 0;
			$text .= "<h2>$accountNumber</h2><table>";

			foreach ($dates as $date => $rows) {
				foreach ($rows as $transaction) {
					$extraStyle = '';
					if ($transaction->deleted) {
						$extraStyle = 'text-decoration: line-through;';
					}

					$text .= "<tr style=\"$extraStyle\">";
					// Date
					$dateElement = "<td style=\"color: #ccc; $extraStyle\">$date</td>";

					// Previous amount
					$prevElement = number_format($total, 2);
					$color = $total >= 0 ? ($total == 0 ? "#fff59d": "#00e676") : "#ff5252";
					$prevElement = "<td style=\"color: $color; width: 120px; text-align: right;\">$prevElement</td>";

					// Amount
					$amount = $transaction->amount;
					$color = $amount >= 0 ? ($amount == 0 ? "#fff59d": "#00e676") : "#ff5252";
					$amountElement = number_format($amount, 2);
					$amountElement = "<td style=\"color: $color; width: 120px; text-align: right; font-weight: bold;\">$amountElement</td>";

					// Total
					if (!$transaction->deleted) {
						$total += $amount;
					}
					$color = $total >= -0.0001 ? ($total <= 0.0001 ? "#fff59d": "#00e676") : "#ff5252";
					$totalElement = number_format($total, 2);
					$totalElement = "<td style=\"color: $color; width: 120px; text-align: right;\">$totalElement</td>";

					// Name
					$nameElement = "<td style=\"color: #ea80fc; padding-left: 20px;\">$transaction->name</td>";

					$text .= "$dateElement $prevElement $amountElement $totalElement $nameElement";
					$text .= "</tr>";
				}
			}
			$text .= "</table>";
		}

		$text = '<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body style="font-family: Courier New; color: #fafafa; background-color: #212121; marging: 20px;">' . $text . '</body></html>';

		return $text;
	}
}
