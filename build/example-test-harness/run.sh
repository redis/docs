#!/usr/bin/env bash
# Reusable TCE example test harness.
# Runs a docs example set's client source files against a live (throwaway) Redis
# on localhost:6379, using each library's real in-file assertions.
#
# Usage:  ./run.sh [--portable|--fidelity] <example_set> [client ...]
#   --portable  (default) self-bootstrap each toolchain into work/. No client repo
#               clones needed; C#/PHP run against local stubs. Cached across runs.
#   --fidelity  run in tmp/clients/examples/, using the tracked manifests in
#               fidelity/ and real client repo clones, so examples execute the way
#               they do upstream. Requires ./bootstrap.sh first.
#   example_set : e.g. cmds_hash, ss_tutorial, search_quickstart
#   client      : one or more client keys (see clients.tsv); default = all
#
# Client identity — names, aliases, paths, filename conventions — comes from
# clients.tsv. Sets that follow the local_examples/<set>/<client>/ convention need
# no code change here; only the older non-conforming sets are listed in src_path().
#
# Assumes a SCRATCH Redis on 6379 — several examples FLUSH the db.
# Keep this bash 3.2 compatible (macOS system bash): no associative arrays.
set -uo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
HARNESS="$(cd "$(dirname "$0")" && pwd)"
WORK="$HARNESS/work"; mkdir -p "$WORK"
TSV="$HARNESS/clients.tsv"
FIDELITY_ROOT="$REPO/tmp/clients/examples"

MODE=portable
LIST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --portable) MODE=portable; shift ;;
    --fidelity) MODE=fidelity; shift ;;
    --list) LIST=1; shift ;;
    -h|--help) sed -n '2,18p' "$0"; exit 0 ;;
    --*) echo "unknown flag: $1" >&2; exit 2 ;;
    *) break ;;
  esac
done
SET="${1:?usage: run.sh [--portable|--fidelity] <example_set> [client...]}"; shift || true

[ -f "$TSV" ] || { echo "ERROR: missing $TSV" >&2; exit 1; }

# --- clients.tsv accessors ----------------------------------------------------
# field numbers: 1 key 2 display 3 component 4 mapping 5 local_dirs 6 assets
#                7 filename 8 repo_path 9 fid_dir 10 fid_sub 11 portable
tsv_get() { # tsv_get <key> <field-number>
  awk -F'\t' -v k="$1" -v f="$2" '!/^#/ && NF>1 && $1==k {print $f; exit}' "$TSV"
}
# Accept either a canonical key or a legacy portable runner name on the command line.
canon_key() {
  local k="$1"
  if awk -F'\t' -v k="$k" '!/^#/ && NF>1 && $1==k {found=1} END{exit !found}' "$TSV"; then
    printf '%s' "$k"; return
  fi
  awk -F'\t' -v k="$k" '!/^#/ && NF>1 && $11==k {print $1; exit}' "$TSV"
}
# Clients testable in the current mode, in clients.tsv (i.e. docs tab) order.
clients_for_mode() {
  if [ "$MODE" = fidelity ]; then
    awk -F'\t' '!/^#/ && NF>1 && $9!="-" {print $1}' "$TSV"
  else
    awk -F'\t' '!/^#/ && NF>1 && $11!="-" {print $1}' "$TSV"
  fi
}

CLIENTS_ALL=()
while IFS= read -r c; do [ -n "$c" ] && CLIENTS_ALL+=("$c"); done < <(clients_for_mode)
CLIENTS=()
if [ $# -eq 0 ]; then
  CLIENTS=("${CLIENTS_ALL[@]}")
else
  for arg in "$@"; do
    ck="$(canon_key "$arg")"
    if [ -z "$ck" ]; then echo "ERROR: unknown client '$arg' (see clients.tsv)" >&2; exit 2; fi
    CLIENTS+=("$ck")
  done
fi

# --- example_set + client -> repo-relative source path -----------------------
# Two-step resolution:
#   1. legacy_src_path() — explicit entries for the older sets whose files do NOT live
#      at local_examples/<set>/<client>/ (the data-type tutorials point into
#      local_examples/tmp/datatypes/..., ruby/, php/, client-specific/, and so on).
#      Explicit wins, so existing sets resolve exactly as they did before.
#   2. convention — glob local_examples/<set>/<alias>/ using the local_dirs aliases
#      from clients.tsv. Any set that follows the convention needs no entry here.
src_path() {
  local set="$1" client="$2" portable legacy rel
  # Convention first for anything that has a per-set directory: it is the only
  # resolution that can tell the C# flavours apart (NRedisStack/ vs seredis/).
  rel="$(convention_src_path "$set" "$client")"
  if [ -n "$rel" ]; then printf '%s' "$rel"; return; fi
  # Legacy entries are keyed by portable runner name, which predates the four-way C#
  # split — four rows share the "dotnet" runner. Only the primary row for a runner may
  # claim its legacy entry, or one .cs file would be reported as four passing clients
  # and an NRedisStack-flavoured file would be credited to the SE.Redis tab.
  portable="$(tsv_get "$client" 11)"
  [ -z "$portable" ] || [ "$portable" = "-" ] && return
  [ "$client" = "$(primary_for_portable "$portable")" ] || return
  legacy="$(legacy_src_path "$set" "$portable")"
  [ -n "$legacy" ] && [ -f "$REPO/$legacy" ] && printf '%s' "$legacy"
}

# First clients.tsv row using a given portable runner key.
primary_for_portable() {
  awk -F'\t' -v p="$1" '!/^#/ && NF>1 && $11==p {print $1; exit}' "$TSV"
}

# Sets that are illustrative BY DESIGN: the code is correct for a reader but cannot execute
# against a scratch Redis. Reported as SKIP with a reason rather than FAIL, so that a red
# result always means a real defect.
#
# This list exists because path resolution is now convention-based. Under the old hardcoded
# src_path() these sets simply had no entry, so they were skipped by omission — the intent was
# invisible and easy to lose. Stating it explicitly is the point.
# Capability gaps in the LOCAL toolchain, as opposed to defects in the example. An example
# that is correct for the version the docs target, but unrunnable with what is installed
# here, must report SKIP with a reason — reporting FAIL would break the rule that a red
# result always means a real defect.
toolchain_skip_reason() { # $1 = set, $2 = canonical client key, $3 = repo-relative source
  case "$2" in
    go-redis)
      # Portable mode copies the pinned fidelity/go-redis.mod, which carries a `go` directive.
      # If the installed toolchain is older, `go test` dies with "toolchain not available"
      # before the example runs at all — a FAIL that says nothing about the example. (This is
      # the failure the unpinned `go get` used to produce; pinning moved it, so guard it.)
      local need have
      need="$(awk '/^go [0-9]/ {print $2; exit}' "$HARNESS/fidelity/go-redis.mod" 2>/dev/null)"
      have="$(go env GOVERSION 2>/dev/null | sed 's/^go//')"
      if [ -n "$need" ] && [ -n "$have" ]; then
        # Numeric compare on major.minor only; sort -V orders versions correctly.
        if [ "$(printf '%s\n%s\n' "$need" "$have" | sort -V | head -1)" != "$need" ]; then
          printf 'go.mod needs Go >= %s but this box has %s' "$need" "$have"
          return
        fi
      elif [ -z "$have" ]; then
        printf 'no go toolchain found on PATH'
        return
      fi
      ;;
    hiredis)
      # Unlike every other portable client, hiredis cannot be bootstrapped into work/:
      # it is a system C library (headers + shared object), not a pip/npm/gem package.
      # Skip loudly where it is absent rather than FAILing with a compile error that
      # says nothing about the example.
      if ! hiredis_prefix >/dev/null; then
        printf 'hiredis headers not found (looked in %s) — install hiredis to test the C examples' \
          "$(printf '%s, ' "${HIREDIS_PREFIXES[@]}" | sed 's/, $//')"
        return
      fi
      ;;
    ruby)
      # redis-rb gained native hexpire/httl in 6.0.0, and 6.x requires Ruby >= 3.2. On an
      # older Ruby (macOS still ships 2.6) the Gemfile resolves 5.4.1, where hexpire falls
      # through method_missing and omits the FIELDS token: "ERR wrong number of arguments".
      if grep -qE '\.(hexpire|httl|hpexpire|hpttl)\b' "$REPO/$3" 2>/dev/null; then
        if ! ruby -e 'exit(RUBY_VERSION >= "3.2" ? 0 : 1)' 2>/dev/null; then
          printf 'uses hexpire/httl, which need redis-rb >= 6.0 and therefore Ruby >= 3.2; this box has %s' \
            "$(ruby -e 'print RUBY_VERSION' 2>/dev/null || echo 'no ruby')"
          return
        fi
      fi
      ;;
  esac
  printf ''
}

illustrative_reason() { # $1 = set, $2 = canonical client key
  case "$1:$2" in
    # Every file in this set contains only auth1/auth2, which call AUTH with a `test-user`
    # ACL identity that a throwaway Redis has no reason to define. Matches the shipped
    # redis-py and node-redis examples, which have the same property. (PR #3627 triage.)
    cmds_cnxmgmt:*) printf 'AUTH needs a test-user ACL identity; illustrative by design' ;;
    *) printf '' ;;
  esac
}

# Glob local_examples/<set>/<alias>/ for this client's example file. Aliases exist
# because the directory naming grew organically: cmds_* sets use NRedisStack/ while
# geoindex and search_quickstart use nredisstack/, and both are tracked in git.
convention_src_path() {
  local set="$1" client="$2" aliases alias setdir cand dir f
  aliases="$(tsv_get "$client" 5)"
  [ -z "$aliases" ] || [ "$aliases" = "-" ] && return
  setdir="$REPO/local_examples/$set"
  [ -d "$setdir" ] || return
  for alias in $(printf '%s' "$aliases" | tr '|' ' '); do
    # Match the directory name with EXACT case. A glob on "$setdir/$alias" would
    # succeed against the wrong case on a case-insensitive filesystem (macOS default)
    # and yield a path that does not exist in git: cmds_* sets use NRedisStack/ while
    # geoindex, search_quickstart and time_series_tutorial use nredisstack/. Globbing
    # expands from readdir, so basename here is the true on-disk spelling.
    dir=""
    for cand in "$setdir"/*; do
      [ -d "$cand" ] || continue
      if [ "$(basename "$cand")" = "$alias" ]; then dir="$cand"; break; fi
    done
    [ -n "$dir" ] || continue
    for f in "$dir"/*; do
      [ -f "$f" ] || continue
      case "$(basename "$f")" in
        .*|*.md|README*) continue ;;
      esac
      printf '%s' "${f#$REPO/}"
      return
    done
  done
}

legacy_src_path() {
  local set="$1" client="$2"
  [ -z "$client" ] && return
  case "$set:$client" in
    ss_tutorial:python)          echo local_examples/tmp/datatypes/sorted-sets/dt_ss.py ;;
    ss_tutorial:node)            echo local_examples/tmp/datatypes/sorted-sets/dt-ss.js ;;
    ss_tutorial:go)              echo local_examples/tmp/datatypes/sorted-sets/ss_tutorial_test.go ;;
    ss_tutorial:jedis)           echo local_examples/tmp/datatypes/sorted-sets/SortedSetsExample.java ;;
    ss_tutorial:ruby)            echo local_examples/ruby/dt_sorted_sets.rb ;;
    ss_tutorial:rust-sync)       echo local_examples/rust-sync/dt-sorted-sets.rs ;;
    ss_tutorial:rust-async)      echo local_examples/rust-async/dt-sorted-sets.rs ;;
    ss_tutorial:lettuce-async)   echo local_examples/client-specific/lettuce-async/SortedSetExample.java ;;
    ss_tutorial:lettuce-reactive)echo local_examples/client-specific/lettuce-reactive/SortedSetExample.java ;;
    ss_tutorial:php)             echo local_examples/php/DtSortedSetsTest.php ;;
    ss_tutorial:dotnet)          echo local_examples/tmp/datatypes/sorted-sets/SortedSetExample.cs ;;
    pipe_trans_tutorial:ruby)            echo local_examples/client-specific/ruby/transpipe.rb ;;
    pipe_trans_tutorial:lettuce-sync)    echo local_examples/client-specific/lettuce-sync/TransPipeExample.java ;;
    pipe_trans_tutorial:lettuce-async)   echo local_examples/client-specific/lettuce-async/TransPipeExample.java ;;
    pipe_trans_tutorial:lettuce-reactive)echo local_examples/client-specific/lettuce-reactive/TransPipeExample.java ;;
    set_tutorial:python)         echo local_examples/tmp/datatypes/strings/dt_string.py ;;
    set_tutorial:node)           echo local_examples/tmp/datatypes/strings/dt-string.js ;;
    set_tutorial:go)             echo local_examples/tmp/datatypes/strings/string_example_test.go ;;
    set_tutorial:jedis)          echo local_examples/tmp/datatypes/strings/StringExample.java ;;
    set_tutorial:ruby)           echo local_examples/ruby/dt_string.rb ;;
    set_tutorial:rust-sync)      echo local_examples/rust-sync/dt-string.rs ;;
    set_tutorial:rust-async)     echo local_examples/rust-async/dt-string.rs ;;
    set_tutorial:lettuce-async)  echo local_examples/client-specific/lettuce-async/StringExample.java ;;
    set_tutorial:lettuce-reactive)echo local_examples/client-specific/lettuce-reactive/StringExample.java ;;
    set_tutorial:php)            echo local_examples/php/DtStringTest.php ;;
    set_tutorial:dotnet)         echo local_examples/tmp/datatypes/strings/StringSnippets.cs ;;
    hash_tutorial:python)        echo local_examples/tmp/datatypes/hashes/dt_hash.py ;;
    hash_tutorial:node)          echo local_examples/tmp/datatypes/hashes/dt-hash.js ;;
    hash_tutorial:go)            echo local_examples/tmp/datatypes/hashes/hash_tutorial_test.go ;;
    hash_tutorial:jedis)         echo local_examples/tmp/datatypes/hashes/HashExample.java ;;
    hash_tutorial:ruby)          echo local_examples/ruby/dt_hash.rb ;;
    hash_tutorial:rust-sync)     echo local_examples/rust-sync/dt-hash.rs ;;
    hash_tutorial:rust-async)    echo local_examples/rust-async/dt-hash.rs ;;
    hash_tutorial:lettuce-async) echo local_examples/tmp/lettuce-async/HashExample.java ;;
    hash_tutorial:lettuce-reactive)echo local_examples/tmp/lettuce-reactive/HashExample.java ;;
    hash_tutorial:php)           echo local_examples/php/DtHashTest.php ;;
    hash_tutorial:dotnet)        echo local_examples/tmp/datatypes/hashes/HashExample.cs ;;
    sets_tutorial:python)        echo local_examples/tmp/datatypes/sets/dt_set.py ;;
    sets_tutorial:node)          echo local_examples/tmp/datatypes/sets/dt-set.js ;;
    sets_tutorial:go)            echo local_examples/tmp/datatypes/sets/sets_example_test.go ;;
    sets_tutorial:jedis)         echo local_examples/tmp/datatypes/sets/SetsExample.java ;;
    sets_tutorial:ruby)          echo local_examples/ruby/dt_sets.rb ;;
    sets_tutorial:rust-sync)     echo local_examples/rust-sync/dt-sets.rs ;;
    sets_tutorial:rust-async)    echo local_examples/rust-async/dt-sets.rs ;;
    sets_tutorial:lettuce-async) echo local_examples/tmp/lettuce-async/SetExample.java ;;
    sets_tutorial:lettuce-reactive)echo local_examples/tmp/lettuce-reactive/SetExample.java ;;
    sets_tutorial:php)           echo local_examples/php/DtSetsTest.php ;;
    sets_tutorial:dotnet)        echo local_examples/tmp/datatypes/sets/SetsTutorial.cs ;;
    cmds_sorted_set:ioredis)          echo local_examples/cmds_sorted_set/ioredis/cmds-sorted-set.js ;;
    cmds_sorted_set:ruby)             echo local_examples/cmds_sorted_set/ruby/cmds_sorted_set.rb ;;
    cmds_sorted_set:rust-sync)        echo local_examples/cmds_sorted_set/rust-sync/cmds_sorted_set.rs ;;
    cmds_sorted_set:rust-async)       echo local_examples/cmds_sorted_set/rust-async/cmds_sorted_set.rs ;;
    cmds_sorted_set:lettuce-async)    echo local_examples/cmds_sorted_set/lettuce-async/CmdsSortedSetExample.java ;;
    cmds_sorted_set:lettuce-reactive) echo local_examples/cmds_sorted_set/lettuce-reactive/CmdsSortedSetExample.java ;;
    cmds_sorted_set:php)              echo local_examples/cmds_sorted_set/predis/CmdsSortedSetTest.php ;;
    cmds_servermgmt:ioredis)          echo local_examples/cmds_servermgmt/ioredis/cmds-servermgmt.js ;;
    cmds_servermgmt:ruby)             echo local_examples/cmds_servermgmt/ruby/cmds_servermgmt.rb ;;
    cmds_servermgmt:rust-sync)        echo local_examples/cmds_servermgmt/rust-sync/cmds_servermgmt.rs ;;
    cmds_servermgmt:rust-async)       echo local_examples/cmds_servermgmt/rust-async/cmds_servermgmt.rs ;;
    cmds_servermgmt:lettuce-async)    echo local_examples/cmds_servermgmt/lettuce-async/CmdsServerMgmtExample.java ;;
    cmds_servermgmt:lettuce-reactive) echo local_examples/cmds_servermgmt/lettuce-reactive/CmdsServerMgmtExample.java ;;
    cmds_servermgmt:php)              echo local_examples/cmds_servermgmt/predis/CmdsServerMgmtTest.php ;;
    cmds_set:ioredis)                 echo local_examples/cmds_set/ioredis/cmds-set.js ;;
    cmds_set:ruby)                    echo local_examples/cmds_set/ruby/cmds_set.rb ;;
    cmds_set:rust-sync)               echo local_examples/cmds_set/rust-sync/cmds_set.rs ;;
    cmds_set:rust-async)              echo local_examples/cmds_set/rust-async/cmds_set.rs ;;
    cmds_list:ioredis)                echo local_examples/cmds_list/ioredis/cmds-list.js ;;
    cmds_list:ruby)                   echo local_examples/cmds_list/ruby/cmds_list.rb ;;
    cmds_list:rust-sync)              echo local_examples/cmds_list/rust-sync/cmds_list.rs ;;
    cmds_list:rust-async)             echo local_examples/cmds_list/rust-async/cmds_list.rs ;;
    cmds_stream:ioredis)              echo local_examples/cmds_stream/ioredis/cmds-stream.js ;;
    cmds_stream:ruby)                 echo local_examples/cmds_stream/ruby/cmds_stream.rb ;;
    set_and_get:ioredis)              echo local_examples/set_and_get/ioredis/set-get.js ;;
    set_and_get:ruby)                 echo local_examples/set_and_get/ruby/set_get.rb ;;
    set_and_get:rust-sync)            echo local_examples/set_and_get/rust-sync/set_get.rs ;;
    set_and_get:rust-async)           echo local_examples/set_and_get/rust-async/set_get.rs ;;
    set_and_get:lettuce-async)        echo local_examples/set_and_get/lettuce-async/SetGetExample.java ;;
    set_and_get:lettuce-reactive)     echo local_examples/set_and_get/lettuce-reactive/SetGetExample.java ;;
    set_and_get:php)                  echo local_examples/set_and_get/predis/SetGetTest.php ;;
    time_series_tutorial:python) echo local_examples/time_series_tutorial/redis-py/dt_time_series.py ;;
    time_series_tutorial:go)     echo local_examples/time_series_tutorial/go-redis/timeseries_tut_test.go ;;
    time_series_tutorial:jedis)  echo local_examples/time_series_tutorial/jedis/TimeSeriesTutorialExample.java ;;
    time_series_tutorial:node)   echo local_examples/time_series_tutorial/node-redis/dt-time-series.js ;;
    time_series_tutorial:dotnet) echo local_examples/time_series_tutorial/nredisstack/TimeSeriesTutorial.cs ;;
    # search_quickstart / geoindex: all mapped clients PASS (pom-jedis.xml is 7.5.3,
    # which has both the RedisClient API these examples use and the older UnifiedJedis
    # API; the node wildcard assert now checks result.total, not doc order).
    search_quickstart:python)    echo local_examples/search_quickstart/redis-py/search_quickstart.py ;;
    search_quickstart:node)      echo local_examples/search_quickstart/node-redis/search-quickstart.js ;;
    search_quickstart:go)        echo local_examples/search_quickstart/go-redis/search_quickstart_test.go ;;
    search_quickstart:jedis)     echo local_examples/search_quickstart/jedis/SearchQuickstartExample.java ;;
    search_quickstart:dotnet)    echo local_examples/search_quickstart/nredisstack/SearchQuickstartExample.cs ;;
    geoindex:python)             echo local_examples/geoindex/redis-py/geo_index.py ;;
    geoindex:go)                 echo local_examples/geoindex/go-redis/geo_index_test.go ;;
    geoindex:jedis)              echo local_examples/geoindex/jedis/GeoIndexExample.java ;;
    geoindex:dotnet)             echo local_examples/geoindex/nredisstack/GeoIndexExample.cs ;;
    *) echo "" ;;
  esac
}

log() { printf '%s\n' "$*"; }
SUMMARY=()   # entries: "client<TAB>status" (bash 3.2 compatible)

# --- per-language runners: set $rc (0=pass) and leave detail in $LOG ----------
run_python() {
  [ -d "$WORK/py/venv" ] || { python3 -m venv "$WORK/py/venv"; "$WORK/py/venv/bin/pip" -q install redis; }
  "$WORK/py/venv/bin/python" "$1" >"$LOG" 2>&1; rc=$?
}
run_ruby() {
  gem list -i redis >/dev/null 2>&1 || gem install --silent redis >/dev/null 2>&1
  ruby "$1" >"$LOG" 2>&1; rc=$?
}
# Prefixes searched for a hiredis install, in order. Homebrew uses /usr/local on Intel
# macOS and /opt/homebrew on Apple silicon; Linux distro packages land in /usr.
HIREDIS_PREFIXES=(/usr/local /opt/homebrew /usr)
hiredis_prefix() { # prints the first prefix containing hiredis/hiredis.h; non-zero if none
  local p
  for p in "${HIREDIS_PREFIXES[@]}"; do
    [ -f "$p/include/hiredis/hiredis.h" ] && { printf '%s' "$p"; return 0; }
  done
  return 1
}
run_hiredis() {
  local d="$WORK/hiredis" p; mkdir -p "$d"
  p="$(hiredis_prefix)"
  # -rpath bakes the library path into the binary, so it runs without callers having to
  # set DYLD_LIBRARY_PATH (macOS) or LD_LIBRARY_PATH (Linux). On compile failure the
  # compiler diagnostics stay in $LOG; on success the program's own output replaces them.
  cc -I"$p/include" -L"$p/lib" -Wl,-rpath,"$p/lib" -lhiredis "$1" -o "$d/example" >"$LOG" 2>&1 \
    && "$d/example" >"$LOG" 2>&1
  rc=$?
}
run_node() {
  local d="$WORK/node"; mkdir -p "$d"
  [ -d "$d/node_modules/redis" ] || { printf '{"type":"module"}\n' >"$d/package.json"; (cd "$d" && npm i -s redis >/dev/null 2>&1); }
  cp "$1" "$d/example.mjs"; (cd "$d" && node example.mjs) >"$LOG" 2>&1; rc=$?
}
run_ioredis() {
  local d="$WORK/ioredis"; mkdir -p "$d"
  [ -d "$d/node_modules/ioredis" ] || { printf '{"type":"module"}\n' >"$d/package.json"; (cd "$d" && npm i -s ioredis >/dev/null 2>&1); }
  cp "$1" "$d/example.mjs"; (cd "$d" && node example.mjs) >"$LOG" 2>&1; rc=$?
}
run_go() {
  local d="$WORK/go"; mkdir -p "$d"
  # Use the TRACKED go.mod rather than `go mod init` + an unpinned `go get`. An unpinned
  # get floats to the newest go-redis, which eventually requires a newer Go toolchain than
  # is installed — the failure is "toolchain not available", reported as a FAIL against a
  # perfectly good example. Copying the pinned manifest also keeps portable and fidelity
  # mode on the same dependency version. Re-copied every run so a stale cached go.mod
  # (e.g. one already floated to a newer `go` directive) is corrected rather than inherited.
  cp "$HARNESS/fidelity/go-redis.mod" "$d/go.mod"
  # The examples declare `package example_commands`, so the module needs a second file in
  # that package or the build fails before any test runs.
  printf 'package example_commands\n' >"$d/lib.go"
  cp "$1" "$d/ex_test.go"
  (cd "$d" && go mod tidy >/dev/null 2>&1 && go test ./... ) >"$LOG" 2>&1; rc=$?
}
run_rust_sync() { rust_run "$WORK/rust-sync" "$1" 'redis = "1.3"' ; }
run_rust_async(){ rust_run "$WORK/rust-async" "$1" 'redis = { version = "1.3", features = ["tokio-comp"] }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }' ; }
rust_run() {
  local d="$1" src="$2" deps="$3"; mkdir -p "$d/src"
  if [ ! -f "$d/Cargo.toml" ]; then
    cat >"$d/Cargo.toml" <<EOF
[package]
name = "tce"
version = "0.0.0"
edition = "2021"

[dependencies]
$deps
EOF
  fi
  cp "$src" "$d/src/lib.rs"; (cd "$d" && cargo test -q) >"$LOG" 2>&1; rc=$?
}
run_maven_java() { # $1=src $2=workdir $3=package-relpath
  local d="$2"; mkdir -p "$d/src/test/java/$3"
  [ -f "$d/pom.xml" ] || cp "$HARNESS/pom-$(basename "$d").xml" "$d/pom.xml"
  rm -f "$d/src/test/java/$3"/*.java
  cp "$1" "$d/src/test/java/$3/"
  (cd "$d" && mvn -B test) >"$LOG" 2>&1; rc=$?
  # Surefire exits 0 when it matches no tests. These classes are named *Example, not *Test,
  # so a pom missing the *Example include "passes" having run nothing. The generated fidelity
  # wrappers guard this; portable mode is the DEFAULT mode, so it needs the same guard or the
  # false green survives exactly where it is most likely to be hit.
  if [ "${rc:-1}" -eq 0 ] && ! grep -qE 'Tests run: [1-9]' "$LOG"; then
    printf '\nHARNESS ERROR: surefire ran zero tests — check the *Example include in pom.xml\n' >>"$LOG"
    rc=1
  fi
}
run_jedis()            { run_maven_java "$1" "$WORK/jedis"    io/redis/examples ; }
run_lettuce_sync()     { run_maven_java "$1" "$WORK/lettuce-sync"    io/redis/examples/sync ; }
run_lettuce_async()    { run_maven_java "$1" "$WORK/lettuce-async"   io/redis/examples/async ; }
run_lettuce_reactive() { run_maven_java "$1" "$WORK/lettuce-reactive" io/redis/examples/reactive ; }
run_dotnet() { # stubs NRedisStack.Tests fixtures so the file runs under plain xunit
  local d="$WORK/dotnet"; mkdir -p "$d"
  cp "$HARNESS/dotnet/harness.csproj" "$d/harness.csproj"
  cp "$HARNESS/dotnet/stubs.cs"       "$d/stubs.cs"
  cp "$HARNESS/dotnet/GlobalUsings.cs" "$d/GlobalUsings.cs"
  rm -f "$d"/Example_*.cs; cp "$1" "$d/Example_src.cs"
  (cd "$d" && dotnet test --nologo) >"$LOG" 2>&1; rc=$?
  # Same false-green class as surefire: if the [Fact] didn't survive outside a REMOVE block,
  # the runner discovers nothing and still exits 0.
  #
  # Accept both summary shapes, mirroring the generated fidelity wrapper: the classic VSTest
  # line ("Passed!  - Failed: 0, Passed: 2, ...") and Microsoft.Testing.Platform's
  # ("succeeded: 2"). Matching only VSTest would reject a genuinely passing MTP run — the
  # inverse false-negative of the bug this guard exists to prevent.
  if [ "${rc:-1}" -eq 0 ] \
     && ! grep -qE 'Passed! *- *Failed: *[0-9]+, *Passed: *[1-9]' "$LOG" \
     && ! grep -qE '(succeeded|passed): *[1-9]' "$LOG"; then
    printf '\nHARNESS ERROR: could not confirm any test passed. Neither a VSTest nor an MTP summary with a non-zero pass count was found — check the [Fact] survived outside a REMOVE block, or update this check if dotnet changed its summary format.\n' >>"$LOG"
    rc=1
  fi
}
run_php() {
  local d="$WORK/php"; mkdir -p "$d"
  [ -d "$d/vendor/predis" ] || { printf '{}\n' >"$d/composer.json"; (cd "$d" && composer -q require predis/predis >/dev/null 2>&1); }
  # Two test-base styles exist in local_examples: some PHP examples extend predis's own
  # PredisTestCase, others extend PHPUnit\Framework\TestCase. Portable mode installs neither
  # (only predis), so stub one assertion class and alias BOTH names onto it — otherwise a
  # perfectly good example dies with "Class ... not found", which reads as an example defect.
  # The PHPUnit alias is guarded so it yields to the real class if phpunit is ever installed.
  cat >"$d/bootstrap.php" <<'PHP'
<?php
require __DIR__ . '/vendor/autoload.php';
class HarnessTestCase {
  function assertEquals($e,$a,$m=''){ if($e!=$a) throw new Exception("assertEquals: expected ".var_export($e,true)." got ".var_export($a,true)); }
  function assertSame($e,$a,$m=''){ if($e!==$a) throw new Exception("assertSame: expected ".var_export($e,true)." got ".var_export($a,true)); }
  function assertTrue($c,$m=''){ if($c!==true) throw new Exception("assertTrue failed"); }
  function assertFalse($c,$m=''){ if($c!==false) throw new Exception("assertFalse failed"); }
  function assertNull($v,$m=''){ if($v!==null) throw new Exception("assertNull failed"); }
  function assertNotNull($v,$m=''){ if($v===null) throw new Exception("assertNotNull failed"); }
  function assertCount($e,$a,$m=''){ if($e!=count($a)) throw new Exception("assertCount: expected $e got ".count($a)); }
  function assertEmpty($v,$m=''){ if(!empty($v)) throw new Exception("assertEmpty failed"); }
  function assertNotEmpty($v,$m=''){ if(empty($v)) throw new Exception("assertNotEmpty failed"); }
  function assertIsArray($v,$m=''){ if(!is_array($v)) throw new Exception("assertIsArray failed"); }
  function assertGreaterThan($e,$a,$m=''){ if(!($a>$e)) throw new Exception("assertGreaterThan: $a not > $e"); }
  function assertContains($n,$h,$m=''){ if(!in_array($n,$h)) throw new Exception("assertContains failed"); }
}
class_alias('HarnessTestCase', 'PredisTestCase');
if (!class_exists('PHPUnit\\Framework\\TestCase')) {
  class_alias('HarnessTestCase', 'PHPUnit\\Framework\\TestCase');
}
PHP
  cp "$1" "$d/example.php"
  # Honour PHPUnit's setUp/tearDown lifecycle: examples that build their client in setUp()
  # would otherwise run against an unset property. Aliases declared in bootstrap.php are
  # already in $before, so they are never mistaken for the example's own class.
  (cd "$d" && php -r '
    require "bootstrap.php";
    $before=get_declared_classes();
    require "example.php";
    $cls=array_values(array_diff(get_declared_classes(),$before));
    // An example that declares no class leaves $cls empty; end() then returns false and
    // `new false()` fatals with a message about the harness rather than the example. Fail
    // with a diagnostic that names the actual problem.
    if(!$cls){
      fwrite(STDERR,"HARNESS ERROR: example.php declared no class — a PHP TCE must define a test class\n");
      exit(1);
    }
    $c=end($cls); $o=new $c();
    // setUp/tearDown are protected by PHPUnit convention, so they need reflection.
    $call=function($o,$name){
      if(!method_exists($o,$name)) return;
      $r=new ReflectionMethod($o,$name); $r->setAccessible(true); $r->invoke($o);
    };
    $ran=0;
    foreach(get_class_methods($o) as $m){
      if(strpos($m,"test")!==0) continue;
      $call($o,"setUp");
      $o->$m();
      $call($o,"tearDown");
      $ran++;
    }
    if($ran===0) { fwrite(STDERR,"HARNESS ERROR: no test* method found on $c\n"); exit(1); }
    fwrite(STDERR,"OK ($ran test method(s))\n");
  ') >"$LOG" 2>&1; rc=$?
}

# --- fidelity mode ------------------------------------------------------------
# Stage the file into tmp/clients/examples/<fid_dir>/<fid_sub>/ and hand off to that
# directory's run.sh, which bootstrap.sh materialised from fidelity/. The staged
# filename is the source basename: files in local_examples/ already follow the naming
# convention, so there is nothing to template here. (The `filename` column in
# clients.tsv is guidance for *authoring* a new example, not for staging one.)
run_fidelity() { # $1 = absolute source path, $2 = canonical client key
  local src="$1" client="$2" dir sub root dest base saved=""
  dir="$(tsv_get "$client" 9)"; sub="$(tsv_get "$client" 10)"
  if [ -z "$dir" ] || [ "$dir" = "-" ]; then
    printf 'no fidelity directory for %s in clients.tsv\n' "$client" >"$LOG"; rc=1; return
  fi
  root="$FIDELITY_ROOT/$dir"
  if [ ! -x "$root/run.sh" ]; then
    printf 'missing %s/run.sh — run build/example-test-harness/bootstrap.sh first\n' \
      "$root" >"$LOG"; rc=1; return
  fi
  dest="$root"; [ "$sub" = "." ] || dest="$root/$sub"
  base="$(basename "$src")"
  mkdir -p "$dest"

  # For the C# clients, fid_sub points at tests/Doc inside a real CLONE of the NRedisStack
  # repo — not a throwaway scaffold. The staged filename is identical to the upstream one
  # (CmdsHashExample.cs is both), so a naive stage-then-delete OVERWRITES a tracked upstream
  # file and then removes it, leaving the clone with a deleted source. Back up anything we
  # are about to clobber and restore it afterwards, so a run is always a no-op on the clone.
  if [ -f "$dest/$base" ]; then
    saved="$(mktemp "${TMPDIR:-/tmp}/tce-staged-XXXXXX")"
    cp "$dest/$base" "$saved"
  fi

  # Record what needs undoing BEFORE staging, and install a trap, so an interrupt or a kill
  # partway through the test still restores the clone. Without this, Ctrl-C during a
  # multi-minute dotnet/mvn run leaves the clone holding staged content indefinitely.
  STAGED_PATH="$dest/$base"; STAGED_BACKUP="$saved"
  trap 'unstage_fidelity; exit 130' INT TERM

  cp "$src" "$dest/$base"
  # Pass the staged subdirectory through as the project/working dir. The C# runner needs it
  # to tell tests/Doc from tests/Doc/Async; runners that don't take a second argument ignore it.
  ( cd "$root" && ./run.sh "$base" "$sub" ) >"$LOG" 2>&1; rc=$?

  unstage_fidelity
  trap - INT TERM
}

# Undo whatever run_fidelity staged. Idempotent, and safe to call from a signal handler.
unstage_fidelity() {
  [ -n "${STAGED_PATH:-}" ] || return 0
  if [ -n "${STAGED_BACKUP:-}" ]; then
    # Restore the upstream file, and only drop the backup once the copy has demonstrably
    # succeeded. Deleting it unconditionally would destroy the sole copy of a tracked
    # upstream source whenever the restore failed — the exact loss this backup exists to
    # prevent. If it fails, keep the backup and say where it is.
    if cp "$STAGED_BACKUP" "$STAGED_PATH"; then
      rm -f "$STAGED_BACKUP"
    else
      printf 'ERROR: could not restore %s — your backup is preserved at %s\n' \
        "$STAGED_PATH" "$STAGED_BACKUP" >&2
      log "ERROR: failed to restore $STAGED_PATH; backup kept at $STAGED_BACKUP"
    fi
  else
    rm -f "$STAGED_PATH"
  fi
  STAGED_PATH=""; STAGED_BACKUP=""
}

# --- list: resolve sources and exit (no Redis, no toolchains) -----------------
if [ "$LIST" = 1 ]; then
  for c in "${CLIENTS[@]}"; do
    rel="$(src_path "$SET" "$c")"
    printf '%-18s %s\n' "$c" "${rel:-(none)}"
  done
  exit 0
fi

# --- drive --------------------------------------------------------------------
log "=== TCE sweep: $SET  [$MODE]  (redis @ localhost:6379) ==="
if [ "$MODE" = fidelity ] && [ ! -d "$FIDELITY_ROOT" ]; then
  log "ERROR: $FIDELITY_ROOT does not exist — run build/example-test-harness/bootstrap.sh"
  exit 1
fi
# Fail fast if the scratch Redis is unreachable — every run FLUSHes it and relies
# on a clean db, so silently proceeding would give misleading pass/fail results.
if ! redis-cli ping >/dev/null 2>&1; then
  log "ERROR: no Redis responding on localhost:6379 — start a throwaway Redis first."
  exit 1
fi
mkdir -p "$HARNESS/results"
for c in "${CLIENTS[@]}"; do
  why="$(illustrative_reason "$SET" "$c")"
  if [ -n "$why" ]; then
    SUMMARY+=("$c	SKIP ($why)"); log ">> $c: SKIP — $why"; continue
  fi
  rel="$(src_path "$SET" "$c")"
  if [ -z "$rel" ] || [ ! -f "$REPO/$rel" ]; then SUMMARY+=("$c	SKIP (no source)"); log ">> $c: SKIP"; continue; fi
  why="$(toolchain_skip_reason "$SET" "$c" "$rel")"
  if [ -n "$why" ]; then
    SUMMARY+=("$c	SKIP ($why)"); log ">> $c: SKIP — $why"; continue
  fi
  LOG="$HARNESS/results/${SET}_${c}.log"; rc=1
  # A failed flush means stale keys leak into the next example -> unreliable
  # results, so abort loudly rather than test against leftover state.
  if ! redis-cli flushall >/dev/null 2>&1; then
    log "ERROR: 'redis-cli flushall' failed before $c — aborting to avoid testing against stale keys."
    exit 1
  fi
  log ">> $c: running... ($rel)"
  if [ "$MODE" = fidelity ]; then
    run_fidelity "$REPO/$rel" "$c"
  else
    # Portable runners are named after the legacy runner key, not the canonical one.
    portable="$(tsv_get "$c" 11)"
    if [ -z "$portable" ] || [ "$portable" = "-" ]; then
      printf 'no portable runner for %s; try --fidelity\n' "$c" >"$LOG"; rc=1
    else
      "run_${portable//-/_}" "$REPO/$rel"
    fi
  fi
  if [ "${rc:-1}" -eq 0 ]; then SUMMARY+=("$c	PASS"); log ">> $c: PASS"
  else SUMMARY+=("$c	FAIL (results/${SET}_${c}.log)"); log ">> $c: FAIL"; fi
done

log ""; log "=== RESULTS: $SET ==="
for e in "${SUMMARY[@]}"; do printf '  %-18s %s\n' "${e%%	*}" "${e#*	}"; done

# Exit non-zero if any client FAILed, so the harness can gate CI.
for e in "${SUMMARY[@]}"; do case "$e" in *FAIL*) exit 1;; esac; done
exit 0
