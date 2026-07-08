---
categories:
- docs
- operate
- stack
- oss
linkTitle: Build flags and notes
title: Build flags and general notes
weight: 1
---

The pages in this section provide platform-specific instructions for building and running Redis Open Source from source. This page describes the build flags and general notes that apply across all platforms. For the prerequisites and step-by-step instructions for your operating system, see the platform pages that follow.

## Supported platforms

Redis can be compiled and used on Linux, OSX, OpenBSD, NetBSD, and FreeBSD. We support big endian and little endian architectures, and both 32 bit and 64 bit systems.

It may compile on Solaris derived systems (for instance SmartOS) but our support for this platform is _best effort_ and Redis is not guaranteed to work as well as on Linux, OSX, and \*BSD.

## Build flags

### Build with all data structures

To build Redis with all the data structures (including JSON, time series, Bloom filter, cuckoo filter, count-min sketch, top-k, and t-digest) and with the Redis Query Engine, first make sure that all the prerequisites are installed (see the build instructions for your operating system). Then use the following flag in the `make` command:

```sh
make BUILD_WITH_MODULES=yes
```

{{< note >}}
`BUILD_WITH_MODULES=yes` is not supported on 32 bit systems.
{{< /note >}}

### Build with just the core data structures

To build Redis with just the core data structures, use:

```sh
make
```

### Build with TLS support

To build with TLS support, you need OpenSSL development libraries (for example, `libssl-dev` on Debian/Ubuntu) and the following flag in the `make` command:

```sh
make BUILD_TLS=yes
```

### Build with systemd support

To build with systemd support, you need systemd development libraries (such as `libsystemd-dev` on Debian/Ubuntu or `systemd-devel` on CentOS), and the following flag:

```sh
make USE_SYSTEMD=yes
```

### Append a suffix to Redis program names

To append a suffix to Redis program names, add the following flag:

```sh
make PROG_SUFFIX="-alt"
```

### Build a 32 bit binary

You can build a 32 bit Redis binary using:

```sh
make 32bit
```

### Run the tests

After building Redis, it is a good idea to test it using:

```sh
make test
```

If TLS is built, you can run the tests with TLS enabled (you will need `tcl-tls` installed):

```sh
./utils/gen-test-certs.sh
./runtest --tls
```

## Fixing build problems with dependencies or cached build options

Redis has some dependencies which are included in the `deps` directory. `make` does not automatically rebuild dependencies even if something in the source code of dependencies changes.

When you update the source code with `git pull` or when code inside the dependencies tree is modified in any other way, make sure to use the following command in order to really clean everything and rebuild from scratch:

```sh
make distclean
```

This will clean: jemalloc, lua, hiredis, linenoise and other dependencies.

Also, if you force certain build options like 32 bit target, no C compiler optimizations (for debugging purposes), and other similar build time options, those options are cached indefinitely until you issue a `make distclean` command.

## Fixing problems building 32 bit binaries

If after building Redis with a 32 bit target you need to rebuild it with a 64 bit target, or the other way around, you need to perform a `make distclean` in the root directory of the Redis distribution.

In case of build errors when trying to build a 32 bit binary of Redis, try the following steps:

- Install the package `libc6-dev-i386` (also try `g++-multilib`).
- Try using the following command line instead of `make 32bit`:

  ```sh
  make CFLAGS="-m32 -march=native" LDFLAGS="-m32"
  ```

## Allocator

Selecting a non-default memory allocator when building Redis is done by setting the `MALLOC` environment variable. Redis is compiled and linked against libc malloc by default, except for jemalloc being the default on Linux systems. This default was picked because jemalloc has proven to have fewer fragmentation problems than libc malloc.

To force compiling against libc malloc, use:

```sh
make MALLOC=libc
```

To compile against jemalloc on Mac OS X systems, use:

```sh
make MALLOC=jemalloc
```

## Monotonic clock

By default, Redis will build using the POSIX `clock_gettime` function as the monotonic clock source. On most modern systems, the internal processor clock can be used to improve performance. Cautions can be found here: [http://oliveryang.net/2015/09/pitfalls-of-TSC-usage/](http://oliveryang.net/2015/09/pitfalls-of-TSC-usage/)

On ARM aarch64 systems, the hardware clock is enabled by default because the ARM Generic Timer is architecturally guaranteed to be available and monotonic on all ARMv8-A processors (see the *"The Generic Timer in AArch64 state"* section of the *Arm Architecture Reference Manual for Armv8-A*).

To build with support for the processor's internal instruction clock on other architectures, use:

```sh
make CFLAGS="-DUSE_PROCESSOR_CLOCK"
```

## Verbose build

Redis will build with a user-friendly colorized output by default. If you want to see a more verbose output, use the following:

```sh
make V=1
```

## Running Redis with TLS

Please consult the [TLS.md](https://github.com/redis/redis/blob/unstable/TLS.md) file in the Redis source distribution for more information on how to use Redis with TLS.

## Running Redis with the Redis Search and optional proprietary Intel SVS-VAMANA optimizations

{{< note >}}
**License disclaimer**

If you are using Redis Open Source under AGPLv3 or SSPLv1, you cannot use it together with the Intel optimizations (LeanVec and LVQ binaries). The reason is that the Intel SVS license is not compatible with those licenses.

The LeanVec and LVQ techniques are closed source and are only available for use with Redis Open Source when distributed under the RSALv2 license. For more details, please refer to the information provided by Intel [here](https://github.com/intel/ScalableVectorSearch).
{{< /note >}}

By default, Redis with Redis Search supports the SVS-VAMANA index with global 8-bit quantization. To compile Redis with the Intel SVS-VAMANA optimizations, LeanVec and LVQ, use the following:

```sh
make BUILD_INTEL_SVS_OPT=yes
```

Alternatively, you can export the variable before running the build step for your platform:

```sh
export BUILD_INTEL_SVS_OPT=yes
make
```
