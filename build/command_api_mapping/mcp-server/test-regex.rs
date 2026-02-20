use regex::Regex;

fn main() {
    let code = r#"/**
 * Adds two numbers
 * @param a The first number
 * @param b The second number
 * @returns The sum
 */
function add(a: number, b: number): number {
  return a + b;
}"#;

    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:export\s+)?(?:async\s+)?(?:function\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:<[^>]+>)?\s*\((.*?)\)(?:\s*:\s*([^{=;]+?))?(?:\s*[{=;]|$)"
    ).unwrap();

    for (line_num, line) in code.lines().enumerate() {
        println!("Line {}: {}", line_num, line);
        if let Some(caps) = func_pattern.captures(line) {
            println!("  MATCH!");
            println!("  Group 1 (indent): {:?}", caps.get(1).map(|m| m.as_str()));
            println!("  Group 2 (name): {:?}", caps.get(2).map(|m| m.as_str()));
            println!("  Group 3 (params): {:?}", caps.get(3).map(|m| m.as_str()));
            println!("  Group 4 (return): {:?}", caps.get(4).map(|m| m.as_str()));
        }
    }
}
