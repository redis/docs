## Create Debezium user

The Debezium connector needs a user account to connect to MySQL. This
user must have appropriate permissions on all databases where you want Debezium
to capture changes.

1. Connect to your database as an admin user and create a new user for the connector:

    ```sql
    CREATE USER '<username>'@'%' IDENTIFIED BY '<password>';
    ```

    Replace `<username>` and `<password>` with a username and password for the new user.

    The `%` means that the user can connect from any client. If you want to restrict the user to connect only from the RDI host, replace `%` with the IP address of the RDI host.

1. Grant the user the necessary permissions:

    ```sql
    GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT, LOCK TABLES ON *.* TO '<username>'@'%';
    ```

    Replace `<username>` with the username of the Debezium user.

    You can also grant SELECT permissions for specific tables only. The other permissions are global and cannot be restricted to specific tables.

    ```sql
    GRANT RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT, LOCK TABLES ON *.* TO '<username>'@'%';
    GRANT SELECT ON <database>.<table> TO '<username>'@'%';
    ```

1. Finalize the user's permissions:

    ```sql
    FLUSH PRIVILEGES;
    ```