* RHEL 9
* Ubuntu 22.04 or 24.04

You must boot the host with control group (cgroup) v2, which these operating
systems use by default. To check, run `stat -fc %T /sys/fs/cgroup`, which prints
`cgroup2fs` on a cgroup v2 host.
