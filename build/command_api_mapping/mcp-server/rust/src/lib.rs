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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TypeScriptSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub is_async: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TypeScriptDocComment {
    pub method_name: String,
    pub raw_comment: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub returns: Option<String>,
    pub line_number: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RustSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub is_async: bool,
    pub is_unsafe: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RustDocComment {
    pub method_name: String,
    pub raw_comment: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub returns: Option<String>,
    pub line_number: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CSharpSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub modifiers: Vec<String>,
    pub is_async: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CSharpDocComment {
    pub method_name: String,
    pub raw_comment: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub parameters: std::collections::HashMap<String, String>,
    pub returns: Option<String>,
    pub line_number: usize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PHPSignature {
    pub method_name: String,
    pub signature: String,
    pub parameters: Vec<String>,
    pub return_type: Option<String>,
    pub line_number: usize,
    pub modifiers: Vec<String>,
    pub is_variadic: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PHPDocComment {
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

#[wasm_bindgen]
pub fn parse_typescript_signatures(code: &str) -> JsValue {
    match extract_typescript_signatures(code) {
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
pub fn parse_typescript_doc_comments(code: &str) -> JsValue {
    match extract_typescript_doc_comments(code) {
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
pub fn parse_rust_signatures(code: &str) -> JsValue {
    match extract_rust_signatures(code) {
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
                        "is_unsafe": sig.is_unsafe,
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
pub fn parse_rust_doc_comments(code: &str) -> JsValue {
    match extract_rust_doc_comments(code) {
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
pub fn parse_csharp_signatures(code: &str) -> JsValue {
    match extract_csharp_signatures(code) {
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
pub fn parse_csharp_doc_comments(code: &str) -> JsValue {
    match extract_csharp_doc_comments(code) {
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
pub fn parse_php_signatures(code: &str) -> JsValue {
    match extract_php_signatures(code) {
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
                        "is_variadic": sig.is_variadic,
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
pub fn parse_php_doc_comments(code: &str) -> JsValue {
    match extract_php_doc_comments(code) {
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

    // Regex patterns for single-line function definitions
    // Matches: def function_name(params) -> return_type:
    // Also matches: async def function_name(params) -> return_type:
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*(?:->\s*([^:]+))?\s*:"
    ).map_err(|e| format!("Regex error: {}", e))?;

    // Pattern for multi-line function definitions
    // Matches: def function_name( or async def function_name(
    let multiline_start_pattern = Regex::new(
        r"(?m)^(\s*)(async\s+)?def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(\s*$"
    ).map_err(|e| format!("Regex error: {}", e))?;

    let lines: Vec<&str> = code.lines().collect();
    let mut i = 0;

    while i < lines.len() {
        let line = lines[i];

        // First try single-line function pattern
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
                    line_number: i + 1,
                    is_async,
                });
            }
            i += 1;
            continue;
        }

        // Try multi-line function pattern
        if let Some(caps) = multiline_start_pattern.captures(line) {
            let is_async = caps.get(2).is_some();
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let start_line = i;

            if !method_name.is_empty() {
                // Collect parameters from subsequent lines until we find the closing )
                let mut params_lines = Vec::new();
                let mut return_type: Option<String> = None;
                let mut j = i + 1;

                while j < lines.len() {
                    let next_line = lines[j].trim();

                    // Check if this line ends the function definition
                    if next_line.contains("):") || next_line.contains(") ->") || next_line == "):" {
                        // Extract return type if present
                        if let Some(arrow_pos) = next_line.find("->") {
                            let after_arrow = &next_line[arrow_pos + 2..];
                            let end = after_arrow.find(':').unwrap_or(after_arrow.len());
                            let rt = after_arrow[..end].trim();
                            if !rt.is_empty() {
                                return_type = Some(rt.to_string());
                            }
                        }
                        // Check if there are params on this line before the )
                        if let Some(paren_pos) = next_line.find(')') {
                            let params_part = &next_line[..paren_pos];
                            if !params_part.is_empty() {
                                params_lines.push(params_part.to_string());
                            }
                        }
                        break;
                    }

                    // Skip empty lines and comments
                    if !next_line.is_empty() && !next_line.starts_with('#') {
                        params_lines.push(next_line.to_string());
                    }
                    j += 1;
                }

                // Join all parameter lines and parse
                let params_str = params_lines.join(", ");
                let parameters = parse_parameters(&params_str);
                let signature = format!("def {}({})", method_name, params_str);

                signatures.push(PythonSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: start_line + 1,
                    is_async,
                });
            }
        }

        i += 1;
    }

    Ok(signatures)
}

fn parse_parameters(params_text: &str) -> Vec<String> {
    if params_text.trim().is_empty() {
        return vec![];
    }

    // Split on commas, but respect angle brackets (for generics like <K, V>)
    let mut params = Vec::new();
    let mut current_param = String::new();
    let mut angle_bracket_depth = 0;

    for ch in params_text.chars() {
        match ch {
            '<' => {
                angle_bracket_depth += 1;
                current_param.push(ch);
            }
            '>' => {
                angle_bracket_depth -= 1;
                current_param.push(ch);
            }
            ',' if angle_bracket_depth == 0 => {
                let trimmed = current_param.trim().to_string();
                if !trimmed.is_empty() {
                    params.push(trimmed);
                }
                current_param.clear();
            }
            _ => {
                current_param.push(ch);
            }
        }
    }

    // Don't forget the last parameter
    let trimmed = current_param.trim().to_string();
    if !trimmed.is_empty() {
        params.push(trimmed);
    }

    params
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

fn extract_typescript_signatures(code: &str) -> Result<Vec<TypeScriptSignature>, String> {
    let mut signatures = Vec::new();

    // Regex patterns for TypeScript function/method definitions
    // Matches: function name(params): return_type
    // Also matches: async function name(params): return_type
    // Also matches: export function name(params): return_type
    // Also matches: method(params): return_type (for class methods)
    // Also matches: generic functions like function<T>(params): return_type
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:export\s+)?(?:async\s+)?(?:function\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:<[^>]+>)?\s*\((.*?)\)(?:\s*:\s*([^{=;]+?))?(?:\s*[{=;]|$)"
    ).map_err(|e| format!("Regex error: {}", e))?;

    // Regex pattern for object method definitions (used by node-redis)
    // Matches: methodName(params) { ... } or methodName(params): return_type { ... }
    // Example: parseCommand(parser: CommandParser, key: RedisArgument) { ... }
    let object_method_pattern = Regex::new(
        r"(?m)^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((.*?)\)(?:\s*:\s*([^{]+?))?\s*\{"
    ).map_err(|e| format!("Regex error: {}", e))?;

    // Regex pattern for transformArguments/transformReply functions (node-redis pattern)
    // Matches: transformArguments(key: RedisArgument, ...): RedisArgument[]
    let transform_pattern = Regex::new(
        r"(?m)^\s*(transformArguments|transformReply)\s*(?:\([^)]*\))?\s*\((.*?)\)(?:\s*:\s*([^{]+?))?\s*[{=]"
    ).map_err(|e| format!("Regex error: {}", e))?;

    // Regex pattern for TypeScript interface method signatures (used by ioredis)
    // Matches: methodName(params): ReturnType;
    // Example: get(key: RedisKey, callback?: Callback<string>): Result<string, Context>;
    let interface_method_pattern = Regex::new(
        r"(?m)^\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        // First try standard function pattern
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(3).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(4).map(|m| m.as_str().trim().to_string());

            // Skip if it looks like a variable assignment or property
            if method_name.is_empty() || method_name.chars().next().map_or(false, |c| c.is_uppercase()) {
                continue;
            }

            let is_async = line.contains("async");
            let parameters = parse_parameters(params_str);

            let signature = format!("{}({})", method_name, params_str);

            signatures.push(TypeScriptSignature {
                method_name,
                signature,
                parameters,
                return_type,
                line_number: line_num + 1,
                is_async,
            });
            continue;
        }

        // Try transform pattern (node-redis specific)
        if let Some(caps) = transform_pattern.captures(line) {
            let method_name = caps.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(3).map(|m| m.as_str().trim().to_string());

            if !method_name.is_empty() {
                let parameters = parse_parameters(params_str);
                let signature = format!("{}({})", method_name, params_str);

                signatures.push(TypeScriptSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    is_async: false,
                });
                continue;
            }
        }

        // Try object method pattern (for parseCommand, etc.)
        if let Some(caps) = object_method_pattern.captures(line) {
            let method_name = caps.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(3).map(|m| m.as_str().trim().to_string());

            // Skip common non-method patterns (control flow keywords and common non-API methods)
            let skip_names = [
                "if", "for", "while", "switch", "catch", "with", "else",
                "try", "throw", "return", "new", "typeof", "instanceof",
                "delete", "void", "yield", "await", "case", "default",
                "constructor", "get", "set", // property accessors
            ];

            if method_name.is_empty() || skip_names.contains(&method_name.as_str()) {
                continue;
            }

            // Also skip if it looks like a standalone function call (not a method definition)
            // Method definitions typically start with specific indentation or after certain patterns
            let trimmed = line.trim();
            if trimmed.starts_with("if ") || trimmed.starts_with("if(")
                || trimmed.starts_with("for ") || trimmed.starts_with("for(")
                || trimmed.starts_with("while ") || trimmed.starts_with("while(")
                || trimmed.starts_with("switch ") || trimmed.starts_with("switch(") {
                continue;
            }

            let parameters = parse_parameters(params_str);
            let signature = format!("{}({})", method_name, params_str);

            signatures.push(TypeScriptSignature {
                method_name,
                signature,
                parameters,
                return_type,
                line_number: line_num + 1,
                is_async: false,
            });
            continue;
        }

        // Try interface method pattern (for TypeScript interface method signatures like ioredis)
        // Matches lines like: "  get(" which are interface method declarations
        if let Some(caps) = interface_method_pattern.captures(line) {
            let method_name = caps.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();

            // Skip common non-method patterns
            let skip_names = [
                "if", "for", "while", "switch", "catch", "with", "else",
                "try", "throw", "return", "new", "typeof", "instanceof",
                "delete", "void", "yield", "await", "case", "default",
                "constructor", "super", "function", "reject", "resolve",
            ];

            if method_name.is_empty() || skip_names.contains(&method_name.as_str()) {
                continue;
            }

            // Check if the line ends with semicolon (interface method) or has Result/Promise return type
            // This helps distinguish interface methods from regular function calls
            let trimmed = line.trim();
            let is_interface_method = trimmed.ends_with(";") ||
                trimmed.contains("): Result<") ||
                trimmed.contains("): Promise<") ||
                trimmed.contains("Callback<");

            if !is_interface_method {
                // For multi-line signatures, check if this looks like the start of an interface method
                // Interface methods in ioredis start with 2 spaces of indentation
                if !line.starts_with("  ") || line.starts_with("    ") {
                    continue;
                }
            }

            // Extract parameters - for multi-line signatures, we'll just use what's on this line
            let params_start = line.find('(').map(|i| i + 1).unwrap_or(0);
            let params_end = line.find(')').unwrap_or(line.len());
            let params_str = if params_start < params_end {
                &line[params_start..params_end]
            } else {
                ""
            };

            // Extract return type if present on the same line
            let return_type = if let Some(colon_pos) = line.rfind("): ") {
                let after_colon = &line[colon_pos + 3..];
                let end = after_colon.find(';').unwrap_or(after_colon.len());
                Some(after_colon[..end].trim().to_string())
            } else {
                None
            };

            let parameters = parse_parameters(params_str);
            let signature = format!("{}({})", method_name, params_str);

            signatures.push(TypeScriptSignature {
                method_name,
                signature,
                parameters,
                return_type,
                line_number: line_num + 1,
                is_async: false,
            });
        }
    }

    Ok(signatures)
}

fn extract_rust_signatures(code: &str) -> Result<Vec<RustSignature>, String> {
    let mut signatures = Vec::new();

    // Regex pattern for Rust function/method definitions
    // Matches: fn name(params) -> return_type
    // Also matches: async fn name(params) -> return_type
    // Also matches: unsafe fn name(params) -> return_type
    // Also matches: pub fn, pub async fn, pub unsafe fn, etc.
    // Also matches: generic functions like fn<T>(params) -> return_type
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:unsafe\s+)?(?:extern\s+[a-zA-Z0-9_]*\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:<[^>]+>)?\s*\((.*?)\)(?:\s*->\s*([^{;]+?))?(?:\s*[{;]|$)"
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(3).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(4).map(|m| m.as_str().trim().to_string());

            if !method_name.is_empty() {
                let is_async = line.contains("async");
                let is_unsafe = line.contains("unsafe");
                let parameters = parse_parameters(params_str);

                let signature = format!("fn {}({})", method_name, params_str);

                signatures.push(RustSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    is_async,
                    is_unsafe,
                });
            }
        }
    }

    Ok(signatures)
}

fn extract_typescript_doc_comments(code: &str) -> Result<Vec<TypeScriptDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find function/method definitions
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:export\s+)?(?:async\s+)?(?:function\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)(?:<[^>]+>)?\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Look for JSDoc comment before the function
                if let Some(doc_comment) = extract_jsdoc_comment(&lines, line_num, indent) {
                    let (summary, description, parameters, returns) = parse_jsdoc_comment(&doc_comment);
                    doc_comments.push(TypeScriptDocComment {
                        method_name,
                        raw_comment: doc_comment,
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

fn extract_rust_doc_comments(code: &str) -> Result<Vec<RustDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find function/method definitions
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?(?:unsafe\s+)?(?:extern\s+[a-zA-Z0-9_]*\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:<[^>]+>)?\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Look for Rust doc comment before the function (///)
                if let Some(doc_comment) = extract_rust_doc_comment(&lines, line_num, indent) {
                    let (summary, description, parameters, returns) = parse_rust_doc_comment(&doc_comment);
                    doc_comments.push(RustDocComment {
                        method_name,
                        raw_comment: doc_comment,
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

fn extract_csharp_signatures(code: &str) -> Result<Vec<CSharpSignature>, String> {
    let mut signatures = Vec::new();

    // Regex pattern for C# method definitions
    // Matches: [modifiers] return_type method_name(params)
    // Handles: public, private, protected, static, async, virtual, override, etc.
    // Also handles generic methods like GetList<T> and generic return types like List<T>
    let method_pattern = Regex::new(
        r"(?m)^(\s*)(?:(public|private|protected|internal|static|async|virtual|override|abstract|sealed|partial)\s+)*([a-zA-Z_][a-zA-Z0-9_]*(?:<[^>]*>)?(?:\?)?(?:\[\])*)\s+([a-zA-Z_][a-zA-Z0-9_<>]*)\s*\((.*?)\)(?:\s*[{;])?"
    ).map_err(|e| format!("Regex error: {}", e))?;

    // Regex pattern for C# extension methods
    // Matches: public static return_type method_name(this Type param, ...)
    // Example: public static bool ClientSetInfo(this IDatabase db, SetInfoAttr attr, string value)
    let extension_method_pattern = Regex::new(
        r"(?m)^(\s*)(?:public\s+)?(?:static\s+)?([a-zA-Z_][a-zA-Z0-9_]*(?:<[^>]*>)?(?:\?)?(?:\[\])*)\s+([a-zA-Z_][a-zA-Z0-9_<>]*)\s*\(\s*this\s+([^,)]+)(?:,\s*(.*?))?\)(?:\s*[{;])?"
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        // First try to match extension methods (with 'this' keyword)
        if line.contains("this ") || line.contains("this\t") {
            if let Some(caps) = extension_method_pattern.captures(line) {
                let return_type = caps.get(2).map(|m| m.as_str().trim().to_string());
                let method_name_with_generics = caps.get(3).map(|m| m.as_str()).unwrap_or_default();
                // caps.get(4) is the "this Type param" part - we skip it as it's the extension target
                let remaining_params = caps.get(5).map(|m| m.as_str()).unwrap_or("");

                if !method_name_with_generics.is_empty() {
                    // Extract method name without generic parameters
                    let method_name = method_name_with_generics
                        .split('<')
                        .next()
                        .unwrap_or(method_name_with_generics)
                        .to_string();

                    let is_async = line.contains("async");
                    let parameters = parse_parameters(remaining_params);

                    // For the signature, include the remaining params (excluding the 'this' param)
                    let signature = format!("{}({})", method_name_with_generics, remaining_params);

                    signatures.push(CSharpSignature {
                        method_name,
                        signature,
                        parameters,
                        return_type,
                        line_number: line_num + 1,
                        modifiers: vec!["public".to_string(), "static".to_string()],
                        is_async,
                    });
                }
                continue;
            }
        }

        // Then try regular method definitions
        if let Some(caps) = method_pattern.captures(line) {
            let modifiers_str = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(3).map(|m| m.as_str().trim().to_string());
            let method_name_with_generics = caps.get(4).map(|m| m.as_str()).unwrap_or_default();
            let params_str = caps.get(5).map(|m| m.as_str()).unwrap_or("");

            if !method_name_with_generics.is_empty() {
                // Extract method name without generic parameters (e.g., "GetList<T>" -> "GetList")
                let method_name = method_name_with_generics
                    .split('<')
                    .next()
                    .unwrap_or(method_name_with_generics)
                    .to_string();

                let modifiers: Vec<String> = modifiers_str
                    .split_whitespace()
                    .map(|s| s.to_string())
                    .collect();
                let is_async = line.contains("async");
                let parameters = parse_parameters(params_str);

                let signature = format!("{}({})", method_name_with_generics, params_str);

                signatures.push(CSharpSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    modifiers,
                    is_async,
                });
            }
        }
    }

    Ok(signatures)
}

fn extract_csharp_doc_comments(code: &str) -> Result<Vec<CSharpDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find method definitions (including generic methods and generic return types)
    let method_pattern = Regex::new(
        r"(?m)^(\s*)(?:(public|private|protected|internal|static|async|virtual|override|abstract|sealed|partial)\s+)*([a-zA-Z_][a-zA-Z0-9_]*(?:<[^>]*>)?(?:\?)?(?:\[\])*)\s+([a-zA-Z_][a-zA-Z0-9_<>]*)\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = method_pattern.captures(line) {
            let method_name_with_generics = caps.get(4).map(|m| m.as_str()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name_with_generics.is_empty() {
                // Extract method name without generic parameters
                let method_name = method_name_with_generics
                    .split('<')
                    .next()
                    .unwrap_or(method_name_with_generics)
                    .to_string();

                // Look for XML doc comment before the method
                if let Some(doc_comment) = extract_xml_doc_comment(&lines, line_num, indent) {
                    let (summary, description, parameters, returns) = parse_xml_doc_comment(&doc_comment);
                    doc_comments.push(CSharpDocComment {
                        method_name,
                        raw_comment: doc_comment,
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

fn extract_php_signatures(code: &str) -> Result<Vec<PHPSignature>, String> {
    let mut signatures = Vec::new();

    // Regex pattern for PHP function/method definitions
    // Matches: [modifiers] function name(params) [: return_type]
    // Handles: public, private, protected, static, abstract, final, etc.
    // Also handles variadic parameters (...$param)
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:(public|private|protected|static|abstract|final)\s+)*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)(?:\s*:\s*(\??[a-zA-Z_][a-zA-Z0-9_|\\]*(?:\[\])?))?"
    ).map_err(|e| format!("Regex error: {}", e))?;

    // Regex pattern for PHPDoc @method annotations
    // Matches: * @method return_type method_name(params)
    // Example: * @method int del(string[]|string $keyOrKeys, string ...$keys = null)
    let method_annotation_pattern = Regex::new(
        r"(?m)^\s*\*\s*@method\s+([a-zA-Z_][a-zA-Z0-9_|\\<>,\[\]]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)"
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in code.lines().enumerate() {
        // First try to match regular function definitions
        if let Some(caps) = func_pattern.captures(line) {
            let modifiers_str = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(4).map(|m| m.as_str()).unwrap_or("");
            let return_type = caps.get(5).map(|m| m.as_str().trim().to_string());

            if !method_name.is_empty() {
                let modifiers: Vec<String> = modifiers_str
                    .split_whitespace()
                    .map(|s| s.to_string())
                    .collect();

                // Check if parameters contain variadic operator (...)
                let is_variadic = params_str.contains("...");
                let parameters = parse_parameters(params_str);

                let signature = format!("function {}({})", method_name, params_str);

                signatures.push(PHPSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    modifiers,
                    is_variadic,
                });
            }
        }
        // Also try to match @method annotations (PHPDoc)
        else if let Some(caps) = method_annotation_pattern.captures(line) {
            let return_type = caps.get(1).map(|m| m.as_str().trim().to_string());
            let method_name = caps.get(2).map(|m| m.as_str().to_string()).unwrap_or_default();
            let params_str = caps.get(3).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Check if parameters contain variadic operator (...)
                let is_variadic = params_str.contains("...");
                let parameters = parse_parameters(params_str);

                let signature = format!("{}({})", method_name, params_str);

                signatures.push(PHPSignature {
                    method_name,
                    signature,
                    parameters,
                    return_type,
                    line_number: line_num + 1,
                    modifiers: vec!["public".to_string()], // @method annotations are implicitly public
                    is_variadic,
                });
            }
        }
    }

    Ok(signatures)
}

fn extract_php_doc_comments(code: &str) -> Result<Vec<PHPDocComment>, String> {
    let mut doc_comments = Vec::new();
    let lines: Vec<&str> = code.lines().collect();

    // Regex to find function/method definitions
    let func_pattern = Regex::new(
        r"(?m)^(\s*)(?:(public|private|protected|static|abstract|final)\s+)*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\("
    ).map_err(|e| format!("Regex error: {}", e))?;

    for (line_num, line) in lines.iter().enumerate() {
        if let Some(caps) = func_pattern.captures(line) {
            let method_name = caps.get(3).map(|m| m.as_str().to_string()).unwrap_or_default();
            let indent = caps.get(1).map(|m| m.as_str()).unwrap_or("");

            if !method_name.is_empty() {
                // Look for PHPDoc comment before the function
                if let Some(doc_comment) = extract_phpdoc_comment(&lines, line_num, indent) {
                    let (summary, description, parameters, returns) = parse_phpdoc_comment(&doc_comment);
                    doc_comments.push(PHPDocComment {
                        method_name,
                        raw_comment: doc_comment,
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

fn extract_phpdoc_comment(lines: &[&str], func_line: usize, _func_indent: &str) -> Option<String> {
    if func_line == 0 || lines.is_empty() {
        return None;
    }

    // PHPDoc comments use /** ... */ format
    // Look backwards from the function line to find doc comments
    let mut doc_lines = Vec::new();
    let mut found_end = false;

    for i in (0..func_line).rev() {
        let trimmed = lines[i].trim();

        // Check if this line ends with */
        if trimmed.ends_with("*/") {
            doc_lines.insert(0, trimmed);
            found_end = true;
        } else if found_end {
            // We're inside the doc comment
            doc_lines.insert(0, trimmed);
            // Check if this line starts with /**
            if trimmed.starts_with("/**") {
                break;
            }
        } else if !trimmed.is_empty() {
            // Stop if we hit a non-empty line before finding the end
            break;
        }
    }

    if doc_lines.is_empty() {
        return None;
    }

    let joined = doc_lines.join("\n");
    if joined.trim().is_empty() {
        return None;
    }

    Some(joined)
}

fn parse_phpdoc_comment(comment: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;

    let lines: Vec<&str> = comment.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns);
    }

    let mut current_section = "description";
    let mut current_content = String::new();
    let mut summary_found = false;

    for line in lines {
        let trimmed = line.trim();

        // Remove PHPDoc markers (/** and */)
        let content = if trimmed.starts_with("/**") {
            &trimmed[3..].trim()
        } else if trimmed.starts_with("*") && !trimmed.starts_with("*/") {
            &trimmed[1..].trim()
        } else if trimmed.starts_with("*/") {
            continue;
        } else {
            trimmed
        };

        // Check for @param tags
        if content.starts_with("@param") {
            // Save previous section
            if !current_content.is_empty() {
                if !summary_found {
                    summary = Some(current_content.trim().to_string());
                    summary_found = true;
                } else if current_section == "description" {
                    description = Some(current_content.trim().to_string());
                }
            }
            current_content.clear();
            current_section = "parameters";

            // Parse @param line (format: "@param type $name description")
            let param_content = content[6..].trim();
            if let Some(dollar_pos) = param_content.find('$') {
                let before_dollar = param_content[..dollar_pos].trim();
                let after_dollar = &param_content[dollar_pos + 1..];

                // Extract parameter name (first word after $)
                let param_name = after_dollar
                    .split_whitespace()
                    .next()
                    .unwrap_or("")
                    .to_string();

                // Extract description (rest of the line)
                let param_desc = after_dollar
                    .split_whitespace()
                    .skip(1)
                    .collect::<Vec<_>>()
                    .join(" ");

                if !param_name.is_empty() {
                    let full_desc = if !before_dollar.is_empty() && !param_desc.is_empty() {
                        format!("{} {}", before_dollar, param_desc)
                    } else if !before_dollar.is_empty() {
                        before_dollar.to_string()
                    } else {
                        param_desc
                    };
                    parameters.insert(param_name, full_desc);
                }
            }
        } else if content.starts_with("@return") {
            // Save previous section
            if !current_content.is_empty() {
                match current_section {
                    "description" => {
                        if !summary_found {
                            summary = Some(current_content.trim().to_string());
                            summary_found = true;
                        } else {
                            description = Some(current_content.trim().to_string());
                        }
                    }
                    "parameters" => {
                        // Already handled in @param section
                    }
                    _ => {}
                }
            }
            current_content.clear();
            current_section = "returns";

            // Parse @return line (format: "@return type description")
            let return_content = content[7..].trim();
            current_content = return_content.to_string();
        } else if !content.is_empty() {
            match current_section {
                "description" => {
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(content);
                }
                "parameters" => {
                    // Multi-line parameter description
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(content);
                }
                "returns" => {
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(content);
                }
                _ => {}
            }
        }
    }

    // Save final section
    if !current_content.is_empty() {
        match current_section {
            "description" => {
                if !summary_found {
                    summary = Some(current_content.trim().to_string());
                } else {
                    description = Some(current_content.trim().to_string());
                }
            }
            "returns" => {
                returns = Some(current_content.trim().to_string());
            }
            _ => {}
        }
    }

    (summary, description, parameters, returns)
}

fn extract_xml_doc_comment(lines: &[&str], method_line: usize, _method_indent: &str) -> Option<String> {
    if method_line == 0 || lines.is_empty() {
        return None;
    }

    // Find the first non-empty line before the method
    let mut end_line_idx = None;
    for i in (0..method_line).rev() {
        let trimmed = lines[i].trim();
        if !trimmed.is_empty() {
            // Check if this line starts with ///
            if trimmed.starts_with("///") {
                end_line_idx = Some(i);
            }
            break;
        }
    }

    // If we didn't find a line starting with ///, there's no XML doc
    let end_line_idx = match end_line_idx {
        Some(idx) => idx,
        None => return None,
    };

    // Now find the first /// line by going backwards from the end
    let mut start_line_idx = end_line_idx;
    for i in (0..=end_line_idx).rev() {
        let trimmed = lines[i].trim();
        if trimmed.starts_with("///") {
            start_line_idx = i;
        } else if !trimmed.is_empty() {
            // Stop if we hit a non-empty line that's not a ///
            break;
        }
    }

    // Collect all lines from start to end
    let mut comment_lines = Vec::new();
    for i in start_line_idx..=end_line_idx {
        comment_lines.push(lines[i].trim());
    }

    let joined = comment_lines.join("\n");
    if joined.trim().is_empty() {
        return None;
    }

    Some(joined)
}

fn parse_xml_doc_comment(comment: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;

    let lines: Vec<&str> = comment.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns);
    }

    let mut current_section = "description";
    let mut current_content = String::new();
    let mut current_param_name = String::new();
    let mut summary_found = false;

    for line in lines {
        let trimmed = line.trim();

        // Skip XML doc markers
        if trimmed.starts_with("///") || trimmed == "*" {
            let content = if trimmed.starts_with("///") {
                trimmed[3..].trim()
            } else {
                trimmed
            };

            // Check for <summary> tag
            if content.contains("<summary>") {
                if !current_content.is_empty() && !summary_found {
                    summary = Some(current_content.trim().to_string());
                    summary_found = true;
                }
                current_content.clear();
                current_section = "summary";

                // Extract content between <summary> and </summary>
                if let Some(start) = content.find("<summary>") {
                    let rest = &content[start + 9..];
                    if let Some(end) = rest.find("</summary>") {
                        summary = Some(rest[..end].trim().to_string());
                        summary_found = true;
                    } else {
                        current_content = rest.to_string();
                    }
                }
            } else if content.contains("</summary>") {
                if !current_content.is_empty() {
                    if let Some(end) = content.find("</summary>") {
                        current_content.push_str(&content[..end]);
                        summary = Some(current_content.trim().to_string());
                        summary_found = true;
                    }
                }
                current_content.clear();
                current_section = "description";
            } else if content.contains("<param") {
                // Parse <param name="paramName">description</param>
                if let Some(name_start) = content.find("name=\"") {
                    let rest = &content[name_start + 6..];
                    if let Some(name_end) = rest.find("\"") {
                        current_param_name = rest[..name_end].to_string();
                        let desc_start = &rest[name_end + 1..];
                        if let Some(desc_begin) = desc_start.find(">") {
                            let desc_content = &desc_start[desc_begin + 1..];
                            if let Some(desc_end) = desc_content.find("</param>") {
                                parameters.insert(current_param_name.clone(), desc_content[..desc_end].trim().to_string());
                            } else {
                                current_content = desc_content.to_string();
                                current_section = "parameters";
                            }
                        }
                    }
                }
            } else if content.contains("</param>") {
                if !current_content.is_empty() && !current_param_name.is_empty() {
                    if let Some(end) = content.find("</param>") {
                        current_content.push_str(&content[..end]);
                        parameters.insert(current_param_name.clone(), current_content.trim().to_string());
                    }
                }
                current_content.clear();
                current_param_name.clear();
            } else if content.contains("<returns>") {
                if !current_content.is_empty() && !current_param_name.is_empty() {
                    parameters.insert(current_param_name.clone(), current_content.trim().to_string());
                }
                current_content.clear();
                current_param_name.clear();
                current_section = "returns";

                // Extract content between <returns> and </returns>
                if let Some(start) = content.find("<returns>") {
                    let rest = &content[start + 9..];
                    if let Some(end) = rest.find("</returns>") {
                        returns = Some(rest[..end].trim().to_string());
                    } else {
                        current_content = rest.to_string();
                    }
                }
            } else if content.contains("</returns>") {
                if !current_content.is_empty() {
                    if let Some(end) = content.find("</returns>") {
                        current_content.push_str(&content[..end]);
                        returns = Some(current_content.trim().to_string());
                    }
                }
                current_content.clear();
            } else if !content.is_empty() {
                match current_section {
                    "summary" => {
                        if !current_content.is_empty() {
                            current_content.push(' ');
                        }
                        current_content.push_str(content);
                    }
                    "description" => {
                        if !summary_found && summary.is_none() {
                            summary = Some(content.to_string());
                            summary_found = true;
                        } else {
                            if !current_content.is_empty() {
                                current_content.push(' ');
                            }
                            current_content.push_str(content);
                        }
                    }
                    "parameters" => {
                        if !current_content.is_empty() {
                            current_content.push(' ');
                        }
                        current_content.push_str(content);
                    }
                    "returns" => {
                        if !current_content.is_empty() {
                            current_content.push(' ');
                        }
                        current_content.push_str(content);
                    }
                    _ => {}
                }
            }
        }
    }

    // Save any remaining content
    if !current_content.is_empty() {
        match current_section {
            "summary" => {
                if summary.is_none() {
                    summary = Some(current_content.trim().to_string());
                }
            }
            "description" => {
                if description.is_none() {
                    description = Some(current_content.trim().to_string());
                }
            }
            "parameters" => {
                if !current_param_name.is_empty() {
                    parameters.insert(current_param_name, current_content.trim().to_string());
                }
            }
            "returns" => {
                if returns.is_none() {
                    returns = Some(current_content.trim().to_string());
                }
            }
            _ => {}
        }
    }

    (summary, description, parameters, returns)
}

fn extract_jsdoc_comment(lines: &[&str], func_line: usize, _func_indent: &str) -> Option<String> {
    if func_line == 0 || lines.is_empty() {
        return None;
    }

    // Start from the line before the function and work backwards
    let mut end_line_idx = None;

    // Find the first non-empty line before the function
    for i in (0..func_line).rev() {
        let trimmed = lines[i].trim();
        if !trimmed.is_empty() {
            // Check if this line ends with */
            if trimmed.ends_with("*/") {
                end_line_idx = Some(i);
            }
            break;
        }
    }

    // If we didn't find a line ending with */, there's no JSDoc
    let end_line_idx = match end_line_idx {
        Some(idx) => idx,
        None => return None,
    };

    // Now find the opening /** by going backwards from the end
    let mut start_line_idx = None;
    for i in (0..=end_line_idx).rev() {
        let trimmed = lines[i].trim();
        if trimmed.contains("/**") {
            start_line_idx = Some(i);
            break;
        }
    }

    // If we didn't find the opening, there's no JSDoc
    let start_line_idx = match start_line_idx {
        Some(idx) => idx,
        None => return None,
    };

    // Collect all lines from start to end
    let mut comment_lines = Vec::new();
    for i in start_line_idx..=end_line_idx {
        comment_lines.push(lines[i].trim());
    }

    let joined = comment_lines.join("\n");
    if joined.trim().is_empty() {
        return None;
    }

    Some(joined)
}

fn parse_jsdoc_comment(comment: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;

    let lines: Vec<&str> = comment.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns);
    }

    let mut current_section = "description";
    let mut current_content = String::new();
    let mut current_param_name = String::new();
    let mut summary_found = false;

    for line in lines {
        let trimmed = line.trim();

        // Skip JSDoc markers
        if trimmed.starts_with("/**") || trimmed.starts_with("*/") || trimmed == "*" {
            continue;
        }

        // Remove leading * if present
        let content = if trimmed.starts_with("*") {
            trimmed[1..].trim()
        } else {
            trimmed
        };

        // Check for @param tag
        if content.starts_with("@param") {
            if !current_content.is_empty() && !current_param_name.is_empty() {
                parameters.insert(current_param_name.clone(), current_content.trim().to_string());
            } else if !current_content.is_empty() && !summary_found {
                summary = Some(current_content.trim().to_string());
                summary_found = true;
            } else if !current_content.is_empty() && summary_found && description.is_none() {
                description = Some(current_content.trim().to_string());
            }
            current_content.clear();
            current_section = "parameters";

            // Parse @param {type} name - description
            let param_line = &content[6..].trim();
            if let Some(name_start) = param_line.find('{') {
                if let Some(name_end) = param_line.find('}') {
                    let _param_type = &param_line[name_start + 1..name_end];
                    let rest = &param_line[name_end + 1..].trim();
                    if let Some(space_idx) = rest.find(' ') {
                        current_param_name = rest[..space_idx].to_string();
                        current_content = rest[space_idx + 1..].to_string();
                    } else {
                        current_param_name = rest.to_string();
                    }
                }
            } else {
                // Format: @param name - description
                if let Some(space_idx) = param_line.find(' ') {
                    current_param_name = param_line[..space_idx].to_string();
                    current_content = param_line[space_idx + 1..].to_string();
                } else {
                    current_param_name = param_line.to_string();
                }
            }
        } else if content.starts_with("@returns") || content.starts_with("@return") {
            if !current_content.is_empty() && !current_param_name.is_empty() {
                parameters.insert(current_param_name.clone(), current_content.trim().to_string());
            } else if !current_content.is_empty() && !summary_found {
                summary = Some(current_content.trim().to_string());
                summary_found = true;
            } else if !current_content.is_empty() && summary_found && description.is_none() {
                description = Some(current_content.trim().to_string());
            }
            current_content.clear();
            current_param_name.clear();
            current_section = "returns";

            let return_line = if content.starts_with("@returns") {
                &content[8..].trim()
            } else {
                &content[7..].trim()
            };
            current_content = return_line.to_string();
        } else if !content.is_empty() {
            match current_section {
                "description" => {
                    if !summary_found {
                        if summary.is_none() {
                            summary = Some(content.to_string());
                            summary_found = true;
                        } else {
                            if !current_content.is_empty() {
                                current_content.push(' ');
                            }
                            current_content.push_str(content);
                        }
                    } else {
                        if !current_content.is_empty() {
                            current_content.push(' ');
                        }
                        current_content.push_str(content);
                    }
                }
                "parameters" => {
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(content);
                }
                "returns" => {
                    if !current_content.is_empty() {
                        current_content.push(' ');
                    }
                    current_content.push_str(content);
                }
                _ => {}
            }
        }
    }

    // Save final section
    if !current_content.is_empty() {
        match current_section {
            "description" => {
                if !summary_found {
                    summary = Some(current_content.trim().to_string());
                } else {
                    description = Some(current_content.trim().to_string());
                }
            }
            "parameters" => {
                if !current_param_name.is_empty() {
                    parameters.insert(current_param_name, current_content.trim().to_string());
                }
            }
            "returns" => returns = Some(current_content.trim().to_string()),
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

fn extract_rust_doc_comment(lines: &[&str], func_line: usize, _func_indent: &str) -> Option<String> {
    if func_line == 0 || lines.is_empty() {
        return None;
    }

    // Rust doc comments use /// (outer doc comment)
    // Look backwards from the function line to find doc comments
    let mut doc_lines = Vec::new();
    let mut found_doc = false;

    for i in (0..func_line).rev() {
        let trimmed = lines[i].trim();

        // Check if this line is a doc comment
        if trimmed.starts_with("///") {
            doc_lines.insert(0, trimmed);
            found_doc = true;
        } else if found_doc && !trimmed.is_empty() {
            // Stop if we hit a non-empty, non-doc-comment line
            break;
        } else if !trimmed.is_empty() && !found_doc {
            // Stop if we hit a non-empty line before finding doc comments
            break;
        }
    }

    if doc_lines.is_empty() {
        return None;
    }

    let joined = doc_lines.join("\n");
    if joined.trim().is_empty() {
        return None;
    }

    Some(joined)
}

fn parse_rust_doc_comment(comment: &str) -> (Option<String>, Option<String>, std::collections::HashMap<String, String>, Option<String>) {
    let mut summary = None;
    let mut description = None;
    let mut parameters = std::collections::HashMap::new();
    let mut returns = None;

    let lines: Vec<&str> = comment.lines().collect();
    if lines.is_empty() {
        return (summary, description, parameters, returns);
    }

    let mut current_section = "description";
    let mut current_content = String::new();
    let mut summary_found = false;

    for line in lines {
        let trimmed = line.trim();

        // Remove /// prefix
        let content = if trimmed.starts_with("/// ") {
            &trimmed[4..]
        } else if trimmed.starts_with("///") {
            &trimmed[3..]
        } else {
            trimmed
        };

        // Check for section headers
        if content.starts_with("# Arguments") || content.starts_with("# Parameters") {
            if !current_content.is_empty() {
                if !summary_found {
                    summary = Some(current_content.trim().to_string());
                    summary_found = true;
                } else {
                    description = Some(current_content.trim().to_string());
                }
            }
            current_section = "parameters";
            current_content.clear();
        } else if content.starts_with("# Returns") {
            if !current_content.is_empty() {
                match current_section {
                    "description" => {
                        if !summary_found {
                            summary = Some(current_content.trim().to_string());
                            summary_found = true;
                        } else {
                            description = Some(current_content.trim().to_string());
                        }
                    }
                    "parameters" => {
                        // Parse parameter line (format: "name - description")
                        let parts: Vec<&str> = current_content.splitn(2, '-').collect();
                        if parts.len() >= 1 {
                            let param_info = parts[0].trim();
                            let param_desc = if parts.len() == 2 { parts[1].trim() } else { "" };
                            parameters.insert(param_info.to_string(), param_desc.to_string());
                        }
                    }
                    _ => {}
                }
            }
            current_section = "returns";
            current_content.clear();
        } else if !content.is_empty() {
            if !current_content.is_empty() {
                current_content.push(' ');
            }
            current_content.push_str(content);
        }
    }

    // Save final section
    if !current_content.is_empty() {
        match current_section {
            "description" => {
                if !summary_found {
                    summary = Some(current_content.trim().to_string());
                } else {
                    description = Some(current_content.trim().to_string());
                }
            }
            "parameters" => {
                let parts: Vec<&str> = current_content.splitn(2, '-').collect();
                if parts.len() >= 1 {
                    let param_info = parts[0].trim();
                    let param_desc = if parts.len() == 2 { parts[1].trim() } else { "" };
                    parameters.insert(param_info.to_string(), param_desc.to_string());
                }
            }
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
