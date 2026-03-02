#!/bin/bash
# Merge all individual command JSON files into a single command-api-mapping.json
#
# Usage: ./build/merge-command-api-mapping.sh [output_file]
# Default output: data/command-api-mapping.json

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
SOURCE_DIR="$REPO_ROOT/data/command-api-mapping"
OUTPUT_FILE="${1:-$REPO_ROOT/data/command-api-mapping.json}"

echo "Merging command API mapping files..."
echo "Source directory: $SOURCE_DIR"
echo "Output file: $OUTPUT_FILE"

# Create a temporary file for building the merged JSON
TEMP_FILE=$(mktemp)

# Start the JSON object
echo "{" > "$TEMP_FILE"

# Track if this is the first entry (for comma handling)
FIRST=true

# Process each JSON file in the directory
for file in "$SOURCE_DIR"/*.json; do
    # Skip if no JSON files found
    [ -e "$file" ] || continue
    
    # Get the command name from the filename (remove .json extension)
    filename=$(basename "$file")
    command_name="${filename%.json}"
    
    # Add comma before entries (except the first)
    if [ "$FIRST" = true ]; then
        FIRST=false
    else
        echo "," >> "$TEMP_FILE"
    fi
    
    # Add the command entry: "COMMAND_NAME": { content }
    printf '  "%s": ' "$command_name" >> "$TEMP_FILE"
    cat "$file" >> "$TEMP_FILE"
    
done

# Close the JSON object
echo "" >> "$TEMP_FILE"
echo "}" >> "$TEMP_FILE"

# Format the JSON and write to output file
jq '.' "$TEMP_FILE" > "$OUTPUT_FILE"

# Clean up
rm "$TEMP_FILE"

# Count and report
FILE_COUNT=$(ls -1 "$SOURCE_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
echo "✓ Merged $FILE_COUNT command files into $OUTPUT_FILE"

