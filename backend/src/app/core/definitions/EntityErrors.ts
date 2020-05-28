export enum EntityErrors {
	idIsEmpty = 'id-is-empty',
	dateCreatedTooEarly = 'date-created-too-early',
	dateCreatedInTheFuture = 'date-created-in-the-future',
	dateModifiedRequiresDateCreated = 'date-modified-requires-date-created',
	dateModifiedInTheFuture = 'date-modified-in-the-future',
	dateModifiedBeforeCreated = 'date-modified-before-created',
	dateDeletedNotSameAsModified = 'date-deleted-not-same-as-modified',
	dateDeletedRequiresDateModified = 'date-deleted-requires-date-modified',
}
