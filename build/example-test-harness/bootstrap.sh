#!/usr/bin/env bash
# Materialise the fidelity test environment at tmp/clients/examples/.
#
#   ./bootstrap.sh              # scaffold all clients; clone/update client repos
#   ./bootstrap.sh --no-clone   # scaffold only (skip git clone/fetch)
#   ./bootstrap.sh --check      # report what's missing, change nothing
#
# Fidelity mode runs each example the way the client repo runs it: real dependency
# manifests (tracked in fidelity/), real toolchains. That environment used to exist only
# as a zip passed around by hand — this script replaces it, so the setup is reviewable in
# a PR and reproducible on a new machine.
#
# The per-client run.sh wrappers are GENERATED here rather than tracked. They are one to
# three lines each and differed only in the command; committing thirteen near-identical
# wrappers (with three different argument conventions between them) was the thing that
# made the old environment hard to drive. Client identity comes from clients.tsv.
#
# Idempotent: safe to re-run. Keep bash 3.2 compatible (macOS system bash).
set -uo pipefail

HARNESS="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HARNESS/../.." && pwd)"
TSV="$HARNESS/clients.tsv"
FID="$HARNESS/fidelity"
DEST="$REPO/tmp/clients/examples"
CLONES="$REPO/tmp/clients"

CLONE=1; CHECK=0
while [ $# -gt 0 ]; do
  case "$1" in
    --no-clone) CLONE=0; shift ;;
    --check) CHECK=1; CLONE=0; shift ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

[ -f "$TSV" ] || { echo "ERROR: missing $TSV" >&2; exit 1; }
say() { printf '%s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }

# Repos that must be cloned for fidelity testing. NRedisStack is special: it is a full
# clone, not scaffolding — the C# examples build against that repo's own Doc.csproj,
# which project-references NRedisStack.csproj and NRedisStack.Tests.csproj.
CLONE_REPOS="
NRedisStack|https://github.com/redis/NRedisStack
lettuce|https://github.com/redis/lettuce
redis-rb|https://github.com/redis/redis-rb
"

# client-key|source file in fidelity/|destination filename
MANIFESTS="
redis-py|requirements-redis-py.txt|requirements.txt
node-redis|package-node-redis.json|package.json
ioredis|package-ioredis.json|package.json
go-redis|go-redis.mod|go.mod
jedis|pom-jedis.xml|pom.xml
lettuce-sync|pom-lettuce-sync.xml|pom.xml
lettuce-async|pom-lettuce-async.xml|pom.xml
lettuce-reactive|pom-lettuce-reactive.xml|pom.xml
predis|composer-predis.json|composer.json
ruby|Gemfile-ruby|Gemfile
rust-sync|Cargo-rust-sync.toml|Cargo.toml
rust-async|Cargo-rust-async.toml|Cargo.toml
hiredis||
"

tsv_get() { awk -F'\t' -v k="$1" -v f="$2" '!/^#/ && NF>1 && $1==k {print $f; exit}' "$TSV"; }

# Emit the run.sh for one client. $1 = client key.
# Each wrapper takes the staged file's basename as $1 so the driver can treat every
# client identically, then tears down its dependency cache — matching the behaviour of
# the hand-built environment this replaces (every run installs from scratch).
emit_runner() {
  case "$1" in
    redis-py) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <staged_file.py>
set -uo pipefail
python3 -m venv venv
./venv/bin/pip -q install -r requirements.txt
./venv/bin/python "$1"; rc=$?
rm -fr venv
exit $rc
EOF
;;
    node-redis|ioredis) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <staged_file.js>
set -uo pipefail
npm install --silent
node "$1"; rc=$?
rm -fr node_modules package-lock.json
exit $rc
EOF
;;
    go-redis) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <staged_file_test.go>
set -uo pipefail
# The examples declare `package example_commands`, so the module needs a second file in
# that package or the build fails before any test runs.
[ -f lib.go ] || printf 'package example_commands\n' > lib.go
go mod tidy >/dev/null 2>&1
go test -v ./...; rc=$?
rm -f go.sum
exit $rc
EOF
;;
    jedis|lettuce-sync|lettuce-async|lettuce-reactive) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <StagedFile.java>
set -uo pipefail
out="$(mvn -B test 2>&1)"; rc=$?
printf '%s\n' "$out"
# Surefire exits 0 when it matches no tests. These classes are named *Example, not
# *Test, so a pom missing the *Example include silently "passes" having run nothing.
# Treat a zero/absent test count as failure rather than a green.
if ! printf '%s' "$out" | grep -qE 'Tests run: [1-9]'; then
  echo "HARNESS ERROR: surefire ran zero tests — check the *Example include in pom.xml"
  rc=1
fi
rm -fr target
exit $rc
EOF
;;
    predis) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <StagedFileTest.php>
set -uo pipefail
composer install -q
./vendor/bin/phpunit "$1"; rc=$?
rm -fr composer.lock vendor
exit $rc
EOF
;;
    ruby) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <staged_file.rb>
set -uo pipefail
bundle install --quiet --path .gems
bundle exec ruby "$1"; rc=$?
rm -fr .gems Gemfile.lock .bundle
exit $rc
EOF
;;
    rust-sync|rust-async) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <staged_file.rs>   (staged into tests/)
set -uo pipefail
cargo test -- --nocapture; rc=$?
rm -fr Cargo.lock target
exit $rc
EOF
;;
    hiredis) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <staged_file.c>
set -uo pipefail
bin="${1%.c}"
cc "$1" -I/usr/local/include -I/opt/homebrew/include \
       -L/usr/local/lib -L/opt/homebrew/lib -lhiredis -o "$bin" || exit 1
"./$bin"; rc=$?
rm -f "$bin"
exit $rc
EOF
;;
    nredisstack|seredis|nredisstack-async|seredis-async) cat <<'EOF'
#!/bin/bash
# usage: ./run.sh <StagedFile.cs>
# Runs inside the NRedisStack clone: tests/Doc builds against that repo's own
# Doc.csproj, so both C# flavours (NRedisStack-importing and plain SE.Redis) execute
# with the real fixtures rather than stubs.
set -uo pipefail
cls="$(basename "$1" .cs)"
out="$(dotnet test tests/Doc --nologo --filter "FullyQualifiedName~$cls" 2>&1)"; rc=$?
printf '%s\n' "$out"
if printf '%s' "$out" | grep -qE 'No test (matches|is available)'; then
  echo "HARNESS ERROR: no test matched $cls — check the [Fact] survived outside a REMOVE block"
  rc=1
fi
exit $rc
EOF
;;
    *) return 1 ;;
  esac
}

# --- clone / update client repos ---------------------------------------------
if [ "$CLONE" = 1 ]; then
  mkdir -p "$CLONES"
  for entry in $CLONE_REPOS; do
    name="${entry%%|*}"; url="${entry##*|}"
    if [ -d "$CLONES/$name/.git" ]; then
      say ">> updating $name"
      ( cd "$CLONES/$name" && git fetch --quiet --depth 1 origin ) || warn "fetch failed for $name"
    else
      say ">> cloning $name"
      git clone --quiet --depth 1 "$url" "$CLONES/$name" || warn "clone failed for $name"
    fi
  done
fi

# --- scaffold each client ----------------------------------------------------
missing=0
for entry in $MANIFESTS; do
  client="$(echo "$entry" | cut -d'|' -f1)"
  src="$(echo "$entry" | cut -d'|' -f2)"
  dst="$(echo "$entry" | cut -d'|' -f3)"
  dir="$(tsv_get "$client" 9)"
  sub="$(tsv_get "$client" 10)"
  [ -n "$dir" ] && [ "$dir" != "-" ] || { warn "$client has no fid_dir in clients.tsv"; continue; }
  target="$DEST/$dir"

  if [ "$CHECK" = 1 ]; then
    if [ -x "$target/run.sh" ]; then say "ok      $client -> $target"
    else say "MISSING $client -> $target"; missing=$((missing+1)); fi
    continue
  fi

  mkdir -p "$target"
  [ "$sub" = "." ] || mkdir -p "$target/$sub"
  if [ -n "$src" ]; then
    [ -f "$FID/$src" ] || { warn "missing fidelity/$src"; continue; }
    cp "$FID/$src" "$target/$dst"
  fi
  if emit_runner "$client" > "$target/run.sh"; then
    chmod +x "$target/run.sh"
    say "scaffolded $client -> $target"
  else
    rm -f "$target/run.sh"; warn "no runner defined for $client"
  fi
done

# The C# clients share the NRedisStack clone; give it the runner too.
if [ "$CHECK" = 0 ] && [ -d "$DEST/NRedisStack" ]; then
  emit_runner nredisstack > "$DEST/NRedisStack/run.sh" && chmod +x "$DEST/NRedisStack/run.sh"
  say "scaffolded nredisstack/seredis -> $DEST/NRedisStack"
elif [ "$CHECK" = 0 ]; then
  # Fidelity C# needs the full repo, not scaffolding: link the clone into place.
  if [ -d "$CLONES/NRedisStack" ]; then
    ln -sfn "$CLONES/NRedisStack" "$DEST/NRedisStack"
    emit_runner nredisstack > "$CLONES/NRedisStack/run.sh" && chmod +x "$CLONES/NRedisStack/run.sh"
    say "linked NRedisStack clone -> $DEST/NRedisStack"
  else
    warn "no NRedisStack clone; C# fidelity testing unavailable (re-run without --no-clone)"
  fi
fi

# --- toolchain report --------------------------------------------------------
say ""
say "=== toolchains ==="
# redis-server is listed separately from redis-cli on purpose: the harness needs the CLI
# to ping and flush, but nothing runs without a server to point it at, and having only
# the CLI installed is an easy state to end up in.
for t in python3 node npm go mvn cargo php composer ruby bundle dotnet redis-cli redis-server; do
  if command -v "$t" >/dev/null 2>&1; then printf '  %-10s ok\n' "$t"
  else printf '  %-10s MISSING\n' "$t"; fi
done
if ! (echo '#include <hiredis/hiredis.h>' | cc -fsyntax-only -I/usr/local/include -I/opt/homebrew/include -xc - 2>/dev/null); then
  printf '  %-10s MISSING (brew install hiredis) — C examples cannot be tested\n' "hiredis"
else
  printf '  %-10s ok\n' "hiredis"
fi

if [ "$CHECK" = 1 ]; then
  say ""; say "$missing client(s) not scaffolded"
  [ "$missing" -eq 0 ] || exit 1
fi
say ""
say "Next: start a scratch Redis, then"
say "  build/example-test-harness/run.sh --fidelity <example_set>"
