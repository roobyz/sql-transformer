# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Types of changes

- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.


## [0.0.7] - 2022-03-01
### Fixed
- add check for undefined type on create or replace table statement


## [0.0.6] - 2022-02-28
### Changed
- typo on extension name

## [0.0.5] - 2022-02-28
### Fixed
- removed unused keyword (DISTINCT), which introduced a formatting bug

### Updated
- added DISTINCT to our sample.sql for testing
- added additional queries to sample.sql for testing

## [0.0.4] - 2022-02-28
### Fixed
- command pallet title to "SQL Transformer: Format SQL"

## [0.0.3] - 2022-02-27
### Added
- minimum viable product (MVP)
- includes
   - support for common table expressions (CTEs)
   - support for inline queries
   - basic support for create tables 
