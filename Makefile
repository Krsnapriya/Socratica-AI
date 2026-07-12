.PHONY: build run stop clean test load-test seed publish-sandbox validate

# Build sandbox images (do this first, after any tracer/runner changes)
build-sandbox:
	docker compose --profile build build

# Build all images
build: build-sandbox
	docker compose build

# Start full stack (gateway + mongo + redis)
run:
	docker compose up -d

# Tail logs
logs:
	docker compose logs -f

# Stop everything
stop:
	docker compose down

# Stop and remove volumes
clean:
	docker compose down -v

# Seed oracle solutions (requires running MongoDB)
seed:
	@echo "Seeding oracle solutions..."
	@node scripts/seed-oracles.js

# Test sandbox via gateway (requires running stack)
test:
	curl -s -X POST http://localhost:3000/api/trace \
		-H "Content-Type: application/json" \
		-d '{"student_code":"def solve():\n  return 42\n\nsolve()","problem_id":"reverse-string","user_id":"test","language":"python"}' | jq .

# Test C++ via gateway
test-cpp:
	curl -s -X POST http://localhost:3000/api/trace \
		-H "Content-Type: application/json" \
		-d '{"student_code":"#include <cstdio>\nint main() { printf(\"%d\\n\", 42); return 0; }","problem_id":"reverse-string","user_id":"test","language":"cpp"}' | jq .

# Run Locust load test
load-test:
	locust -f deployment/locustfile.py --headless \
		-u $(USERS) --spawn-rate $(SPAWN_RATE) \
		--run-time $(RUN_TIME) --host http://localhost:3000

# Trivy vulnerability scan
scan:
	trivy image --exit-code 1 --severity HIGH,CRITICAL socratica/sandbox:latest

# Validate all files syntax
validate:
	@echo "Validating server files..."
	@for f in $$(find server -name '*.js' -not -path '*/node_modules/*'); do node -c "$$f" || exit 1; done
	@echo "All server files OK."

# Build and publish sandbox Docker images (requires Docker Hub login)
publish-sandbox: build-sandbox
	docker tag socratica/sandbox-python:latest socratica/sandbox-python:latest
	docker tag socratica/sandbox-cpp:latest socratica/sandbox-cpp:latest
	docker tag socratica/sandbox-javascript:latest socratica/sandbox-javascript:latest
	docker push socratica/sandbox-python:latest
	docker push socratica/sandbox-cpp:latest
	docker push socratica/sandbox-javascript:latest
	@echo "Sandbox images published."

# Health check (gateway only)
health:
	curl -s http://localhost:3000/health | jq .

# Show running containers
ps:
	docker compose ps
