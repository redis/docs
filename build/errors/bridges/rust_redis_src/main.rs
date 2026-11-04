// Runs one command, or one MULTI/EXEC block, through redis-rs and prints what it returns or the error it gives.
// Arguments: api port user password mode payload...  (see _common.py for the format)
use redis::Value;
use std::time::Duration;

fn one(s: &str) -> String { s.replace(['\r', '\n'], " ") }

fn cmd_of(p: &str) -> redis::Cmd {
    let mut parts = p.split('\x01');
    let mut c = redis::cmd(parts.next().unwrap());
    for s in parts {
        if let Some(h) = s.strip_prefix("hex:") {
            let b: Vec<u8> = (0..h.len() / 2).map(|i| u8::from_str_radix(&h[2 * i..2 * i + 2], 16).unwrap()).collect();
            c.arg(&b[..]);
        } else {
            c.arg(s);
        }
    }
    c
}

fn describe(e: &redis::RedisError) -> String {
    format!("EXC\tErrorKind::{:?}\t{} [code {:?}, detail {:?}]", e.kind(), one(&e.to_string()), e.code(), e.detail().map(one))
}

fn sync_run(url: &str, mode: &str, payload: &[String]) -> Result<Value, redis::RedisError> {
    let client = redis::Client::open(url)?;
    let mut con = client.get_connection_with_timeout(Duration::from_secs(5))?;
    if mode == "cmd" { cmd_of(&payload[0]).query::<Value>(&mut con) } else {
        let mut p = redis::pipe(); p.atomic();
        for s in payload { p.add_command(cmd_of(s)); }
        p.query::<Value>(&mut con)
    }
}

async fn async_run(url: &str, mode: &str, payload: &[String]) -> Result<Value, redis::RedisError> {
    let client = redis::Client::open(url)?;
    let mut con = client.get_multiplexed_async_connection().await?;
    if mode == "cmd" { cmd_of(&payload[0]).query_async::<Value>(&mut con).await } else {
        let mut p = redis::pipe(); p.atomic();
        for s in payload { p.add_command(cmd_of(s)); }
        p.query_async::<Value>(&mut con).await
    }
}

#[tokio::main]
async fn main() {
    let a: Vec<String> = std::env::args().skip(1).collect();
    let (api, port, user, pass, mode) = (&a[0], &a[1], &a[2], &a[3], &a[4]);
    let auth = if !user.is_empty() { format!("{user}:{pass}@") } else if !pass.is_empty() { format!(":{pass}@") } else { String::new() };
    let url = format!("redis://{auth}127.0.0.1:{port}/");
    let payload = &a[5..];
    let r = if api == "sync" {
        let (u, m, p) = (url.clone(), mode.clone(), payload.to_vec());
        tokio::task::spawn_blocking(move || sync_run(&u, &m, &p)).await.unwrap()
    } else { async_run(&url, mode, payload).await };
    match r {
        Ok(v) => println!("OK\t{}", one(&format!("{v:?}"))),
        Err(e) => println!("{}", describe(&e)),
    }
}
