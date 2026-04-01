.PHONY: build clean dev test help

help:
	@echo "Redis Command-to-API Mapping MCP Server"
	@echo ""
	@echo "Available targets:"
	@echo "  make build       - Build both Rust and Node.js projects"
	@echo "  make build-rust  - Build Rust WASM project only"
	@echo "  make build-node  - Build Node.js project only"
	@echo "  make clean       - Clean all build artifacts"
	@echo "  make clean-rust  - Clean Rust build artifacts"
	@echo "  make clean-node  - Clean Node.js build artifacts"
	@echo "  make dev         - Run Node.js in development mode"
	@echo "  make test        - Run all tests"
	@echo "  make test-rust   - Run Rust tests"
	@echo "  make test-node   - Run Node.js tests"
	@echo "  make start       - Start the MCP server"

build: build-rust build-node
	@echo "✅ Build complete!"

build-rust:
	@echo "🔨 Building Rust WASM project..."
	cd rust && cargo build --release && wasm-pack build --target nodejs
	@echo "✅ Rust build complete!"

build-node:
	@echo "🔨 Building Node.js project..."
	cd node && npm run build
	@echo "✅ Node.js build complete!"

clean: clean-rust clean-node
	@echo "✅ Clean complete!"

clean-rust:
	@echo "🧹 Cleaning Rust artifacts..."
	cd rust && cargo clean
	rm -rf wasm/pkg

clean-node:
	@echo "🧹 Cleaning Node.js artifacts..."
	cd node && rm -rf dist node_modules

dev:
	@echo "🚀 Starting Node.js in development mode..."
	cd node && npm run dev

test: test-rust test-node
	@echo "✅ All tests passed!"

test-rust:
	@echo "🧪 Running Rust tests..."
	cd rust && cargo test

test-node:
	@echo "🧪 Running Node.js tests..."
	cd node && npm run test

start:
	@echo "🚀 Starting MCP server..."
	cd node && npm start

.DEFAULT_GOAL := help

