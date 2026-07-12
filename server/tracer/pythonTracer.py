"""
Socratica AI — Python Tracer Module
Spec §3.2: Differential Telemetry Extraction
==============================================

Captures step-level telemetry via sys.settrace plus stdout capture
so the gateway can do both Tier 1 (variable snapshots) and Tier 2
(stdout comparison) verdicts.

Security: runs inside namespace-isolated sandbox with cgroups v2.
All output is JSON via stdout.
"""

import sys
import json
import os
import time
import io
import argparse
import re
from types import FrameType

TELEMETRY_VERSION = 1
MAX_SNAPSHOTS = 2000   # cap snapshots to keep JSON small
MAX_STDOUT_BYTES = 4096
HEX_ADDR_RE = re.compile(r' at 0x[0-9a-fA-F]+')


class TraceCollector:
    """
    Collects step-level telemetry during student/oracle code execution.

    Tier 1: Structural similarity (step-level variable snapshots, Python only)
    Tier 2: Outcome-level differentials (stdout comparison, all languages)
    """

    def __init__(self, code_path: str):
        self.code_path = os.path.abspath(code_path)
        self.steps: list = []
        self.start_time: float = time.monotonic()
        self.step_count: int = 0
        self.loop_depth: int = 0
        self.max_loop_depth: int = 0
        self.branch_count: int = 0
        self.max_memory_bytes: int = 0
        self.start_memory: int = self._get_memory()
        # Track which code objects contain loops (via opnames, version-safe)
        self._loop_frames: set = set()

    def _get_memory(self) -> int:
        try:
            with open(f"/proc/{os.getpid()}/status") as f:
                for line in f:
                    if line.startswith("VmRSS:"):
                        return int(line.split()[1]) * 1024
        except OSError:
            pass
        return 0

    def _has_loop(self, code) -> bool:
        """Return True if this code object contains a loop opcode."""
        cid = id(code)
        if cid in self._loop_frames:
            return True
        try:
            import dis
            for instr in dis.get_instructions(code):
                # JUMP_BACKWARD (3.12+), JUMP_ABSOLUTE (older), FOR_ITER
                if instr.opname in ("JUMP_BACKWARD", "JUMP_ABSOLUTE", "FOR_ITER"):
                    self._loop_frames.add(cid)
                    return True
        except Exception:
            pass
        return False

    def trace_callback(self, frame: FrameType, event: str, arg):
        # Stop tracing if this frame is not inside the user's compiled file
        if os.path.abspath(frame.f_code.co_filename) != self.code_path:
            return None

        if event == "line":
            # Skip tracing at module scope level
            if frame.f_code.co_name == "<module>":
                return self.trace_callback

            self.step_count += 1
            if self.step_count <= MAX_SNAPSHOTS:
                try:
                    locals_snapshot = {}
                    for k, v in frame.f_locals.items():
                        if k.startswith("_"):
                            continue
                        s = repr(v)[:120]
                        # Strip dynamic memory addresses
                        locals_snapshot[k] = HEX_ADDR_RE.sub(" at 0x...", s)
                except Exception:
                    locals_snapshot = {}
                self.steps.append({
                    "step":     self.step_count,
                    "lineno":   frame.f_lineno,
                    "function": frame.f_code.co_name,
                    "locals":   locals_snapshot,
                })
            if self.step_count % 500 == 0:
                mem = self._get_memory()
                if mem > self.max_memory_bytes:
                    self.max_memory_bytes = mem

        elif event == "call":
            if self._has_loop(frame.f_code):
                self.loop_depth += 1
                if self.loop_depth > self.max_loop_depth:
                    self.max_loop_depth = self.loop_depth
            self.branch_count += 1

        elif event == "return":
            if self.loop_depth > 0 and self._has_loop(frame.f_code):
                self.loop_depth -= 1

        return self.trace_callback

    def finalize(self, captured_stdout: str = "") -> dict:
        elapsed = time.monotonic() - self.start_time
        end_memory = self._get_memory()
        return {
            "version":            TELEMETRY_VERSION,
            "steps":              self.step_count,
            "elapsed_ms":         round(elapsed * 1000, 2),
            "max_memory_bytes":   self.max_memory_bytes,
            "memory_delta_bytes": end_memory - self.start_memory,
            "max_loop_depth":     self.max_loop_depth,
            "branch_count":       self.branch_count,
            "branch_factor":      round(self.branch_count / max(self.step_count, 1), 4),
            "has_divergence":     False,
            "divergence_step":    None,
            "snapshots":          self.steps,
            # ── Tier 2 verdict field ──────────────────────────────────
            "stdout":             captured_stdout.strip(),
        }


def run_trace(code_path: str) -> dict:
    collector = TraceCollector(code_path)

    # ── Capture stdout so we can include it in telemetry ─────────────
    real_stdout = sys.stdout
    captured_buf = io.StringIO()
    sys.stdout = captured_buf

    sys.settrace(collector.trace_callback)
    error = None

    try:
        with open(code_path) as f:
            code_source = f.read()
        compiled = compile(code_source, code_path, "exec")
        exec_globals = {"__name__": "__socratica_trace__"}
        exec(compiled, exec_globals)
    except SystemExit:
        # Allow sys.exit(0) without treating it as an error
        pass
    except Exception as exc:
        error = str(exc)
    finally:
        sys.settrace(None)
        sys.stdout = real_stdout

    captured_stdout = captured_buf.getvalue()[:MAX_STDOUT_BYTES]

    if error:
        return {
            "version":    TELEMETRY_VERSION,
            "error":      error,
            "steps":      collector.step_count,
            "elapsed_ms": round((time.monotonic() - collector.start_time) * 1000, 2),
            "snapshots":  collector.steps,
            "stdout":     captured_stdout.strip(),
        }

    return collector.finalize(captured_stdout)


def main():
    parser = argparse.ArgumentParser(description="Socratica AI Tracer")
    parser.add_argument("--mode",   choices=["trace"], default="trace")
    parser.add_argument("--input",  required=True,  help="Path to Python code file")
    parser.add_argument("--output", default="/dev/stdout", help="Output path (default: stdout)")
    args = parser.parse_args()

    result = run_trace(args.input)

    if args.output == "/dev/stdout":
        # Write to the *real* stdout (sys.stdout may have been restored already)
        os.write(1, (json.dumps(result) + "\n").encode())
    else:
        with open(args.output, "w") as f:
            json.dump(result, f)


if __name__ == "__main__":
    main()
