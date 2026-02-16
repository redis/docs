use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use regex::Regex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PythonSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub is_async: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PythonDocComment {
    pub method_name: String,
    pub raw_comment: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub returns: Option<String>,
    pub line_number: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JavaSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub modifiers: Vec<String>,
    pub throws: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct JavaDocComment {
    pub method_name: String,
    pub raw_comment: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub returns: Option<String>,
    pub throws: std::collections::HashMap<String, String>,
    pub line_number: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GoSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub is_method: bool,
    pub receiver: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GoDocComment {
    pub method_name: String,
    pub raw_comment: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub returns: Option<String>,
    pub line_number: usize,
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[wasm_bindgen]
pub fn parse_python_signatures(code: &str) -> JsValue {
    match extract_python_signatures(code) {
        Ok(signatures) => {
            let json_array: Vec<Value> = signatures
                .iter()
                .map(|sig| {
                    json!({
                        "method_name": sig.method_name,
                        "signature": sig.signature,
                        "parameters": sig.parameters,
                        "return_type": sig.return_type,
                        "line_number": sig.line_number,
                        "is_async": sig.is_async,
                    })
                })
                .collect();
            serde_wasm_bindgen::to_value(&json_array).unwrap_or_else(|_| JsValue::NULL)
        }
        Err(e) => {
            let error_obj = json!({
                "error": e,
                "signatures": []
            });
            serde_wasm_bindgen::to_value(&error_obj).unwrap_or_else(|_| JsValue::NULL)
        }
    }
}

#[wasm_bindgen]
pub fn parse_python_doc_comments(code: &str) -> JsValue {
    match extract_python_doc_comments(code) {
        Ok(doc_comments) => {
            let mut doc_map = serde_json::Map::new();
            for doc in doc_comments {
                let params_json: serde_json::Map<String, Value> = doc
                    .parameters
                    .iter()
                    .map(|(k, v)| (k.clone(), Value::String(v.clone())))
                    .collect();

                let doc_obj = json!({
                    "raw_comment": doc.raw_comment,
                    "summary": doc.summary,
                    "description": doc.description,
                    "parameters": params_json,
                    "returns": doc.returns,
                    "line_number": doc.line_number,
                });

                doc_map.insert(doc.method_name, doc_obj);
            }
            serde_wasm_bindgen::to_value(&doc_map).unwrap_or_else(|_| JsValue::NULL)
        }
        Err(e) => {
            let error_obj = json!({
                "error": e,
                "doc_comments": {}
            });
            serde_wasm_bindgen::to_value(&error_obj).unwrap_or_else(|_| JsValue::NULL)
        }
    }
}

#[wasm_bindgen]
pub fn parse_java_signatures(code: &str) -> JsValue {
    match extract_java_signatures(code) {
        Ok(signatures) => {
            let json_array: Vec<Value> = signatures
                .iter()
                .map(|sig| {
                    json!({
                        "method_name": sig.method_name,
                        "signature": sig.signature,
                        "parameters": sig.parameters,
                        "return_type": sig.return_type,
                        "line_number": sig.line_number,
                        "modifiers": sig.modifiers,
                        "throws": sig.throws,
                    })
                })
                .collect();
            serde_wasm_bindgen::to_value(&json_array).unwrap_or_else(|_| JsValue::NULL)
        }
        Err(e) => {
            let error_obj = json!({
                "error": e,
                "signatures": []
            });
            serde_wasm_bindgen::to_value(&error_obj).unwrap_or_else(|_| JsValue::NULL)
        }
    }
}

#[wasm_bindgen]
pub fn parse_java_doc_comments(code: &str) -> JsValue {
    match extract_java_doc_comments(code) {
        Ok(doc_comments) => {
            let mut doc_map = serde_json::Map::new();
            for doc in doc_comments {
                let params_json: serde_json::Map<String, Value> = doc
                    .parameters
                    .iter()
                    .map(|(k, v)| (k.clone(), Value::String(v.clone())))
                    .collect();

                let throws_json: serde_json::Map<String, Value> = doc
                    .throws
                    .iter()
                    .map(|(k, v)| (k.clone(), Value::String(v.clone())))
                    .collect();

                let doc_obj = json!({
                    "raw_comment": doc.raw_comment,
                    "summary": doc.summary,
                    "description": doc.description,
                    "parameters": params_json,
                    "returns": doc.returns,
                    "throws": throws_json,
                    "line_number": doc.line_number,
                });

                doc_map.insert(doc.method_name, doc_obj);
            }
            serde_wasm_bindgen::to_value(&doc_map).unwrap_or_else(|_| JsValue::NULL)
        }
        Err(e) => {
            let error_obj = json!({
                "error": e,
                "doc_comments": {}
            });
            serde_wasm_bindgen::to_value(&error_obj).unwrap_or_else(|_| JsValue::NULL)
        }
    }
}

#[wasm_bindgen]
pub fn parse_go_signatures(code: &str) -> JsValue {
    match extract_go_signatures(code) {
        Ok(signatures) => {
            let json_array: Vec<Value> = signatures
                .iter()
                .map(|sig| {
                    json!({
                        "method_name": sig.method_name,
                        "signature": sig.signature,
                        "parameters": sig.parameters,
                        "return_type": sig.return_type,
                        "line_number": sig.line_number,
                        "is_method": sig.is_method,
                        "receiver": sig.receiver,
                    })
                })
                .collect();
            serde_wasm_bindgen::to_value(&json_array).unwrap_or_else(|_| JsValue::NULL)
        }
        Err(e) => {
            let error_obj = json!({
                "error": e,
                "signatures": []
            });
            serde_wasm_bindgen::to_value(&error_obj).unwrap_or_else(|_| JsValue::NULL)
        }
    }
}

#[wasm_bindgen]
pub fn parse_go_doc_comments(code: &str) -> JsValue {
    match extract_go_doc_comments(code) {
        Ok(doc_comments) => {
            let mut doc_map = serde_json::Map::new();
            for doc in doc_comments {
                let params_json: serde_json::Map<String, Value> = doc
                    .parameters
                    .iter()
                    .map(|(k, v)| (k.clone(), Value::String(v.clone())))
                    .collect();

                let doc_obj = json!({
                    "raw_comment": doc.raw_comment,
                    "summary": doc.summary,
                    "description": doc.description,
                    "parameters": params_json,
                    "returns": doc.returns,
                    "line_number": doc.line_number,
                });

                doc_map.insert(doc.method_name, doc_obj);
            }
            serde_wasm_bindgen::to_value(&doc_map).unwrap_or_else(|_| JsValue::NULL)
        }
        Err(e) => {
            let error_obj = json!({
                "error": e,
                "doc_comments": {}
            });
            serde_wasm_bindgen::to_value(&error_obj).unwrap_or_else(|_| JsValue::NULL)
        }
    }
}

fn extract_python_signatures(code: &str) -> Result<Vec<PythonSignature>, String> {
    let mut signatures = Vec::new();

    // Regex patterns for function definitions
    // Matches: def function_name(params) -> return_type:
    // Also matches: async def function_name(params) -> return_type:
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*(?:->\s*([^:]+))?\s*:"
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let is_async = caps.get(2).is_some();
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(4).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(5).map(|m| m.as_str().trim().to_string());

            if !method_name.is_empty() {
                let parameters = parse_parameters(params_str);
                let signature = format!("def {}({})", method_name, params_str);

                signatures.push(PythonSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    is_async,
                });
            }
        }
    }

    Ok(signatures)
}

fn parse_parameters(params_text: &str) -> Vec<String> {
    if params_text.trim().is_empty() {
        return vec![];
    }

    params_text
        .split(',')
        .map(|p| p.trim().to_string())
        .filter(|p| !p.is_empty())
        .collect()
}

fn extract_java_signatures(code: &str) -> Result<Vec<JavaSignature>, String> {
    let mut signatures = Vec::new();

    // Regex pattern for Java method definitions
    // Matches: [modifiers] return_type method_name(params) [throws Exception]
    // Handles: public, private, protected, static, final, abstract, synchronized, etc.
    let method_pattern = Regex::new(
        r"(?m)^(\s*)(?:(public|private|protected|static|final|abstract|synchronized|native|strictfp)\s+)*([a-zA-Z_<>?][a-zA-Z0-9_<>?,\s]*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)(?:\s*throws\s+([^{;]+))?(?:\s*[{;])?"
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        if let Some(caps) = method_pattern.captures(line) {
            let modifiers_str = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(3).map(|m| m.as_str().trim().to_string());
            let method_name = caps.get(4).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(5).map(|m| m.as_str()).unwrap_or("");
            let throws_str = caps.get(6).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                let modifiers = if modifiers_str.is_empty() {
                    vec![]
                } else {
                    modifiers_str
                        .split_whitespace()
                        .map(|m| m.to_string())
                        .collect()
                };

                let parameters = parse_parameters(params_str);
                let throws = if throws_str.is_empty() {
                    vec![]
                } else {
                    throws_str
                        .split(',')
                        .map(|t| t.trim().to_string())
                        .filter(|t| !t.is_empty())
                        .collect()
                };

                let signature = format!("{}{}({})",
                    return_type.as_ref().map(|r| format!("{} ", r)).unwrap_or_default(),
                    method_name,
                    params_str
                );

                signatures.push(JavaSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    modifiers,
                    throws,
                });
            }
        }
    }

    Ok(signatures)
}

fn extract_java_doc_comments(code: &str) -> Result<Vec<JavaDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find method definitions
    let method_pattern = Regex::new(
        r"(?m)^(\s*)(?:(?:public|private|protected|static|final|abstract|synchronized|native|strictfp)\s+)*([a-zA-Z_<>?][a-zA-Z0-9_<>?,\s]*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = method_pattern.captures(line) {
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Look for JavaDoc comment before the method
                if let Some(javadoc) = extract_javadoc(&lines, line_num, indent) {
                    let (summary, description, parameters, returns, throws) = parse_javadoc(&javadoc);

                    doc_comments.push(JavaDocComment {
                        method_name,
                        raw_comment: javadoc.clone(),
                        summary,
                        description,
                        parameters,
                        returns,
                        throws,
                        line_number: line_num + 1,
                    });
                }
            }
        }
    }

    Ok(doc_comments)
}

fn extract_javadoc(lines: &[&str], method_line: usize, _method_indent: &str) -> Option<String> {
    if method_line == 0 {
        return None;
    }

    // Look backwards for JavaDoc comment (/** ... */)
    let mut javadoc_end = None;
    for i in (0..method_line).rev() {
        let line = lines[i].trim();
        if line.ends_with("*/") {
            javadoc_end = Some(i);
            break;
        }
    }

    let javadoc_end = javadoc_end?;

    // Find the start of the JavaDoc comment
    let mut javadoc_start = None;
    for i in (0..=javadoc_end).rev() {
        let line = lines[i].trim();
        if line.starts_with("/**") {
            javadoc_start = Some(i);
            break;
        }
    }

    let javadoc_start = javadoc_start?;

    // Extract the JavaDoc content
    let mut javadoc = String::new();
    for i in javadoc_start..=javadoc_end {
        let line = lines[i].trim();

        if i == javadoc_start {
            // Remove opening /**
            if let Some(content) = line.strip_prefix("/**") {
                javadoc.push_str(content.trim());
            }
        } else if i == javadoc_end {
            // Remove closing */
            if let Some(content) = line.strip_suffix("*/") {
                if !javadoc.is_empty() {
                    javadoc.push('\n');
                }
                javadoc.push_str(content.trim());
            }
        } else {
            // Remove leading * and whitespace
            let trimmed = if line.starts_with('*') {
                line[1..].trim()
            } else {
                line.trim()
            };

            if !trimmed.is_empty() {
                if !javadoc.is_empty() {
                    javadoc.push('\n');
                }
                javadoc.push_str(trimmed);
            }
        }
    }

    if !javadoc.is_empty() {
        Some(javadoc)
    } else {
        None
    }
}

fn parse_javadoc(javadoc: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>, std::collections::HashMap<String, String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;
    let mut throws = std::collections::HashMap::new();

    let lines: Vec<&str> = javadoc.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns, throws);
    }

    let mut current_section = "description";
    let mut current_content = String::new();
    let mut current_param_name = String::new();
    let mut i = 0;

    // Get summary (first non-empty line)
    while i < lines.len() {
        let line = lines[i].trim();
        if !line.is_empty() {
            summary = Some(line.to_string());
            i += 1;
            break;
        }
        i += 1;
    }

    // Parse rest of JavaDoc
    while i < lines.len() {
        let line = lines[i].trim();

        // Check for @param, @return, @throws tags
        if line.starts_with("@param ") {
            // Save previous section
            if !current_content.is_empty() {
                match current_section {
                    "description" => description = Some(current_content.trim().to_string()),
                    "returns" => returns = Some(current_content.trim().to_string()),
                    _ => {}
                }
            }
            current_content.clear();

            // Parse @param tag
            let param_line = &line[7..]; // Skip "@param "
            let parts: Vec<&str> = param_line.splitn(2, ' ').collect();
            if parts.len() >= 1 {
                current_param_name = parts[0].to_string();
                if parts.len() == 2 {
                    parameters.insert(current_param_name.clone(), parts[1].to_string());
                }
            }
            current_section = "parameters";
        } else if line.starts_with("@return ") {
            // Save previous section
            if !current_content.is_empty() {
                match current_section {
                    "description" => description = Some(current_content.trim().to_string()),
                    "parameters" => {
                        if !current_param_name.is_empty() && !current_content.is_empty() {
                            parameters.insert(current_param_name.clone(), current_content.trim().to_string());
                        }
                    }
                    _ => {}
                }
            }
            current_content.clear();
            current_section = "returns";
            returns = Some(line[8..].to_string()); // Skip "@return "
        } else if line.starts_with("@throws ") {
            // Save previous section
            if !current_content.is_empty() {
                match current_section {
                    "description" => description = Some(current_content.trim().to_string()),
                    "returns" => returns = Some(current_content.trim().to_string()),
                    _ => {}
                }
            }
            current_content.clear();

            // Parse @throws tag
            let throws_line = &line[8..]; // Skip "@throws "
            let parts: Vec<&str> = throws_line.splitn(2, ' ').collect();
            if parts.len() >= 1 {
                let exception_name = parts[0].to_string();
                let exception_desc = if parts.len() == 2 { parts[1].to_string() } else { String::new() };
                throws.insert(exception_name, exception_desc);
            }
            current_section = "throws";
        } else if !line.is_empty() {
            match current_section {
                "parameters" => {
                    if !current_param_name.is_empty() {
                        if !current_content.is_empty() {
                            current_content.push(' ');
                        }
                        current_content.push_str(line);
                    }
                }
                "returns" => {
                    if let Some(ref mut ret) = returns {
                        ret.push(' ');
                        ret.push_str(line);
                    }
                }
                "description" => {
                    current_content.push_str(line);
                    current_content.push(' ');
                }
                _ => {}
            }
        }

        i += 1;
    }

    // Save final section
    if !current_content.is_empty() {
        match current_section {
            "description" => description = Some(current_content.trim().to_string()),
            "parameters" => {
                if !current_param_name.is_empty() {
                    parameters.insert(current_param_name, current_content.trim().to_string());
                }
            }
            "returns" => returns = Some(current_content.trim().to_string()),
            _ => {}
        }
    }

    (summary, description, parameters, returns, throws)
}

fn extract_go_signatures(code: &str) -> Result<Vec<GoSignature>, String> {
    let mut signatures = Vec::new();

    // Regex pattern for Go function definitions
    // Matches: func [receiver] name(params) [return_type]
    // Handles: func name(...), func (r *Type) name(...), func (r Type) name(...)
    let func_pattern = Regex::new(
        r"(?m)^(\s*)func(?:\s+\(([^)]+)\))?\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)(?:\s+\(([^)]+)\)|(?:\s+([*\[\]a-zA-Z_][a-zA-Z0-9_<>?,\s\[\]*]*)))?(?:\s*\{)?"
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let receiver_str = caps.get(2).map(|m| m.as_str());
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(4).map(|m| m.as_str()).unwrap_or("");

            // Handle return types - can be in parentheses or not
            let return_type = if let Some(m) = caps.get(5) {
                Some(m.as_str().trim().to_string())
            } else if let Some(m) = caps.get(6) {
                Some(m.as_str().trim().to_string())
            } else {
                None
            };

            if !method_name.is_empty() {
                let is_method = receiver_str.is_some();
                let receiver = receiver_str.map(|r| r.to_string());
                let parameters = parse_parameters(params_str);

                let signature = if let Some(ref recv) = receiver {
                    format!("func ({}) {}({})", recv, method_name, params_str)
                } else {
                    format!("func {}({})", method_name, params_str)
                };

                signatures.push(GoSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    is_method,
                    receiver,
                });
            }
        }
    }

    Ok(signatures)
}

fn extract_go_doc_comments(code: &str) -> Result<Vec<GoDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find function definitions
    let func_pattern = Regex::new(
        r"(?m)^(\s*)func(?:\s+\([^)]+\))?\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Look for Go doc comment before the function
                if let Some(doc_comment) = extract_go_comment(&lines, line_num, indent) {
                    let (summary, description, parameters, returns) = parse_go_comment(&doc_comment);

                    doc_comments.push(GoDocComment {
                        method_name,
                        raw_comment: doc_comment.clone(),
                        summary,
                        description,
                        parameters,
                        returns,
                        line_number: line_num + 1,
                    });
                }
            }
        }
    }

    Ok(doc_comments)
}

fn extract_go_comment(lines: &[&str], func_line: usize, _func_indent: &str) -> Option<String> {
    if func_line == 0 {
        return None;
    }

    // Look backwards for Go comment (// ...)
    let mut comment_lines = Vec::new();
    let mut i = func_line - 1;

    loop {
        let line = lines[i].trim();
        if line.starts_with("//") {
            comment_lines.insert(0, line[2..].trim());
            if i == 0 {
                break;
            }
            i -= 1;
        } else if line.is_empty() {
            if i == 0 {
                break;
            }
            i -= 1;
        } else {
            break;
        }
    }

    if comment_lines.is_empty() {
        return None;
    }

    Some(comment_lines.join("\n"))
}

fn parse_go_comment(comment: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;

    let lines: Vec<&str> = comment.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns);
    }

    // Get summary (first non-empty line)
    if !lines[0].is_empty() {
        summary = Some(lines[0].to_string());
    }

    // Parse rest of comment
    let mut current_section = "description";
    let mut current_content = String::new();

    for i in 1..lines.len() {
        let line = lines[i].trim();

        // Check for parameter documentation (param: or params:)
        if line.starts_with("param:") || line.starts_with("params:") {
            if !current_content.is_empty() {
                match current_section {
                    "description" => description = Some(current_content.trim().to_string()),
                    _ => {}
                }
            }
            current_content.clear();
            current_section = "parameters";

            let param_line = if line.starts_with("param:") {
                &line[6..]
            } else {
                &line[7..]
            };
            current_content.push_str(param_line.trim());
        } else if line.starts_with("return:") || line.starts_with("returns:") {
            if !current_content.is_empty() {
                match current_section {
                    "description" => description = Some(current_content.trim().to_string()),
                    _ => {}
                }
            }
            current_content.clear();
            current_section = "returns";

            let return_line = if line.starts_with("return:") {
                &line[7..]
            } else {
                &line[8..]
            };
            returns = Some(return_line.trim().to_string());
        } else if !line.is_empty() {
            match current_section {
                "description" => {
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(line);
                }
                "parameters" => {
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(line);
                }
                "returns" => {
                    if let Some(ref mut ret) = returns {
                        ret.push(' ');
                        ret.push_str(line);
                    }
                }
                _ => {}
            }
        }
    }

    // Save final section
    if !current_content.is_empty() {
        match current_section {
            "description" => description = Some(current_content.trim().to_string()),
            "parameters" => {
                // Parse parameter line (format: "name type - description")
                let parts: Vec<&str> = current_content.splitn(2, '-').collect();
                if parts.len() >= 1 {
                    let param_info = parts[0].trim();
                    let param_desc = if parts.len() == 2 { parts[1].trim() } else { "" };
                    parameters.insert(param_info.to_string(), param_desc.to_string());
                }
            }
            "returns" => {
                if let Some(ref mut ret) = returns {
                    ret.push(' ');
                    ret.push_str(current_content.trim());
                }
            }
            _ => {}
        }
    }

    (summary, description, parameters, returns)
}

fn extract_python_doc_comments(code: &str) -> Result<Vec<PythonDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find function definitions
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Look for docstring on the next line(s)
                if let Some(docstring) = extract_docstring(&lines, line_num, indent) {
                    let (summary, description, parameters, returns) = parse_docstring(&docstring);

                    doc_comments.push(PythonDocComment {
                        method_name,
                        raw_comment: docstring.clone(),
                        summary,
                        description,
                        parameters,
                        returns,
                        line_number: line_num + 1,
                    });
                }
            }
        }
    }

    Ok(doc_comments)
}

fn extract_docstring(lines: &[&str], func_line: usize, _func_indent: &str) -> Option<String> {
    if func_line + 1 >= lines.len() {
        return None;
    }

    let next_line = lines[func_line + 1].trim();

    // Check if next line starts with triple quotes
    if !next_line.starts_with("\"\"\"") && !next_line.starts_with("'''") {
        return None;
    }

    let quote_type = if next_line.starts_with("\"\"\"") { "\"\"\"" } else { "'''" };
    let mut docstring = String::new();
    let mut found_end = false;

    // Check if docstring is on single line
    if next_line.len() > 3 && next_line[3..].contains(quote_type) {
        let content = next_line[3..].split(quote_type).next().unwrap_or("").to_string();
        return Some(content);
    }

    // Multi-line docstring
    for i in (func_line + 1)..lines.len() {
        let line = lines[i];
        let trimmed = line.trim();

        if i == func_line + 1 {
            // First line - remove opening quotes
            docstring.push_str(&trimmed[3..]);
        } else if trimmed.ends_with(quote_type) {
            // Last line - remove closing quotes
            let content = trimmed[..trimmed.len() - 3].to_string();
            if !content.is_empty() {
                docstring.push('\n');
                docstring.push_str(&content);
            }
            found_end = true;
            break;
        } else if !trimmed.is_empty() {
            // Middle lines
            docstring.push('\n');
            docstring.push_str(trimmed);
        }
    }

    if found_end || !docstring.is_empty() {
        Some(docstring)
    } else {
        None
    }
}

fn parse_docstring(docstring: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;

    let lines: Vec<&str> = docstring.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns);
    }

    // First non-empty line is summary
    let mut current_section = "description"; // Start with description after summary
    let mut current_content = String::new();
    let mut i = 0;

    // Get summary (first line)
    if !lines[0].trim().is_empty() {
        summary = Some(lines[0].trim().to_string());
        i = 1;
    }

    // Parse rest of docstring
    while i < lines.len() {
        let line = lines[i].trim();

        // Check for section headers (Google style)
        if line.ends_with(':') && (line.starts_with("Args:") || line.starts_with("Parameters:") ||
                                    line.starts_with("Returns:") || line.starts_with("Raises:")) {
            // Save previous section
            if !current_content.is_empty() {
                match current_section {
                    "description" => description = Some(current_content.trim().to_string()),
                    "returns" => returns = Some(current_content.trim().to_string()),
                    _ => {}
                }
            }
            current_content.clear();

            if line.starts_with("Args:") || line.starts_with("Parameters:") {
                current_section = "parameters";
            } else if line.starts_with("Returns:") {
                current_section = "returns";
            } else {
                current_section = "other";
            }
        } else if !line.is_empty() {
            match current_section {
                "parameters" => {
                    // Parse parameter line (e.g., "    param_name: description")
                    if line.contains(':') && !line.starts_with(' ') {
                        let parts: Vec<&str> = line.splitn(2, ':').collect();
                        if parts.len() == 2 {
                            let param_name = parts[0].trim().to_string();
                            let param_desc = parts[1].trim().to_string();
                            parameters.insert(param_name, param_desc);
                        }
                    }
                }
                "returns" => {
                    current_content.push_str(line);
                    current_content.push(' ');
                }
                "description" => {
                    current_content.push_str(line);
                    current_content.push(' ');
                }
                _ => {}
            }
        }

        i += 1;
    }

    // Save final section
    if !current_content.is_empty() {
        match current_section {
            "description" => description = Some(current_content.trim().to_string()),
            "returns" => returns = Some(current_content.trim().to_string()),
            _ => {}
        }
    }

    (summary, description, parameters, returns)
}

// ============================================================================
// Signature Validators for All Languages
// ============================================================================

#[wasm_bindgen]
pub fn validate_signature(signature: &str, language: &str) -> JsValue {
    let result = match language.to_lowercase().as_str() {
        "python" => validate_python_signature(signature),
        "java" => validate_java_signature(signature),
        "go" => validate_go_signature(signature),
        "typescript" => validate_typescript_signature(signature),
        "rust" => validate_rust_signature(signature),
        "csharp" => validate_csharp_signature(signature),
        "php" => validate_php_signature(signature),
        _ => ValidationResult {
            valid: false,
            errors: vec![format!("Unsupported language: {}", language)],
            warnings: vec![],
        },
    };

    serde_wasm_bindgen::to_value(&result).unwrap_or_else(|_| JsValue::NULL)
}

fn validate_python_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for basic function definition pattern
    if !trimmed.starts_with("def ") && !trimmed.starts_with("async def ") {
        errors.push("Python signature must start with 'def' or 'async def'".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for opening parenthesis
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("Python signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for colon at end
    if !trimmed.ends_with(':') && !trimmed.contains("->") {
        warnings.push("Python signature should end with ':' or have return type annotation".to_string());
    }

    // Check for valid method name
    let name_pattern = Regex::new(r"^(?:async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(").unwrap();
    if !name_pattern.is_match(trimmed) {
        errors.push("Invalid Python method name format".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

fn validate_java_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for opening parenthesis
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("Java signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for semicolon at end (optional for method signatures)
    if !trimmed.ends_with(';') && !trimmed.ends_with(')') {
        warnings.push("Java method signature should end with ';' or ')'".to_string());
    }

    // Check for valid method name pattern - must have a name before parenthesis
    // Pattern: word characters followed by optional whitespace and opening paren
    let name_pattern = Regex::new(r"[a-zA-Z_][a-zA-Z0-9_]*\s*\(").unwrap();
    if !name_pattern.is_match(trimmed) {
        errors.push("Java method must have a valid method name before parentheses".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Additional check: ensure the method name is not a Java keyword like "void", "int", etc.
    let java_keywords = vec!["void", "int", "long", "short", "byte", "float", "double", "boolean", "char", "String"];
    for keyword in java_keywords {
        let keyword_pattern = format!(r"^(public|private|protected|static|final|abstract|synchronized)?\s*{}\s*\(", keyword);
        if let Ok(pattern) = Regex::new(&keyword_pattern) {
            if pattern.is_match(trimmed) {
                errors.push("Java method name cannot be a return type keyword".to_string());
                return ValidationResult { valid: false, errors, warnings };
            }
        }
    }

    // Check for return type
    if !trimmed.contains("void") && !trimmed.contains('<') && !trimmed.contains("String")
        && !trimmed.contains("int") && !trimmed.contains("boolean") && !trimmed.contains("List")
        && !trimmed.contains("Map") && !trimmed.contains("Set") {
        warnings.push("Java method should have explicit return type".to_string());
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

fn validate_go_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for 'func' keyword
    if !trimmed.starts_with("func ") {
        errors.push("Go signature must start with 'func'".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for parentheses
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("Go signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for error return pattern (Go convention)
    if trimmed.contains("error") && !trimmed.contains("(") {
        warnings.push("Go function returning error should have proper return type syntax".to_string());
    }

    // Check for valid function name
    let name_pattern = Regex::new(r"^func\s+(?:\([^)]*\)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\(").unwrap();
    if !name_pattern.is_match(trimmed) {
        errors.push("Invalid Go function name format".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

fn validate_typescript_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for function keyword or arrow function
    if !trimmed.starts_with("function ") && !trimmed.starts_with("async function ")
        && !trimmed.contains("=>") && !trimmed.contains("(") {
        errors.push("TypeScript signature must be a function or arrow function".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for parentheses
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("TypeScript signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for return type annotation
    if !trimmed.contains(":") && !trimmed.contains("=>") {
        warnings.push("TypeScript signature should have return type annotation".to_string());
    }

    // Check for Promise pattern if async
    if trimmed.contains("async") && !trimmed.contains("Promise") {
        warnings.push("Async TypeScript function should return Promise".to_string());
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

fn validate_rust_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for 'fn' keyword
    if !trimmed.starts_with("fn ") && !trimmed.starts_with("async fn ") && !trimmed.starts_with("pub fn ")
        && !trimmed.starts_with("pub async fn ") {
        errors.push("Rust signature must start with 'fn', 'async fn', 'pub fn', or 'pub async fn'".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for parentheses
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("Rust signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for return type annotation
    if !trimmed.contains("->") {
        warnings.push("Rust function should have explicit return type annotation".to_string());
    }

    // Check for Result pattern
    if trimmed.contains("Result") && !trimmed.contains("<") {
        errors.push("Rust Result type must have type parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

fn validate_csharp_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for parentheses
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("C# signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for valid method name
    let name_pattern = Regex::new(r"[a-zA-Z_][a-zA-Z0-9_]*\s*\(").unwrap();
    if !name_pattern.is_match(trimmed) {
        errors.push("Invalid C# method name format".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for return type
    if !trimmed.contains("void") && !trimmed.contains("Task") && !trimmed.contains("string")
        && !trimmed.contains("int") && !trimmed.contains("bool") && !trimmed.contains("List")
        && !trimmed.contains("Dictionary") {
        warnings.push("C# method should have explicit return type".to_string());
    }

    // Check for async/Task pattern
    if trimmed.contains("async") && !trimmed.contains("Task") {
        warnings.push("Async C# method should return Task or Task<T>".to_string());
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

fn validate_php_signature(signature: &str) -> ValidationResult {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();

    let trimmed = signature.trim();

    // Check for 'function' keyword
    if !trimmed.starts_with("function ") && !trimmed.starts_with("public function ")
        && !trimmed.starts_with("private function ") && !trimmed.starts_with("protected function ")
        && !trimmed.starts_with("static function ") && !trimmed.starts_with("public static function ") {
        errors.push("PHP signature must start with 'function' or visibility modifier".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for parentheses
    if !trimmed.contains('(') || !trimmed.contains(')') {
        errors.push("PHP signature must have parentheses for parameters".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    // Check for return type hint (PHP 7+)
    if !trimmed.contains(":") && !trimmed.contains("void") {
        warnings.push("PHP function should have return type hint (PHP 7+)".to_string());
    }

    // Check for valid function name
    let name_pattern = Regex::new(r"(?:public|private|protected|static)?\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(").unwrap();
    if !name_pattern.is_match(trimmed) {
        errors.push("Invalid PHP function name format".to_string());
        return ValidationResult { valid: false, errors, warnings };
    }

    ValidationResult { valid: errors.is_empty(), errors, warnings }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_greet() {
        assert_eq!(greet("World"), "Hello, World!");
    }
}
