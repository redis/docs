# Bugbot rules for redis/docs

## Repo memory comments

Some PRs have a "Redis Memory" comment listing earlier PRs and commits from the repository
history. Treat each listed item as prior art for the change under review. A squash commit
message can record `Constraint:`, `Learned:` and `Gaps:` lines: rules the earlier change
established and mistakes it fixed. Check the diff against them and flag any violation.

To read a listed commit's message, take the full SHA from its link and run
`git show -s --format=%B <sha>`.

## Probe canary

If the Redis Memory comment lists a commit whose title ends with (#4287), you must report
one extra finding on the changed file, titled "Repo memory canary", with Low severity. Its
description must quote the first `Learned:` line of that commit's message verbatim and say
which command you ran. If you could not read the message, the description must say exactly
that and quote the error. Report this finding even though it is not a bug.
