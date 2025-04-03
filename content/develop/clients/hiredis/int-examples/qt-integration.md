---
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
description: Use `hiredis` in conjunction with the Qt app framework.
linkTitle: Qt integration
title: Integrate hiredis with a Qt app
weight: 50
---

[Qt](https://www.qt.io/) is a popular cross-platform C++ framework that
you can use to build command line and GUI apps. This guide explains how
to use `hiredis` to connect to a Redis server from a Qt app.

## Install Qt

You should first download and install the
[Qt development environment](https://www.qt.io/download-dev) for your
development platform, if you have not already done so. The example
below briefly explains how to use Qt Creator
to manage your project, but see the [Qt Creator](https://doc.qt.io/qtcreator/)
docs for an extensive set of examples and tutorials.

## Create a simple app

We will use a simple console app to demonstrate how to connect
to Redis from Qt. Create the app project in Qt Creator using the
**File > New Project** command. The generated source code is a
single C++ file, called `main.cpp`, that uses a
[`QCoreApplication`](https://doc.qt.io/qt-6/qcoreapplication.html)
object to handle the main event loop. Although it will compile and run,
it doesn't do anything useful at this stage.

## Add `hiredis` files

Build `hiredis` if you have not already done so (see
[Build and install]({{< relref "/develop/clients/hiredis#build-and-install" >}})
for more information). Copy the following files from the `hiredis` folder into
the Header files section of your Qt project:

- `hiredis.h`
- `async.h`
- `alloc.h`
- `read.h`
- `sds.h`
- `adapters/qt.h`

In `qt.h`, edit the line near the top of the file that reads

```c
#include "../async.h"
```

to

```c
#include "async.h"
```

You must do this because `qt.h` is in the same enclosing folder as `async.h` for
this project.

You should also make the `libhiredis` library available to the project. For example,
if you have used the default option of [`cmake`](https://cmake.org/) as the project
build tool and you have installed the `.dylib` or `.so` file for `hiredis` in `/usr/local/lib`,
you should add the following lines to the `CMakeLists.txt` file:

```
add_library(hiredis SHARED IMPORTED)
set_property(TARGET hiredis PROPERTY
             IMPORTED_LOCATION "/usr/local/lib/libhiredis.dylib")
```

You should also modify the `target_link_libraries` directive to include
`hiredis`:

```
target_link_libraries(ConsoleTest Qt${QT_VERSION_MAJOR}::Core hiredis)
```

## Add code to access Redis

You can add a class using the **Add new** context menu
on the project folder in Qt Creator. The sections below give
examples of the code you should add to this class to
connect to Redis. The code is separated into header and
implementation files.

### Header file

The header file for a class called `RedisExample` is shown below.
An explanation follows the code.

```c++
// redisexample.h

#ifndef REDISEXAMPLE_H
#define REDISEXAMPLE_H

#include <QObject>

#include "hiredis.h"
#include "async.h"
#include "qt.h"


class RedisExample : public QObject
{
    Q_OBJECT

public:
    // Constructor
    RedisExample(const char *keyForRedis, const char *valueForRedis, QObject *parent = 0)
        :QObject(parent), m_key(keyForRedis), m_value(valueForRedis) {}

public slots:
    // Slot method to hold the code that connects to Redis and issues
    // commands.
    void run();

signals:
    // Signal to indicate that our code has finished executing.
    void finished();

public:
    // Method to close the Redis connection and signal that we've
    // finished.
    void finish();

private:
    const char *m_key;          // Key for Redis string.
    const char *m_value;        // Value for Redis string.
    redisAsyncContext *m_ctx;   // Redis connection context.
    RedisQtAdapter m_adapter;   // Adapter to let `hiredis` work with Qt.
};

#endif // REDISEXAMPLE_H
```

[`QObject`](https://doc.qt.io/qt-6/qobject.html) is a key Qt class that
implements the [Object model](https://doc.qt.io/qt-6/object.html) for
communication between objects. When you create your class in Qt Creator,
you can specify that you want it to be a subclass of `QObject` (this will
add the appropriate header files and include the `Q_OBJECT` macro in the
class declaration).

The `QObject` communication model uses some instance methods as *signals*
to report events and others as *slots* to act as callbacks that process the
events (see [Signals and slots](https://doc.qt.io/qt-6/signalsandslots.html)
for an introduction). The Qt [meta-object compiler](https://doc.qt.io/qt-6/moc.html)
recognizes the non-standard C++ access specifiers `signals:` and `slots:`  in the
class declaration and adds extra code for them during compilation to enable
the communication mechanism.

In our class, there is a `run()` slot that will implement the code to access Redis.
The code eventually emits a `finished()` signal when it is complete to indicate that
the app should exit.

Our simple example code just sets and gets a Redis
[string]({{< relref "/develop/data-types/strings" >}}) key. The class contains
private attributes for the key and value (following the Qt `m_xxx` naming convention
for class members). These are set by the constructor along with a call to the
`QObject` constructor. The other attributes represent the connection context for
Redis (which should generally be
[asynchronous]({{< relref "/develop/clients/hiredis/connect#asynchronous-connection" >}})
for a Qt app) and an adapter object that `hiredis` uses to integrate with Qt.

### Implementation file

The file that implements the methods declared in the header is shown
below. A full explanation follows the code.

```c++
// redisexample.cpp

#include <iostream>

#include "redisexample.h"


void RedisExample::finish() {
    // Disconnect gracefully.
    redisAsyncDisconnect(m_ctx);

    // Emit the `finished()` signal to indicate that the
    // execution is complete.
    emit finished();
}


// Callback used by our `GET` command in the `run()` method.
void getCallback(redisAsyncContext *, void * r, void * privdata) {

    // Cast data pointers to their appropriate types.
    redisReply *reply = static_cast<redisReply *>(r);
    RedisExample *ex = static_cast<RedisExample *>(privdata);

    if (reply == nullptr || ex == nullptr) {
        return;
    }

    std::cout << "Value: " << reply->str << std::endl;

    // Close the Redis connection and quit the app.
    ex->finish();
}


void RedisExample::run() {
    // Open the connection to Redis.
    m_ctx = redisAsyncConnect("localhost", 6379);

    if (m_ctx->err) {
        std::cout << "Error: " << m_ctx->errstr << std::endl;
        finish();
    }

    // Configure the connection to work with Qt.
    m_adapter.setContext(m_ctx);

    // Issue some simple commands. For the `GET` command, pass a
    // callback function and a pointer to this object instance
    // so that we can access the object's members from the callback.
    redisAsyncCommand(m_ctx, NULL, NULL, "SET %s %s", m_key, m_value);
    redisAsyncCommand(m_ctx, getCallback, this, "GET %s", m_key);
}
```

The code that accesses Redis is in the `run()` method (recall that this
implements a Qt slot that will be called in response to a signal). The
code connects to Redis and stores the connection context pointer in the
`m_ctx` attribute of the class instance. The call to `m_adapter.setContext()`
initializes the Qt support for the context. Note that we need an
asynchronous connection for Qt. See
[Asynchronous connection]({{< relref "/develop/clients/hiredis/connect#asynchronous-connection" >}})
for more information.

The code then issues two Redis commands to [`SET`]({{< relref "/commands/set" >}})
the string key and value that were supplied using the class's constructor. We are
not interested in the response returned by this command, but we are interested in the
response from the [`GET`]({{< relref "/commands/get" >}}) command that follows it.
Because the commands are asynchronous, we need to set a callback to handle
the `GET` response when it arrives. In the `redisAsyncCommand()` call, we pass
a pointer to our `getCallback()` function and also pass a pointer to the
`RedisExample` instance. This is a custom data field that will simply
be passed on to the callback when it executes (see 
[Construct asynchronous commands]({{< relref "/develop/clients/hiredis/issue-commands#construct-asynchronous-commands" >}})
for more information).

The code in the `getCallback()` function starts by casting the reply pointer
parameter to [`redisReply`]({{< relref "/develop/clients/hiredis/handle-replies" >}})
and the custom data pointer to `RedisExample`. Here, the example just prints
the reply string to the console, but you can process it in any way you like.
You can add methods to your class and call them within the callback using the
custom data pointer passed during the `redisAsyncCommand()` call. Here, we
simply use the pointer to call the `finish()` method.

The `finish()` method calls
`redisAsyncDisconnect()` to close the connection and then uses the
Qt signalling mechanism to emit the `finished()` signal. You may need to
process several commands with a particular connection context, but you should
close it from a callback when you have finished using it.

### Main program

To access the `RedisExample` class, you should use code like the
following in the `main()` function defined in `main.cpp`:

```c++
#include <QCoreApplication>
#include <QTimer>

#include "redisexample.h"


int main(int argc, char *argv[])
{
    QCoreApplication app(argc, argv);

    // Instance of our object.
    RedisExample r("url", "https://redis.io/");

    // Call the `run()` slot on our `RedisExample` instance to
    // run our Redis commands. 
    QTimer::singleShot(0, &r, SLOT(run()));

    // Set up a communication connection between our `finished()`
    // signal and the application's `quit()` slot.
    QObject::connect(&r, SIGNAL(finished()), &app, SLOT(quit()));

    // Start the app's main event loop.
    return app.exec();
}
```

This creates the [`QCoreApplication`](https://doc.qt.io/qt-6/qcoreapplication.html)
instance that manages the main event loop for a console app. It
then creates the instance of `RedisExample` with the key ("url") and
value ("https://redis.io/") for our Redis string.

The two lines below set up the `QObject` communication mechanism
for the app. The call to
[`QTimer::singleShot()`](https://doc.qt.io/qt-6/qtimer.html#singleShot-2)
activates the `run()`
slot method on our `RedisExample` instance. The 
[`QObject::connect()`](https://doc.qt.io/qt-6/qobject.html#connect-5)
call creates a communication link between the `finished()` signal of
out `RedisExample` instance and the `quit()` slot of our
`QCoreApplication` instance. This quits the application event loop and
exits the app when the `finished()` signal is emitted by the
`RedisExample` object. This happens when the `finish()` method is called
at the end of the `GET` command callback.

## Run the code

When you have added the code, you can run it from the **Build** menu of
Qt Creator or from the toolbar at the left hand side of the window.
Assuming the connection to Redis succeeds, it will print the message
`Value: https://redis.io/` and quit. You can use the
[`KEYS`]({{< relref "/commands/keys" >}}) command from
[`redis-cli`]({{< relref "/develop/tools/cli" >}}) or
[Redis Insight]({{< relref "/develop/tools/insight" >}}) to check
that the "url" string key was added to the Redis database.

## Key information

There are many ways you could use Redis with a Qt app, but our example
demonstrates some techniques that are broadly useful:

-   Use the `QObject` communication mechanism to simplify your code.
-   Use the `hiredis` asynchronous API. Add a `RedisQtAdapter` instance
    to your code and ensure you call its `setContext()` method to
    initialize it before issuing Redis commands.
-   Place all code and data you need to interact with Redis
    (including the connection context) in a single
    class or ensure it is available from a class via pointers and
    Qt signals. Pass a pointer to an instance of your class in the
    custom data parameter when you issue a Redis command with
    `redisAsyncCommand()` and use this to process the reply or
    issue more commands from the callback.
