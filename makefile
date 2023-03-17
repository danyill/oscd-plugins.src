help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

uilib: _install ## Start UI-Lib in dev mode
	turbo run dev --filter=./packages/uilib...

communication-explorer: _install ## Start the communication explorer plugin in dev mode
	turbo run build:watch --filter=./packages/plugins/communication-explorer...

network-explorer: _install ## Start the network explorer plugin in dev mode
	turbo run build:watch --filter=./packages/plugins/network-explorer...

diffing-tool: _install ## Start the network explorer plugin in dev mode
	turbo run build:watch --filter=./packages/plugins/diffing-tool...

_install:
	pnpm install