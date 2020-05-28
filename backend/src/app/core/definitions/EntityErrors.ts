export enum EntityErrors {
	idIsEmpty = 'id-is-empty',
	dateCreatedTooEarly = 'date-created-too-early',
	dateCreatedInTheFuture = 'date-created-in-the-future',
	dateModifiedRequiresDateCreated = 'date-modified-requires-date-created',
	dateModifiedInTheFuture = 'date-modified-in-the-future',
	dateModifiedBeforeCreated = 'date-modified-before-created',
	dateDeletedNotSameAsModified = 'date-deleted-not-same-as-modified',
	dateDeletedRequiresDateModified = 'date-deleted-requires-date-modified',
	accountNumberOutOfRange = 'account-number-out-of-range',
	accountNumberInvalidFormat = 'account-number-invalid-format',
	amountOriginalIsZero = 'amount-original-is-zero',
	currencyCodeInvalid = 'currency-code-invalid',
	currencyCodeNotSet = 'currency-code-not-set',
	exchangeRateNotSet = 'exchange-rate-not-set',
	exchangeRateNegativeOrZero = 'exchange-rate-negative-or-zero',
}
