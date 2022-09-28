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

## [0.3.14] - 2022-09-28

### Fixed

- Formatting for BETWEEN blocks with inline queries
- Debug log error

## [0.3.13] - 2022-09-13

### Fixed

- Account for casted case blocks
- Correct ELSE spacing

## [0.3.12] - 2022-09-11

### Changed

- Add WITHIN GROUP keyword
- Add PARTITION BY keyword

## [0.3.11] - 2022-09-11

### Fixed

- correct minimum margin bug

## [0.3.10] - 2022-06-05

### Fixed

- correct spacing for CASE statements within a GROUP BY block

## [0.3.9] - 2022-04-07

### Changed

- add keywords UPDATE and SET
- update formatting for new keywords

## [0.3.8] - 2022-04-07

### Changed

- rename logo.png to icon.png

## [0.3.7] - 2022-04-07

### Changed

- add logo.png

## [0.3.6] - 2022-03-23

### Changed

- adjust margins on BY stack
- further cleanup with trimLines function

## [0.3.5] - 2022-03-22

### Changed

- simplify COMMENT margin code for clarity
- adjust COMMENT margins for WITH blocks
- cleanup switch-case logic
- cleanup spacing with new trimLines function

## [0.3.4] - 2022-03-21

### Changed

- additional margin adjustments due to startingWidth
- stack cleanup
- regex tweak
- additional comments

## [0.3.3] - 2022-03-20

### Added

- setting to include/exclude OUTCOME comments on CTE queries
- setting to include/exclude WHERE 1=1 filters
- new function peekMargin to return the current stack margin value.

### Changed

- account for badly formed block comments
- simplify regex
- refactor format function parameters
- refactor setStack and setMargin calls to account for user-setting (startingWidth)
- adjust default startingWidth to 5

### Fixed

- close out query blocks that end immediately after a comment

## [0.3.2] - 2022-03-19

This release is ready for broad use on most SQL. With a focus on reproducible outcomes, executing the transformer should now result in identical output for multiple runs of the same SQL Code. This has been tested with SQL that ranges from tens of lines to thousands of lines of SQL containing complex CTE and inline logic. Feedback welcomed!

### Added

- Process multi-line comments into multiple single-line comments
- Correctly handle dash or slash comments within block comments
- Add VSCode default settings to configure output
  - blockComments: boolean for specifying block or line comments
  - startingWidth: integer for specifying starting select margin

### Changed

- Modified formatter parameters with new settings variables
- Updated output to consider blockComments for comment style
- Added preliminary startingWidth to formatter

## [0.3.1] - 2022-03-18

### Changed

- Adjust ELSE/END margins in CASE blocks
- Adjust FROM margin after COMMENT

### Fixed

- Resolve known issue: comments at end of a line
- Address words with apostrophes in comment blocks

## [0.2.11] - 2022-03-17

### Changed

- Updated README with known issue

## [0.2.10] - 2022-03-16

### Changed

- Implement setMargin function to make code more DRY and readable
- Adjust formatting for cast function
- Adjust FROM formatting for NON-ANSI SQL joins
- Adjust formatting for WHERE/CASE/BETWEEN blocks

## [0.2.9] - 2022-03-14

### Fixed

- Formatting for WHERE block

## [0.2.8] - 2022-03-14

### Changed

- Adjust formatting for OR and AND keywords in a WHERE block

## [0.2.7] - 2022-03-14

### Fixed

- Ensure that WITH keywords stay keywords

## [0.2.6] - 2022-03-13

### Changed

- Tweak COMMENT margins for ON blocks
- Refactor for clarity
- Remove extra spacing
- Adjust margins for comparisons with comments in between

## [0.2.5] - 2022-03-12

### Changed

- Correct comparison operator

## [0.2.4] - 2022-03-12

### Changed

- Refactor function (isUpcomingKeyword-->isNextKeyword) to use array for list of values
- Refactor logic (peekNextKeyword-->isNextKeyword) to make code more DRY and readable
- Remove old function (peekNextKeyword)
- Reformat margins for COMMENT blocks within functions
- Wrap closing parenthesis on INLINE blocks to existing line
- Adjust formatting for INSERT INTO blocks

## [0.2.3] - 2022-03-12

### Added

- New function (isUpcomingKeyword) for improved stack handling

### Changed

- Support heavily nested case statements
- Improved WITH block formatting
- Adjust AND block margins on WHERE blocks
- Improve SELECT blocks with OVER functions

### Removed

- superfluous regex steps

## [0.2.2] - 2022-03-11

### Fixed

- trim leading whitespaces to process comments

## [0.2.1] - 2022-03-10

### Changed

- Set correct margins for COMMENT blocks within a BY block
- Set correct margins for BY blocks after a COMMENT block
- Adjust margins for BY block attributes when margin equals zero
- Removed unnecessary blank lines

### Added

- Set margins for JOIN blocks after a COMMENT block
- Adjust margins for CROSS join blocks

### Fixed

- Updated regex to ensure reproducible outcomes

## [0.1.11] - 2022-03-09

### Added

- CROSS joins
- Nested CTEs

### Changed

- Cleanup COMMENT blocks
- Adjust OUTCOME comment
- Cleanup end of queries

### Fixed

- Strip extraneous '*/' at the end of comments
- Spacing for CTE blocks

## [0.1.10] - 2022-03-09

### Added

- Account for the '//' comment style

## [0.1.9] - 2022-03-08

### Added

- Account for left and right functions
- Add additional peekNextKeyword comparsons

### Changed

- Adjust formatting for nested case statements
- Update COMMENT and BY formatting

### Fixed

- Fix peekNextKeyword comparisons

## [0.1.8] - 2022-03-08

### Fixed

- Constrain lone single-quotes fix to COMMENT stacks

## [0.1.7] - 2022-03-08

### Changed

- Change spacing for numeric vs non-numeric BY stack values
- Account for function calls on BY stacks

### Fixed

- Account for lone single-quotes in COMMENT stacks

## [0.1.6] - 2022-03-06

### Changed

- Spacing adjustments for inlines blocks
- Addressed all known SQL formatting issues
- Updated README.md

## [0.1.5] - 2022-03-05

### Changed

- Adjust comment spacing
- Add minimal logic to reduce dbt mangling

### Fixed

- Correct "from block" spacing
- Cleanup margin stack at query end

## [0.1.4] - 2022-03-05

### Changed

- adjust spaced for CASE statements
- ensure that OUTCOME comment isn't duplicated

## [0.1.3] - 2022-03-05

### Added

- support for math operators
- support for Snowflake cast operator

### Fixed

- Included OR keyword logic for create table/view
  
## [0.1.2] - 2022-03-04

### Changed

- Refactored stack.push to make it more "DRY"
- Added "OR" keyword
  
## [0.1.1] - 2022-03-01

### Changed

- updated README.md typo
  
## [0.1.0] - 2022-03-01

### Fixed

- updated to support "create table as select" queries
  
### Added

- included minimal support to avoid mangling Jinja templating for DBT

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
