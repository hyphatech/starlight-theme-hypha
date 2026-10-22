.PHONY: setup test lint example serve

setup: ## install the dependencies
	bun install

test: node_modules ## the plugin's options, the night's contrast at every hue, the example's build
	bun test test

lint: node_modules ## the plugin's types
	bunx tsc --noEmit -p .

example: node_modules ## the example site, built into _build/example
	bun --bun astro build --root example

serve: node_modules ## the example, served as it changes
	bun --bun astro dev --root example --open

node_modules: package.json
	bun install
	@touch node_modules
