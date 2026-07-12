"""
Socratica AI — Load Testing Script
===================================
Usage:
  locust -f locustfile.py --headless -u 150 --spawn-rate 10 \
    --run-time 5m --host http://localhost:3000
"""

import random
from locust import HttpUser, task, between

PROBLEMS = [
    {
        "problem_id": "reverse-string",
        "language": "python",
        "student_code": "def reverse_string(s):\n  return s[::-1]\n\nprint(reverse_string('hello'))",
    },
    {
        "problem_id": "fibonacci",
        "language": "python",
        "student_code": "def fib(n):\n  if n <= 1:\n    return n\n  return fib(n-1) + fib(n-2)\n\nprint(fib(10))",
    },
    {
        "problem_id": "two-sum",
        "language": "python",
        "student_code": "def two_sum(nums, target):\n  for i in range(len(nums)):\n    for j in range(i+1, len(nums)):\n      if nums[i] + nums[j] == target:\n        return [i, j]\n  return []\n\nprint(two_sum([2,7,11,15], 9))",
    },
    {
        "problem_id": "contains-duplicate",
        "language": "python",
        "student_code": "def contains_duplicate(nums):\n  seen = set()\n  for n in nums:\n    if n in seen:\n      return True\n    seen.add(n)\n  return False\n\nprint(contains_duplicate([1,2,3,1]))",
    },
]


class GatewayUser(HttpUser):
    wait_time = between(0.5, 2.0)

    @task
    def trace_submission(self):
        prob = random.choice(PROBLEMS)
        payload = {
            "student_code": prob["student_code"],
            "problem_id": prob["problem_id"],
            "user_id": f"load-test-{random.randint(1, 100)}",
            "language": prob["language"],
        }

        with self.client.post(
            "/api/trace",
            json=payload,
            catch_response=True,
            timeout=30,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"HTTP {resp.status_code}")
                return
            try:
                data = resp.json()
                if data.get("studentError"):
                    resp.failure(f"Student error: {data['studentError']}")
                elif "tier" not in data:
                    resp.failure("Missing tier in response")
                else:
                    resp.success()
            except Exception:
                resp.failure("Invalid JSON response")

    @task(5)
    def health_check(self):
        with self.client.get("/health", catch_response=True) as resp:
            if resp.status_code != 200:
                resp.failure(f"Health check failed: HTTP {resp.status_code}")
            else:
                resp.success()
