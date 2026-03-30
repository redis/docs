// EXAMPLE: cmds_stream

// HIDE_START
use redis::AsyncCommands;
// HIDE_END

// REMOVE_START
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_xadd1() {
// REMOVE_END
        // STEP_START xadd1
        let client = redis::Client::open("redis://127.0.0.1/").unwrap();
        let mut con = client.get_multiplexed_async_connection().await.unwrap();

        // REMOVE_START
        let _: () = redis::cmd("DEL").arg("mystream").query_async(&mut con).await.unwrap();
        // REMOVE_END

        let res1: String = redis::cmd("XADD")
            .arg("mystream")
            .arg("*")
            .arg("name")
            .arg("Sara")
            .arg("surname")
            .arg("OConnor")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XADD result: {}", res1); // >>> 1726055713866-0

        let res2: String = redis::cmd("XADD")
            .arg("mystream")
            .arg("*")
            .arg("field1")
            .arg("value1")
            .arg("field2")
            .arg("value2")
            .arg("field3")
            .arg("value3")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XADD result: {}", res2); // >>> 1726055713866-1

        let res3: i64 = con.xlen("mystream").await.unwrap();
        println!("XLEN result: {}", res3); // >>> 2

        let res4: redis::streams::StreamRangeReply = con.xrange_all("mystream").await.unwrap();
        for entry in &res4.ids {
            println!("{} -> {:?}", entry.id, entry.map);
        }
        // >>> 1726055713866-0 -> {"name": "Sara", "surname": "OConnor"}
        // >>> 1726055713866-1 -> {"field1": "value1", "field2": "value2", "field3": "value3"}
        // STEP_END

        // REMOVE_START
        assert_eq!(res3, 2);
        assert_eq!(res4.ids.len(), 2);
        let _: () = redis::cmd("DEL").arg("mystream").query_async(&mut con).await.unwrap();
    }

    #[tokio::test]
    async fn test_xadd2() {
        let client = redis::Client::open("redis://127.0.0.1/").unwrap();
        let mut con = client.get_multiplexed_async_connection().await.unwrap();
        let _: () = redis::cmd("DEL").arg("idmpstream").query_async(&mut con).await.unwrap();
        // REMOVE_END

        // STEP_START xadd2
        // Note: IDMP is a Redis 8.6 feature - using raw commands
        let res5: String = redis::cmd("XADD")
            .arg("idmpstream")
            .arg("IDMP")
            .arg("producer1")
            .arg("msg1")
            .arg("*")
            .arg("field")
            .arg("value")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XADD IDMP result: {}", res5); // >>> 1726055713867-0

        // Attempting to add the same message again with IDMP returns the original entry ID
        let res6: String = redis::cmd("XADD")
            .arg("idmpstream")
            .arg("IDMP")
            .arg("producer1")
            .arg("msg1")
            .arg("*")
            .arg("field")
            .arg("different_value")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XADD IDMP result: {}", res6); // >>> 1726055713867-0 (deduplicated)

        let res7: String = redis::cmd("XADD")
            .arg("idmpstream")
            .arg("IDMPAUTO")
            .arg("producer2")
            .arg("*")
            .arg("field")
            .arg("value")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XADD IDMPAUTO result: {}", res7); // >>> 1726055713867-1

        // Auto-generated idempotent ID prevents duplicates for same producer+content
        let res8: String = redis::cmd("XADD")
            .arg("idmpstream")
            .arg("IDMPAUTO")
            .arg("producer2")
            .arg("*")
            .arg("field")
            .arg("value")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XADD IDMPAUTO result: {}", res8); // >>> 1726055713867-1 (duplicate detected)

        // Configure idempotent message processing settings
        let res9: String = redis::cmd("XCFGSET")
            .arg("idmpstream")
            .arg("IDMP-DURATION")
            .arg("300")
            .arg("IDMP-MAXSIZE")
            .arg("1000")
            .query_async(&mut con)
            .await
            .unwrap();
        println!("XCFGSET result: {}", res9); // >>> OK
        // STEP_END

        // REMOVE_START
        assert!(!res5.is_empty());
        let _: () = redis::cmd("DEL").arg("idmpstream").query_async(&mut con).await.unwrap();
// REMOVE_END
// REMOVE_START
    }
}
// REMOVE_END

