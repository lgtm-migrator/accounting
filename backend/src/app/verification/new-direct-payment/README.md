# VerificationNewDirectPayment use case

Create a valid new verification from a direct payment scenario (either IN or OUT).

By direct payment we don't mean an invoice and then a payment. Rather that the invoice and payment
occured at the same time.

## Input Data

- Verification information
	- Date
	- How much was payed
	- VAT percentage
	- _Currency (optional)_ 
	- _PDFs (optional)_
- An id of the user that wants to create this verification

## Output Data

- A valid verification with all transactions (without IDs). The verifications are only created and not saved.

## Primary Course

1. Convert the input to an internal data entity.
1. Create the verification including transactions
1. Check so that the verifications are valid
	- Including account number exists
1. Return the valid verification

## Exception Cases

- Invalid input data
