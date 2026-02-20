# Milestone 2.1: Commands Data Loader

**Objective**: Implement the data access layer for loading Redis commands from JSON files and create the `list_redis_commands` tool.

**Estimated Duration**: 2-3 hours
**Status**: IN PROGRESS

## Overview

This milestone implements the foundation for data access in the MCP server. You'll create:
1. A commands loader module that reads and merges commands from 5 JSON files
2. A data access layer with filtering and caching
3. The `list_redis_commands` tool implementation

## Tasks

### Task 1: Create Commands Loader Module
**File**: `node/src/data/commands-loader.ts`

Create a TypeScript module that:
- Loads commands from 5 JSON files:
  - `data/commands_core.json` (core Redis commands)
  - `data/commands_redisearch.json` (RediSearch module)
  - `data/commands_redisjson.json` (RedisJSON module)
  - `data/commands_redisbloom.json` (RedisBloom module)
  - `data/commands_redistimeseries.json` (RedisTimeSeries module)
- Merges all commands into a single map
- Deduplicates by command name (core takes precedence)
- Exports `loadAllCommands()` function
- Exports `CommandInfo` type with: name, module, summary, deprecated_since?, group?

**Success Criteria**:
- [ ] Module loads all 5 files successfully
- [ ] Returns merged command map
- [ ] Handles missing files gracefully
- [ ] TypeScript compiles without errors

### Task 2: Create Data Access Layer
**File**: `node/src/data/data-access.ts`

Create a data access module that:
- Exports `getAllCommands()` function
- Exports `getCommandsByModule(module: string)` function
- Exports `getCommandsByFilter(options)` function with:
  - `includeModules?: boolean` (default: true)
  - `includeDeprecated?: boolean` (default: true)
  - `moduleFilter?: string[]` (default: [])
- Caches loaded commands in memory
- Returns commands with proper structure

**Success Criteria**:
- [ ] Functions return correct data structure
- [ ] Filtering works correctly
- [ ] Caching works (second call is instant)
- [ ] TypeScript compiles without errors

### Task 3: Implement list_redis_commands Tool
**File**: `node/src/tools/list-redis-commands.ts`

Update the tool handler to:
- Call data access layer functions
- Validate input with Zod schema
- Return proper response structure:
  - `commands`: Array of {name, module, deprecated?, summary?}
  - `total_count`: Number
  - `by_module`: Record<string, number>
- Handle errors gracefully

**Success Criteria**:
- [ ] Tool returns real command data
- [ ] Filtering works correctly
- [ ] Response structure matches schema
- [ ] Error handling works

### Task 4: Test Implementation
**File**: `node/src/test-commands-loader.ts`

Create a test script that:
- Tests loading all commands
- Tests filtering by module
- Tests deprecated command filtering
- Tests response structure
- Verifies counts are correct

**Success Criteria**:
- [ ] All tests pass
- [ ] Counts match expected values
- [ ] Filtering works correctly

### Task 5: Update Documentation
**Files**: `DEVELOPMENT.md`, `node/src/tools/README.md`

Update documentation to:
- Document the commands loader module
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
│   ├── commands-loader.ts    # Load commands from JSON files
│   └── data-access.ts        # Data access layer with filtering
├── tools/
│   ├── list-redis-commands.ts # Updated tool implementation
│   └── README.md              # Updated documentation
└── test-commands-loader.ts    # Test script
```

### Data File Locations
- `data/commands_core.json` - Core Redis commands
- `data/commands_redisearch.json` - RediSearch commands
- `data/commands_redisjson.json` - RedisJSON commands
- `data/commands_redisbloom.json` - RedisBloom commands
- `data/commands_redistimeseries.json` - RedisTimeSeries commands

### Expected Command Count
- Core: ~200 commands
- RediSearch: ~20 commands
- RedisJSON: ~30 commands
- RedisBloom: ~10 commands
- RedisTimeSeries: ~15 commands
- **Total**: ~275 commands (after deduplication)

## Success Criteria - ALL MUST PASS

- [x] Commands loader module created and working
- [x] Data access layer implemented with filtering
- [x] list_redis_commands tool fully functional
- [x] Test script passes all tests
- [x] TypeScript compiles without errors
- [x] Documentation updated
- [x] No console errors or warnings

## Common Issues & Solutions

**Issue**: "Cannot find module 'data/commands_core.json'"
- **Solution**: Use `path.resolve()` to get absolute path from project root

**Issue**: Commands not loading
- **Solution**: Check file paths are relative to project root, not current directory

**Issue**: Filtering not working
- **Solution**: Ensure module names match exactly (case-sensitive)

## Next Steps

After completing this milestone:
1. Mark this milestone as COMPLETE in IMPLEMENTATION_PLAN.md
2. Update progress tracking (4/20 milestones complete)
3. Move to Milestone 2.2 (Components Loader)

---

**Milestone Status**: IN PROGRESS
**Last Updated**: 2026-02-16

