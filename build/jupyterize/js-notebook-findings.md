# JavaScript (node-redis) notebook findings

Investigation date: 2026-06-19. Context: extending the jupyterize → verify →
binder-launchers pipeline beyond Python, starting with node-redis (the
time-series tutorial, `dt-time-series.js` from the node-redis doctests).

## TL;DR

- **jupyterize itself handles JS fine.** node-redis examples are flat
  top-level-`await` scripts with `//` markers — no unwrapping needed, just like
  Python. Generation (ship + test notebooks, asserts retained) works.
- **One real jupyterize bug fixed:** it emitted kernel name `javascript`, but
  the `binder-nodejs-base` image has no such kernel — its JS kernel is `jslab`
  (from the `tslab` package). Changed `config.py` node.js → `jslab`. (Every
  existing `nodejs-*` notebook declares the non-existent `javascript`, so they
  are mis-kernel'd for automated execution too.)
- **The blocker is the kernel (`tslab`/`jslab`), not jupyterize.** It is a poor
  fit for the automated nbconvert assert-gate, for two compounding reasons
  (below). Recommended path: verify non-Python examples via their **native
  harness** (`node script.js`), and treat notebook-kernel execution as a lighter
  "does it run/display in Binder" check.

## Environment facts (binder-nodejs-base @sha256:8c3563d8…)

- JS kernels installed: `jslab` and `tslab` (both from the `tslab` npm package).
  `jslab` = `tslab kernel --js`. There is **no** `javascript` or `ijavascript`
  kernel.
- `jslab` **does** start and execute under amd64 emulation on Apple Silicon
  (unlike Python's ipykernel, which hangs under qemu). So local JS testing is
  possible — but see the reliability caveats below.
- node-redis is **v5.12.1** (ESM), installed at `/home/jovyan/node_modules` with
  empty `NODE_PATH`. Node only resolves `redis` when the notebook runs from
  `/home/jovyan` (which Binder does via `ADD demo.ipynb .` → WORKDIR). A verify
  step that runs from elsewhere must `cd /home/jovyan` or set `NODE_PATH`.

## Blocker 1 — tslab hardcodes type-checking

`tslab` runs the TypeScript compiler over each JS cell and sets
`checkJs: true` **in code** (`converter.js:~221`), passed directly to the
compiler — it is **not** merged with any user `tsconfig.json`. Execution is
gated on pre-emit diagnostics (`converter.js:272`).

Consequence: node-redis v5's heavily-generic return types don't survive tslab's
**cross-cell `.d.ts` declaration emission** (each cell's vars are emitted to a
declaration file the next cell imports). They collapse to `string`, so e.g.
`info.totalSamples` / `res.sourceKey` fail with *"Property does not exist on
type 'string'"* and the cell never runs.

Things that do **not** fix it:
- A `tsconfig.json` with `checkJs:false` — ignored (hardcoded value wins).
- `// @ts-nocheck` per cell — the bad type lives in the emitted dependency
  `.d.ts`, not the annotated cell.

What does get past it: patching the vendored file in the image
(`sed -i 's/checkJs: true/checkJs: false/' …/tslab/dist/converter.js`, needs
root at build time). Cells then execute. But that exposes Blocker 2.

## Blocker 2 — tslab's error reporting through nbconvert is unreliable

With `checkJs:false`, runtime behaviour through nbconvert is inconsistent:
- A **standalone failing assert** correctly raises `CellExecutionError`
  (nbconvert exits non-zero) — so the gate *can* catch errors.
- But the **correct** full notebook *also* fails without `--allow-errors`
  (some cell returns an error-status reply), while *with* `--allow-errors` it
  shows **no error outputs at all** and step cells emit **no stdout**.

So there is no clean "good → pass / broken → fail" signal from tslab+nbconvert.
This is the real reason node verification via the notebook kernel isn't viable
as-is. It is a tslab limitation; Python's ipykernel (the reference kernel)
reports errors and outputs cleanly, which is why Python "just worked".

## Recommendation for non-Python verification

Verify the example in its **native test harness** rather than through the
notebook kernel. The source files *are* the client repos' doctests, designed to
run as `node script.js` / `go test` / etc., where asserts gate via process exit.
Split the two concerns:

1. **Correctness gate** = native runner (reliable assert gating).
2. **Notebook check** = "executes/displays in the Binder kernel" (lighter; for
   JS still needs the `checkJs:false` image patch so tslab doesn't reject valid
   JS).

jupyterize (generation) is unaffected and remains the deterministic core.

## Cross-client probe (2026-06-19): which kernels gate?

Ran a two-question probe (does jupyterize's kernel name match the image; does a
deliberately-failing cell gate through nbconvert) against all four base images.

| Client | Kernel (image) | jupyterize name | Name OK? | Good cell runs? | Failing cell gates? |
|--------|----------------|-----------------|----------|-----------------|---------------------|
| Python (redis-py) | ipykernel `python3` | `python3` | ✓ | ✓ | ✓ exit 1, `error` output |
| Java (Jedis) | IJava `java` | `java` | ✓ | ✓ (prints 42) | ✓ exit 1, `EvalException` |
| C# (NRedisStack) | .NET Interactive `.net-csharp` | `.net-csharp` | ✓ | ✓ (prints 42) | ✓ exit 1, `Error` |
| Go (go-redis) | GoNB `gonb` | ~~`gophernotes`~~ → fixed to `gonb` | was ✗, now ✓ | ✓ (prints 42) | ✗ panic → stream, **exit 0** |
| Node (node-redis) | tslab `jslab` | ~~`javascript`~~ → fixed to `jslab` | was ✗, now ✓ | ✓ | ✗ error → stream, **exit 0** |

**Pattern:** in-process kernels (IPython, JShell/IJava, .NET Interactive) raise
proper Jupyter `error` messages, so the nbconvert assert-gate works. Kernels
that compile-and-run a subprocess (tslab→node, GoNB→go) capture the subprocess
stderr as a *stream* and don't propagate failure status — so the gate is hollow.

**Implications:**
- **Java & C#**: the notebook-kernel verify gate works, same as Python. Remaining
  risk is jupyterize's regex *unwrapper* (these examples are wrapped in
  class/method scaffolding, unlike the flat Python/Node scripts) — a
  generation-correctness question, not a kernel one.
- **Go & Node**: notebook-kernel gating does not work. Verify via the native
  harness (`go test`, `node script.js`) instead; treat notebook execution as a
  lighter "displays/runs in Binder" check (Node also needs the tslab
  `checkJs:false` image patch).
- Kernel-name fixes applied in `config.py`: node.js → `jslab`, go → `gonb`.

## Java / Jedis end-to-end attempt (2026-06-19)

Ran the time-series example (`TimeSeriesTutorialExample.java` from the jedis
doctests) through the full workflow. Two findings:

1. **The unwrapper works well.** From a `public class { @Test public void run()
   { … } }` wrapper, jupyterize correctly stripped the class / `@Test` / method /
   `package` lines and the junit asserts, and hoisted the real imports
   (`RedisClient`, `timeseries.*`, `java.util.*`) to the top — producing clean
   flat JShell statements matching the existing `jedis-dt-list` notebook shape.
2. **Two real issues:**
   - **Blocker — jedis version lag.** binder-java-base ships **jedis 5.1.0**
     (has `UnifiedJedis`, NOT `RedisClient`). The example uses `RedisClient`
     (jedis 6.x), so cell 0's `import redis.clients.jedis.RedisClient` fails with
     "cannot find symbol" and cascades to all cells. Needs a base-image jedis
     bump to 6.x — same shape as the Python AR*/redis-py version lags.
   - **Unwrapper bug — trailing close braces.** The wrapper's closing `}` (method)
     and `}` (class) are in the LAST cell, but jupyterize unwraps each cell
     independently and the opening `{`s are in cell 0 — so its brace-balancing
     can't pair them, and the final cell keeps `}\n}`. This breaks the last
     cell's compile even after a jedis bump. Affects all wrapped languages
     (Java/C#/Go). Go's config has a `closing_braces` pattern that strips
     orphan `}` lines; Java/C# need the same (or a global trailing-brace pass).

Net: Jedis is pipeline-ready *pending* (a) a base-image jedis 6.x bump and (b)
the trailing-brace unwrapper fix. The hard parts — unwrapping and IJava error
gating — are sound. Branch NOT created (would be red on both counts).

## Open questions

- Why was `ijavascript` rejected? If those reasons don't extend to a **Deno**
  Jupyter kernel, Deno runs JS/TS without tslab's checking quirks and may be a
  cleaner kernel choice.
- Whether to patch `checkJs:false` into `binder-nodejs-base` regardless, since
  notebooks won't even *display*/run in the kernel without it.
