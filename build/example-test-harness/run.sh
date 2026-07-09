#!/usr/bin/env bash
# Reusable TCE example test harness.
# Runs a docs example set's client source files against a live (throwaway) Redis
# on localhost:6379, using each library's real in-file assertions.
#
# Usage:  ./run.sh <example_set> [client ...]
#   example_set : ss_tutorial | set_tutorial   (add more in src_path())
#   client      : one or more of the CLIENTS below; default = all
#
# Assumes a SCRATCH Redis on 6379 — several examples FLUSH the db.
set -uo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
HARNESS="$(cd "$(dirname "$0")" && pwd)"
WORK="$HARNESS/work"; mkdir -p "$WORK"
SET="${1:?usage: run.sh <example_set> [client...]}"; shift || true

CLIENTS_ALL=(python node go jedis ruby rust-sync rust-async lettuce-async lettuce-reactive php dotnet)
CLIENTS=("$@"); [ ${#CLIENTS[@]} -eq 0 ] && CLIENTS=("${CLIENTS_ALL[@]}")

# --- example_set + client -> repo-relative source path -----------------------
src_path() {
  local set="$1" client="$2"
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
    time_series_tutorial:python) echo local_examples/time_series_tutorial/redis-py/dt_time_series.py ;;
    time_series_tutorial:go)     echo local_examples/time_series_tutorial/go-redis/timeseries_tut_test.go ;;
    time_series_tutorial:jedis)  echo local_examples/time_series_tutorial/jedis/TimeSeriesTutorialExample.java ;;
    time_series_tutorial:node)   echo local_examples/time_series_tutorial/node-redis/dt-time-series.js ;;
    time_series_tutorial:dotnet) echo local_examples/time_series_tutorial/nredisstack/TimeSeriesTutorial.cs ;;
    # search_quickstart / geoindex: python, go, jedis, dotnet PASS (pom-jedis.xml is
    # 7.5.3, which has both the RedisClient API these examples use and the older
    # UnifiedJedis API). One known gap (DOC-6823): node search_quickstart's wildcard
    # assertion is RediSearch-version-order-dependent (documents[0].id) and fails on
    # Redis 8.8 — a test-only REMOVE-block assert, not docs-visible.
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
run_node() {
  local d="$WORK/node"; mkdir -p "$d"
  [ -d "$d/node_modules/redis" ] || { printf '{"type":"module"}\n' >"$d/package.json"; (cd "$d" && npm i -s redis >/dev/null 2>&1); }
  cp "$1" "$d/example.mjs"; (cd "$d" && node example.mjs) >"$LOG" 2>&1; rc=$?
}
run_go() {
  local d="$WORK/go"; mkdir -p "$d"
  if [ ! -f "$d/go.mod" ]; then
    (cd "$d" && go mod init tce.local >/dev/null 2>&1 && printf 'package example_commands\n' >lib.go \
      && go get github.com/redis/go-redis/v9 >/dev/null 2>&1)
  fi
  cp "$1" "$d/ex_test.go"; (cd "$d" && go test ./... ) >"$LOG" 2>&1; rc=$?
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
  (cd "$d" && mvn -q -B test) >"$LOG" 2>&1; rc=$?
}
run_jedis()            { run_maven_java "$1" "$WORK/jedis"    io/redis/examples ; }
run_lettuce_async()    { run_maven_java "$1" "$WORK/lettuce-async"   io/redis/examples/async ; }
run_lettuce_reactive() { run_maven_java "$1" "$WORK/lettuce-reactive" io/redis/examples/reactive ; }
run_dotnet() { # stubs NRedisStack.Tests fixtures so the file runs under plain xunit
  local d="$WORK/dotnet"; mkdir -p "$d"
  cp "$HARNESS/dotnet/harness.csproj" "$d/harness.csproj"
  cp "$HARNESS/dotnet/stubs.cs"       "$d/stubs.cs"
  cp "$HARNESS/dotnet/GlobalUsings.cs" "$d/GlobalUsings.cs"
  rm -f "$d"/Example_*.cs; cp "$1" "$d/Example_src.cs"
  (cd "$d" && dotnet test --nologo) >"$LOG" 2>&1; rc=$?
}
run_php() {
  local d="$WORK/php"; mkdir -p "$d"
  [ -d "$d/vendor/predis" ] || { printf '{}\n' >"$d/composer.json"; (cd "$d" && composer -q require predis/predis >/dev/null 2>&1); }
  cat >"$d/bootstrap.php" <<'PHP'
<?php
class PredisTestCase {
  function assertEquals($e,$a,$m=''){ if($e!=$a) throw new Exception("assertEquals: expected ".var_export($e,true)." got ".var_export($a,true)); }
  function assertSame($e,$a,$m=''){ if($e!==$a) throw new Exception("assertSame failed"); }
  function assertTrue($c,$m=''){ if($c!==true) throw new Exception("assertTrue failed"); }
  function assertFalse($c,$m=''){ if($c!==false) throw new Exception("assertFalse failed"); }
  function assertNull($v,$m=''){ if($v!==null) throw new Exception("assertNull failed"); }
}
PHP
  cp "$1" "$d/example.php"
  (cd "$d" && php -r '
    require "bootstrap.php";
    $before=get_declared_classes();
    require "example.php";
    $cls=array_values(array_diff(get_declared_classes(),$before));
    $c=end($cls); $o=new $c();
    foreach(get_class_methods($o) as $m){ if(strpos($m,"test")===0){ $o->$m(); } }
    fwrite(STDERR,"OK\n");
  ') >"$LOG" 2>&1; rc=$?
}

# --- drive --------------------------------------------------------------------
log "=== TCE sweep: $SET  (redis @ localhost:6379) ==="
# Fail fast if the scratch Redis is unreachable — every run FLUSHes it and relies
# on a clean db, so silently proceeding would give misleading pass/fail results.
if ! redis-cli ping >/dev/null 2>&1; then
  log "ERROR: no Redis responding on localhost:6379 — start a throwaway Redis first."
  exit 1
fi
mkdir -p "$HARNESS/results"
for c in "${CLIENTS[@]}"; do
  rel="$(src_path "$SET" "$c")"
  if [ -z "$rel" ] || [ ! -f "$REPO/$rel" ]; then SUMMARY+=("$c	SKIP (no source)"); log ">> $c: SKIP"; continue; fi
  LOG="$HARNESS/results/${SET}_${c}.log"; rc=1
  # A failed flush means stale keys leak into the next example -> unreliable
  # results, so abort loudly rather than test against leftover state.
  if ! redis-cli flushall >/dev/null 2>&1; then
    log "ERROR: 'redis-cli flushall' failed before $c — aborting to avoid testing against stale keys."
    exit 1
  fi
  log ">> $c: running..."
  "run_${c//-/_}" "$REPO/$rel"
  if [ "${rc:-1}" -eq 0 ]; then SUMMARY+=("$c	PASS"); log ">> $c: PASS"
  else SUMMARY+=("$c	FAIL (results/${SET}_${c}.log)"); log ">> $c: FAIL"; fi
done

log ""; log "=== RESULTS: $SET ==="
for e in "${SUMMARY[@]}"; do printf '  %-18s %s\n' "${e%%	*}" "${e#*	}"; done
