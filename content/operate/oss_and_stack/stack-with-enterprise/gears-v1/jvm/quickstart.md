---
Title: "RedisGears JVM\_quick start"
alwaysopen: false
categories:
- docs
- operate
- stack
description: A quick start to learn how to use RedisGears with Java.
linkTitle: Quick start
weight: 10
---

## Prerequisites

For this quick start, you need:

- A Redis Enterprise cluster with the [RedisGears module and JVM plugin installed]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/installing-redisgears#install-redisgears" >}}) and [enabled on a database]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/install" >}})
- `redis-cli` with connectivity to a Redis database

## Tutorial

### Create a Maven project

1. Create a new [Maven project](https://maven.apache.org/guides/getting-started/index.html#).

1. Add the following sections to the [pom.xml](https://maven.apache.org/guides/introduction/introduction-to-the-pom.html) file:

    ```xml
    <repositories>
        <repository>
            <id>snapshots-repo</id>
            <url>https://oss.sonatype.org/content/repositories/snapshots</url>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>com.redislabs</groupId>
            <artifactId>gear_runtime</artifactId>
            <version>0.0.3-SNAPSHOT</version>
        </dependency>
    </dependencies>
    ```

1. Add example code for either [batch processing](#batch-processing) or [event processing](#event-processing) to your project's `main` function.



### Build a JAR

Use the Maven command-line tool or an IDE plugin to compile and package your code into a JAR file:

```sh
$ mvn package
```

### Upload the JAR

Upload your JAR file to a node in the Redis Enterprise cluster. You will need to use the destination filepath when you run your code.

### Run RedisGears Java code

Use the `RG.JEXECUTE` command to run your code:

```sh
$ redis-cli -x -h {host} -p {port} RG.JEXECUTE {package.MainClass} < {filepath}/{JAR name}.jar
```

{{<note>}}
When you use [`GearsBuilder.run()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/run" >}}), `RG.JEXECUTE` runs your code immediately.
<br></br>
However, if you use [`GearsBuilder.register()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}}), `RG.JEXECUTE` only outputs an `OK` message if it registers successfully. Your registered code will run whenever certain database events occur.
{{</note>}}

## Example code

You can use these code examples with your own Maven project to try out batch processing or event processing with the RedisGears JVM plugin.

### Batch processing

If you use the [`GearsBuilder.run()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/run" >}}) function within your code, then the functions you add to the pipeline will run exactly once when you use `RG.JEXECUTE` with your JAR file.

The following example calculates the average rating of all restaurant reviews stored in your database.

#### Add data to the database

1. Connect to your database with `redis-cli`:

    ```sh
    $ redis-cli -h <host> -p <port>
    ```

1. Add a few review hashes to the database with the `HSET` command:

    ```sh
    127.0.0.1:12000> HSET review:1 user "Alex L" message "My new favorite restaurant!" rating 5
    (integer) 3
    127.0.0.1:12000> HSET review:2 user "Anonymous user" message "Kind of overpriced" rating 2
    (integer) 3
    127.0.0.1:12000> HSET review:3 user "Francis J" message "They have a really unique menu." rating 4
    (integer) 3
    127.0.0.1:12000> exit
    ```

#### Example code

```java
import java.io.Serializable;
import gears.GearsBuilder;
import gears.readers.KeysReader;
import gears.records.KeysReaderRecord;

public class Reviews implements Serializable
{

	private static final long serialVersionUID = 1L;
	int count; // Total number of reviews
	int ratingsSum; // Sum of all review ratings
	
    // Reviews constructor
	public Reviews(int count, int ratingsSum) {
		this.count = count;
		this.ratingsSum = ratingsSum;
	}

    public static void main(String args[]) 
    {  
        // Create the reader that will pass data to the pipe
        KeysReader reader = new KeysReader();
        
        // Create the data pipe builder
        GearsBuilder<KeysReaderRecord> gb = GearsBuilder.CreateGearsBuilder(reader);
        
		gb.filter(r->{
			// Filter out any keys that are not reviews
			return r.getKey().startsWith("review:");
		}).map(r->{
			// Extract the rating field
			return r.getHashVal().get("rating");
		})
		.accumulate(new Reviews(0, 0), (accumulator, record)-> {
			// Count the reviews and add up all of their ratings
			accumulator.count++;
			accumulator.ratingsSum += Integer.parseInt(record);
			return accumulator;
		}).map(r->{
			// Calculate the average rating
			return Double.valueOf(((double) r.ratingsSum) / r.count);
		});
             
        // Run the data through the pipeline immediately
        gb.run();
    }
}
```

#### Example output

```sh
$ redis-cli -x -h {host} -p {port} \
    RG.JEXECUTE com.domain.packagename.Reviews < /tmp/rgjvmtest-0.0.1-SNAPSHOT.jar
1) 1) "3.6666666666666665"
2) (empty array)
```

### Event processing

If you use the [`GearsBuilder.register()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}}) function in your code, then the functions you add to the pipeline will run every time a certain database event occurs.

The following example registers a pipeline of functions to automatically update the maximum age every time you add a new person hash to your database.

#### Example code

```java
import gears.GearsBuilder;
import gears.readers.KeysReader;
import gears.records.KeysReaderRecord;

public class App 
{
    public static void main(String args[]) 
    {  
        // Create the reader that will pass data to the pipe
        KeysReader reader = new KeysReader();
        
        // Create the data pipe builder
        GearsBuilder<KeysReaderRecord> gb = GearsBuilder.CreateGearsBuilder(reader);

        // Only process keys that start with "person:"
        gb.filter(r->{
        	return r.getKey().startsWith("person:");
       	});

        // Compare each person's age to the current maximum age
        gb.foreach(r->{
        	String newAgeStr = r.getHashVal().get("age");
        	int newAge = Integer.parseInt(newAgeStr);
        	
        	// Get the current maximum age
        	String maxAgeKey = "age:maximum";
        	String maxAgeStr = (String) GearsBuilder.execute("GET", maxAgeKey);
        	
        	int maxAge = 0; // Initialize to 0
        	if (maxAgeStr != null) {
                // Convert the maximum age to an integer
        		maxAge = Integer.parseInt(maxAgeStr);
        	}

        	// Update the maximum age if a new age is higher
        	if (newAge > maxAge) {               
        		GearsBuilder.execute("SET", maxAgeKey, newAgeStr); 
        	}
        });
        
        // Store this pipeline of functions and 
        // run them when a new person key is added
        gb.register(ExecutionMode.SYNC);
        // Note: ExecutionMode defaults to ASYNC 
        // if you call register() without any arguments
    }
}
```

#### Example event processing

After you register your code with the `RG.JEXECUTE` command, add some data to the database and check the value of `age:maximum` to verify that it runs correctly.

1. Connect to your database with `redis-cli`:

    ```sh
    $ redis-cli -h <host> -p <port>
    ```

1. Add a hash that represents a person with `HSET`:

    ```sh
    127.0.0.1:12000> HSET person:1 name "Alex" age 24
    (integer) 2
    ```

1. The current value of `age:maximum` should match Alex's age:

    ```sh
    127.0.0.1:12000> GET age:maximum
    "24"
    ```

1. Add another person with a higher age and then check that `age:maximum` updated automatically:

    ```sh
    127.0.0.1:12000> HSET person:2 name "Morgan" age 45
    (integer) 2
    127.0.0.1:12000> GET age:maximum
    "45"
    ```

1. Add a person with a lower age and verify that `age:maximum` did not change:

    ```sh
    127.0.0.1:12000> HSET person:3 name "Lee" age 31
    (integer) 2
    127.0.0.1:12000> GET age:maximum
    "45"
    ```