---
aliases:
- /develop/interact/search-and-query/deprecated/development
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Notes on RediSearch debugging, testing, and documentation
linkTitle: Developer notes
title: Developer notes
weight: 3
---

Developing RediSearch features involves setting up a development environment (which can be either Linux-based or macOS-based), building the module, running tests and benchmarks, and debugging both the module and its tests.

## Cloning the git repository

Run the following command to clone the RediSearch module and its submodules:

```sh
git clone --recursive https://github.com/RediSearch/RediSearch.git
```

## Working in an isolated environment

There are several reasons to develop in an isolated environment, like keeping your workstation clean, and developing for a different Linux distribution.
The most general option for an isolated environment is a virtual machine. It's very easy to set one up using [Vagrant](https://www.vagrantup.com)).
Docker is even more agile, as it offers an almost instant solution:

```
search=$(docker run -d -it -v $PWD:/build debian:bullseye bash)
docker exec -it $search bash
```

Then, from within the container, `cd /build` and go on as usual.

In this mode, all installations remain in the scope of the Docker container.
Upon exiting the container, you can either re-invoke it with the above `docker exec` or commit the state of the container to an image and re-invoke it at a later stage:

```
docker commit $search redisearch1
docker stop $search
search=$(docker run -d -it -v $PWD:/build rediseatch1 bash)
docker exec -it $search bash
```

You can replace `debian:bullseye` with your choice of OS, with the host OS being the best choice allowing you to run the RediSearch binary on your host after it is built.

## Installing prerequisites

To build and test RediSearch you need to install several packages, depending on the underlying OS. The following OSes are supported:
- Ubuntu 18.04
- Ubuntu 20.04
- Ubuntu 22.04
- Debian linux 11
- Rocky linux 8
- Rocky linux 9
- Amazon linux 2
- Mariner 2.0
- MacOS

To install the prerequisites on your system using a setup script, first enter the `RediSearch` directory and then run:

```
cd ./install
./install_script.sh sudo
./install_boost.sh 1.83.0
```

Note that this will install various packages on your system using the native package manager (`sudo` is not required in a Docker environment).

If you prefer to avoid that, you can:

* Review the relevant setup scripts under the `./install` directory and install packages manually.
* Use an isolated environment as explained above.


## Installing Redis
As a rule of thumb, you should run the latest Redis version.

If your OS has a Redis 7.x package, you can install it using the OS package manager.

Otherwise, you can build it from source and install it as described in [redis GitHub page](https://github.com/redis/redis).

## Getting help

```make help``` provides a quick summary of the development features. Following is a partial list that contains  the most common and relevant ones:

```
make fetch         # download and prepare dependant modules

make build          # compile and link
  COORD=1             # build coordinator
  DEBUG=1             # build for debugging
  NO_TESTS=1          # disable unit tests
  WHY=1               # explain CMake decisions (in /tmp/cmake-why)
  FORCE=1             # Force CMake rerun (default)
  CMAKE_ARGS=...      # extra arguments to CMake
  VG=1                # build for Valgrind
  SAN=type            # build with LLVM sanitizer (type=address|memory|leak|thread) 
  SLOW=1              # do not parallelize build (for diagnostics)
  GCC=1               # build with GCC (default unless Sanitizer)
  CLANG=1             # build with CLang
  STATIC_LIBSTDCXX=0  # link libstdc++ dynamically (default: 1)
make parsers       # build parsers code (required after chaging files under query_parser dir)
make clean         # remove build artifacts
  ALL=1              # remove entire artifacts directory

make run           # run redis with RediSearch
  COORD=1            # run three local shards with coordinator (assuming the module was built with coordinator support)
  GDB=1              # invoke using gdb

make test          # run all tests
  COORD=1            # test coordinator
  TEST=name          # run specified test
make pytest        # run python tests (tests/pytests)
  COORD=1            # test coordinator 
  TEST=name          # e.g. TEST=test:testSearch
  RLTEST_ARGS=...    # pass args to RLTest
  REJSON=1|0|get     # also load JSON module (default: 1)
  REJSON_PATH=path   # use JSON module at `path`
  EXT=1              # External (existing) environment
  GDB=1              # RLTest interactive debugging
  VG=1               # use Valgrind
  VG_LEAKS=0         # do not search leaks with Valgrind
  SAN=type           # use LLVM sanitizer (type=address|memory|leak|thread) 
make unit-tests    # run unit tests (C and C++)
  TEST=name          # e.g. TEST=FGCTest.testRemoveLastBlock
make c_tests       # run C tests (from tests/ctests)
make cpp_tests     # run C++ tests (from tests/cpptests)

make callgrind     # produce a call graph
  REDIS_ARGS="args"

make sanbox        # create container with CLang Sanitizer
```

## Building from source

Run the following from the project root dir:

```make build``` will build RediSearch.

`make build COORD=1` will build Redis Open Source RediSearch Coordinator.

`make build STATIC=1` will build as a static library.

Notes:

* Binary files are placed under `bin`, according to platform and build variant.
* RediSearch uses [CMake](https://cmake.org) as its build system. ```make build``` will invoke both CMake and the subsequent make command that's required to complete the build.

Use ```make clean``` to remove build artifacts. ```make clean ALL=1``` will remove the entire `bin` subdirectory.

### Diagnosing the build process

`make build` will build in parallel by default.

For the purposes of build diagnosis, `make build SLOW=1 VERBOSE=1` can be used to examine compilation commands.

## Running Redis with RediSearch

The following will run ```redis``` and load the RediSearch module.

```
make run
```
You can open ```redis-cli``` in another terminal to interact with it.

## Running tests

There are several sets of unit tests:
* C tests, located in ```tests/ctests```, run by ```make c-tests```.
* C++ tests (enabled by GTest), located in ```tests/cpptests```, run by ```make cpp-tests```.
* Python tests (enabled by RLTest), located in ```tests/pytests```, run by ```make pytest```.

You can run all tests by invoking ```make test```.

A single test can be run using the ```TEST``` parameter, e.g., ```make test TEST=regex```.

## Debugging

To build for debugging (enabling symbolic information and disabling optimization), run ```make DEBUG=1```.
You can then use ```make run DEBUG=1``` to invoke ```gdb```.
In addition to the usual way to set breakpoints in ```gdb```, it is possible to use the ```BB``` macro to set a breakpoint inside the RediSearch code. It will only have an effect when running under ```gdb```.

Similarly, Python tests in a single-test mode, you can set a breakpoint by using the ```BB()``` function inside a test.
