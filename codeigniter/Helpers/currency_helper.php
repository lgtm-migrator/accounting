<?php

function currencyToSek($currency, $amount, $date) {
	$rate = exchangeRateToSek($currency, $date);

	if ($rate !== false) {
		return round($amount * $rate, 6);
	}

	return FALSE;
}

function exchangeRateToSek($currency, $date) {
	$url = "http://data.fixer.io/api/$date?symbols=$currency,SEK&access_key=" . env('FIXER_IO_KEY');
	$curl = file_get_contents($url);

	if ($curl !== FALSE) {
		$json = json_decode($curl, true);

		$from = $json['rates'][$currency];
		$to = $json['rates']['SEK'];

		return $to / $from;
	}

	return FALSE;
}
