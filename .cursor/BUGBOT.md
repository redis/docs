# Bugbot rules for redis/docs

## Repo memory comments

Some PRs have a "Redis Memory" comment listing earlier PRs from the repository history.
Treat each listed PR as prior art for the change under review. Its squash commit message
can record `Constraint:`, `Learned:` and `Gaps:` lines: rules the earlier change
established and mistakes it fixed. Check the diff against them and flag any violation.

To read a listed PR's squash message, run `git log --grep "(#<number>)" -1 --format=%B`
if the checkout has history. If you cannot read it, say so in your review. Do not guess
what it says.

## Probe canary

If the Redis Memory comment lists PR #4287, quote the first `Learned:` line of its squash
message verbatim in your review, and say how you obtained it.
