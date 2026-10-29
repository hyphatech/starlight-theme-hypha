.DEFAULT_GOAL := help
.PHONY: help setup test lint build serve

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

test: node_modules ## the options, contrast and docs' build
	bun test test

lint: node_modules ## the plugin's types
	bunx tsc --noEmit -p .

build: node_modules ## the docs site, built into _build/docs
	bun --bun astro build --root docs

# The built docs, as a host serves it: Pagefind's index exists only in a
# build, and a page served as it changes loads its styles after its text.
# Run from the docs' own directory, where Astro finds it again.
serve: build ## the built docs, served as a host would, search included
	cd docs && bun --bun astro preview --open
