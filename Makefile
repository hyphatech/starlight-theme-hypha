.DEFAULT_GOAL := help
.PHONY: help setup test lint example serve

help: ## list targets
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'

setup: ## install the dependencies
	@command -v bun >/dev/null 2>&1 || echo "The theme needs Bun 1.3 or later."
	bun install --frozen-lockfile

# Bun's dependencies, installed again whenever the lockfile or the manifest
# changes, so no target runs against what an older checkout installed.
node_modules: package.json bun.lock
	bun install --frozen-lockfile
	@touch node_modules

test: node_modules ## the plugin's options, the night's contrast at every hue, the example's build
	bun test test

lint: node_modules ## the plugin's types
	bunx tsc --noEmit -p .

example: node_modules ## the example site, built into _build/example
	bun --bun astro build --root example

serve: node_modules ## the example, served as it changes
	bun --bun astro dev --root example --open
