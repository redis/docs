# Milestone 2.2: Components Loader & Client Info Tools

**Objective**: Implement the data access layer for loading client library information from JSON files and create the `list_clients` and `get_client_info` tools.

**Estimated Duration**: 2-3 hours
**Status**: NOT STARTED

## Overview

This milestone implements the second part of the data access layer. You'll create:
1. A components loader module that reads client library metadata from JSON files
2. A data access layer with filtering and caching
3. The `list_clients` and `get_client_info` tool implementations

## Tasks

### Task 1: Create Components Loader Module
**File**: `node/src/data/components-loader.ts`

Create a TypeScript module that:
- Loads `data/components/index.json` to get list of client IDs
- Loads individual client JSON files from `data/components/{client_id}.json`
- Filters out hiredis (hi_redis) from the client list
- Merges all client metadata into a single map
- Exports `loadAllComponents()` function
- Exports `ClientInfo` type with: id, type, name, language, label, repository

**Success Criteria**:
- [ ] Module loads components/index.json successfully
- [ ] Module loads all 14 client JSON files (excluding hiredis)
- [ ] Returns merged client map
- [ ] Handles missing files gracefully
- [ ] TypeScript compiles without errors

### Task 2: Create Data Access Layer
**File**: `node/src/data/components-access.ts`

Create a data access module that:
- Exports `getAllClients()` function
- Exports `getClientById(id: string)` function
- Exports `getClientsByLanguage(language: string)` function
- Exports `getClientsByFilter(options)` function with:
  - `languageFilter?: string[]` (default: [])
- Caches loaded components in memory
- Returns clients with proper structure

**Success Criteria**:
- [ ] Functions return correct data structure
- [ ] Filtering works correctly
- [ ] Caching works (second call is instant)
- [ ] TypeScript compiles without errors

### Task 3: Implement list_clients Tool
**File**: `node/src/tools/list-clients.ts`

Update the tool handler to:
- Call data access layer functions
- Validate input with Zod schema
- Return proper response structure:
  - `clients`: Array of {id, name, language, type}
  - `total_count`: Number
  - `by_language`: Record<string, number>
- Handle errors gracefully

**Success Criteria**:
- [ ] Tool returns real client data
- [ ] Filtering works correctly
- [ ] Response structure matches schema
- [ ] Error handling works

### Task 4: Implement get_client_info Tool
**File**: `node/src/tools/get-client-info.ts`

Update the tool handler to:
- Call data access layer functions
- Validate input with Zod schema
- Return proper response structure with full client metadata
- Handle missing clients gracefully with error message

**Success Criteria**:
- [ ] Tool returns real client data
- [ ] Returns all metadata fields
- [ ] Error handling for missing clients
- [ ] Response structure matches schema

### Task 5: Test Implementation
**File**: `node/src/test-components-loader.ts`

Create a test script that:
- Tests loading all components
- Tests filtering by language
- Tests response structure
- Verifies counts are correct
- Tests get_client_info for each client

**Success Criteria**:
- [ ] All tests pass
- [ ] Counts match expected values
- [ ] Filtering works correctly

### Task 6: Update Documentation
**Files**: `DEVELOPMENT.md`, `node/src/tools/README.md`

Update documentation to:
- Document the components loader module
- Document the data access layer
- Update tool status to "Implemented"
- Add usage examples

**Success Criteria**:
- [ ] Documentation is clear and complete
- [ ] Examples work correctly

## Implementation Notes

### File Structure
```
node/src/
├── data/
│   ├── commands-loader.ts      # Existing
│   ├── data-access.ts          # Existing
│   ├── components-loader.ts    # NEW: Load client metadata
│   └── components-access.ts    # NEW: Data access for clients
├── tools/
│   ├── list-clients.ts         # Updated tool implementation
│   ├── get-client-info.ts      # Updated tool implementation
│   └── README.md               # Updated documentation
└── test-components-loader.ts   # NEW: Test script
```

### Data File Locations
- `data/components/index.json` - Registry of all clients
- `data/components/{client_id}.json` - Individual client metadata

### Expected Client Count
- Total: 15 clients (including hiredis)
- Usable: 14 clients (excluding hiredis)
- Languages: 7 (Python, Java, Go, TypeScript, Rust, C#, PHP)

## Success Criteria - ALL MUST PASS

- [ ] Components loader module created and working
- [ ] Data access layer implemented with filtering
- [ ] list_clients tool fully functional
- [ ] get_client_info tool fully functional
- [ ] Test script passes all tests
- [ ] TypeScript compiles without errors
- [ ] Documentation updated
- [ ] No console errors or warnings

## Common Issues & Solutions

**Issue**: "Cannot find module 'data/components/index.json'"
- **Solution**: Use `path.resolve()` to get absolute path from project root

**Issue**: hiredis appearing in client list
- **Solution**: Filter out clients with id === 'hi_redis' in components-loader

**Issue**: Filtering not working
- **Solution**: Ensure language names match exactly (case-sensitive)

## Next Steps

After completing this milestone:
1. Mark this milestone as COMPLETE in IMPLEMENTATION_PLAN.md
2. Update progress tracking (5/20 milestones complete)
3. Move to Milestone 3.1 (Python Parser)

---

**Milestone Status**: NOT STARTED
**Last Updated**: 2026-02-16

