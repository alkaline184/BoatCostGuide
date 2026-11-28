# Marine catalog publication

The 79 verified variants are eligible for local research review. Publication requires a recorded commercial display, retention and indexable-use determination for every source included in a snapshot. An editor confirms US model year, exact trim, specification and price meaning, source date, and source attribution. Image permission is separate.

The database stores `discovered`, `extracted`, `pending_review`, `verified`, `approved`, `published`, `rejected` and `archived` states. A trusted maintainer records the source decisions, previews an exact proposed snapshot, and commits the selected batch with a named reviewer and owner-authorized approval basis. PostgreSQL retains the exact reviewed candidate and date separately from the public snapshot.

Changed candidates require fresh review. Expired or revoked rights, incomplete identity sources and unpublished states hide the record from public results. The database import preserves observation history and creates private review items. Both public roles read a restricted projection and execute bounded read functions. The app uses uncached live reads for model pages and the sitemap. See [catalog operations](CATALOG-OPERATIONS.md).
