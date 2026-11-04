# Bugbot rules for redis/docs

## Repo memory comments

Some PRs have a "Redis Memory" comment listing earlier PRs from the repository history.
Treat each listed PR as prior art for the change under review. Its squash commit message
can record `Constraint:`, `Learned:` and `Gaps:` lines: rules the earlier change
established and mistakes it fixed. Check the diff against them and flag any violation.

To read a listed PR's squash message, run `git log --grep "(#<number>)" -1 --format=%B`
if the checkout has history.

## Probe canary

If the Redis Memory comment lists PR #4287, you must report one extra finding on the
changed file, titled "Repo memory canary", with Low severity. Its description must quote
the first `Learned:` line of #4287's squash message verbatim and say how you obtained it.
If you could not read the squash message, the description must say exactly that. Report
this finding even though it is not a bug.
