import fs from "fs";
import path from "path";
import {
  ExtractDocCommentsInput,
  ExtractDocCommentsInputSchema,
  ExtractDocCommentsOutput,
  DocCommentSchema,
} from "./schemas.js";
import { parsePythonDocComments, getDocumentedMethods } from "../parsers/python-doc-parser.js";
import { parsePythonSignatures } from "../parsers/python-parser.js";
import { parseJavaDocComments, parseJavaSignatures } from "../parsers/java-parser.js";
import { parseGoDocComments, parseGoSignatures } from "../parsers/go-parser.js";

/**
 * Extract documentation comments from source code.
 *
 * Parses source code and extracts doc comments (docstrings, JSDoc, etc.)
 * for methods, including summaries, descriptions, parameters, and returns.
 *
 * @param input - Input parameters (file_path, language, optional method_names)
 * @returns Extracted documentation comments
 */
export async function extractDocComments(
  input: unknown
): Promise<ExtractDocCommentsOutput> {
  // Validate input
  const validatedInput = ExtractDocCommentsInputSchema.parse(input);

  try {
    // Read file from disk
    const filePath = validatedInput.file_path;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const code = fs.readFileSync(filePath, "utf-8");

    // Language-specific parsing
    let docComments: Record<string, any> = {};
    let missingDocs: string[] = [];

    if (validatedInput.language === "python") {
      // Parse doc comments
      const allDocComments = parsePythonDocComments(code);

      // If method_names filter is provided, only include those
      if (validatedInput.method_names && validatedInput.method_names.length > 0) {
        validatedInput.method_names.forEach(methodName => {
          if (allDocComments[methodName]) {
            docComments[methodName] = allDocComments[methodName];
          }
        });
        missingDocs = validatedInput.method_names.filter(
          name => !allDocComments[name]
        );
      } else {
        docComments = allDocComments;

        // Find all methods and identify which ones are missing docs
        const allMethods = parsePythonSignatures(code).map(sig => sig.method_name);
        const documentedMethods = getDocumentedMethods(code);
        missingDocs = allMethods.filter(name => !documentedMethods.includes(name));
      }
    } else if (validatedInput.language === "java") {
      // Parse JavaDoc comments
      const allDocComments = parseJavaDocComments(code);

      // If method_names filter is provided, only include those
      if (validatedInput.method_names && validatedInput.method_names.length > 0) {
        validatedInput.method_names.forEach(methodName => {
          if (allDocComments[methodName]) {
            docComments[methodName] = allDocComments[methodName];
          }
        });
        missingDocs = validatedInput.method_names.filter(
          name => !allDocComments[name]
        );
      } else {
        docComments = allDocComments;

        // Find all methods and identify which ones are missing docs
        const allMethods = parseJavaSignatures(code).map(sig => sig.method_name);
        const documentedMethods = Object.keys(allDocComments);
        missingDocs = allMethods.filter(name => !documentedMethods.includes(name));
      }
    } else if (validatedInput.language === "go") {
      // Parse Go doc comments
      const allDocComments = parseGoDocComments(code);

      // If method_names filter is provided, only include those
      if (validatedInput.method_names && validatedInput.method_names.length > 0) {
        validatedInput.method_names.forEach(methodName => {
          if (allDocComments[methodName]) {
            docComments[methodName] = allDocComments[methodName];
          }
        });
        missingDocs = validatedInput.method_names.filter(
          name => !allDocComments[name]
        );
      } else {
        docComments = allDocComments;

        // Find all functions and identify which ones are missing docs
        const allFunctions = parseGoSignatures(code).map(sig => sig.method_name);
        const documentedFunctions = Object.keys(allDocComments);
        missingDocs = allFunctions.filter(name => !documentedFunctions.includes(name));
      }
    } else {
      // Other languages not yet implemented
      throw new Error(
        `Language '${validatedInput.language}' not yet supported for doc comment extraction`
      );
    }

    // Validate and convert to proper schema
    const validatedDocComments: Record<string, any> = {};
    Object.entries(docComments).forEach(([methodName, docComment]) => {
      try {
        const validated = DocCommentSchema.parse(docComment);
        validatedDocComments[methodName] = validated;
      } catch (error) {
        console.warn(`Failed to validate doc comment for ${methodName}:`, error);
      }
    });

    return {
      file_path: validatedInput.file_path,
      language: validatedInput.language,
      doc_comments: validatedDocComments,
      total_count: Object.keys(validatedDocComments).length,
      missing_docs: missingDocs,
    };
  } catch (error) {
    throw new Error(
      `Failed to extract doc comments: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

