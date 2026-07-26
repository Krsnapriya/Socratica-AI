#!/usr/bin/env bash
# Socratica AI — Sandbox Entrypoint (v2)
# Supports: single execution (run_code), dual execution (submit), and stdin piping.
#
# Critical design rules:
#   - NEVER set -e. Every subprocess must be allowed to fail.
#   - All stderr from child processes goes to /dev/null or a tmp file.
#   - The ONLY thing written to stdout is the final JSON object.

set -uo pipefail

log() { printf '[sandbox] %s\n' "$*" >&2; }

decode() { printf '%s' "$1" | base64 -d; }

write_code() {
  local b64="$1" path="$2"
  decode "$b64" > "$path"
  chmod 444 "$path"
}

write_stdin() {
  local b64="$1" path="$2"
  if [[ -n "$b64" ]]; then
    decode "$b64" > "$path"
  else
    touch "$path"
  fi
}

json_escape() {
  printf '%s' "$1" \
    | sed 's/\\/\\\\/g' \
    | sed 's/"/\\"/g' \
    | tr '\n' ' ' \
    | sed 's/[[:cntrl:]]//g'
}

compile_cpp() {
  local src="$1" bin="$2"
  local err_file="/tmp/compile_err_$"
  local compile_timeout_ms="${COMPILE_TIMEOUT_MS:-10000}"
  local timeout_cmd=""
  if [[ "$compile_timeout_ms" -gt 0 ]]; then
    local timeout_sec=$(( (compile_timeout_ms + 999) / 1000 ))
    timeout_cmd="timeout ${timeout_sec} "
  fi
  eval "${timeout_cmd}g++ -std=c++17 -O2 -pipe -s \"$src\" -o \"$bin\" 2>\"$err_file\""
  local rc=$?
  if [[ $rc -eq 124 ]]; then
    printf '{"version":1,"error":"compile_timeout","stderr":"Compilation exceeded time limit","steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""}'
    rm -f "$err_file"
    return 1
  elif [[ $rc -ne 0 ]]; then
    local err; err=$(json_escape "$(cat "$err_file" 2>/dev/null | head -20)")
    printf '{"version":1,"error":"compile_error","stderr":"%s","steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""}' "$err"
    rm -f "$err_file"
    return 1
  fi
  rm -f "$err_file"
  return 0
}

run_one() {
  local lang="$1" src="$2" bin="$3" out_file="$4" stdin_file="${5:-}"
  local stdout_file="${out_file}.stdout"
  local stderr_file="${out_file}.stderr"
  local start_ns end_ns elapsed_ms stdout_content err_content rc

  local stdin_redirect=""
  if [[ -n "$stdin_file" && -s "$stdin_file" ]]; then
    stdin_redirect=" < $stdin_file"
  fi

  # Use TIMEOUT_MS env var for all languages (set by Docker container)
  local timeout_sec=$(( (TIMEOUT_MS + 999) / 1000 ))

  case "$lang" in
    python)
      if [[ -n "$stdin_redirect" ]]; then
        timeout "$timeout_sec" python3 /opt/socratica/tracer.py --input "$src" --output "$out_file" < "$stdin_file" 2>"$stderr_file"
      else
        timeout "$timeout_sec" python3 /opt/socratica/tracer.py --input "$src" --output "$out_file" 2>"$stderr_file"
      fi
      rc=$?
      if [[ $rc -eq 124 ]]; then
        printf '{"version":1,"error":"timeout","steps":0,"elapsed_ms":%d,"snapshots":[],"stdout":""}' "$((TIMEOUT_MS))" > "$out_file"
      elif [[ $rc -ne 0 ]] || [[ ! -s "$out_file" ]]; then
        local err; err=$(json_escape "$(cat "$stderr_file" 2>/dev/null | head -5)")
        printf '{"version":1,"error":"runtime_error","stderr":"%s","steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""}' "$err" > "$out_file"
      fi
      ;;

    javascript)
      start_ns=$(date +%s%N 2>/dev/null || echo 0)
      if [[ -n "$stdin_redirect" ]]; then
        timeout "$timeout_sec" node "$src" < "$stdin_file" >"$stdout_file" 2>"$stderr_file"
      else
        timeout "$timeout_sec" node "$src" >"$stdout_file" 2>"$stderr_file"
      fi
      rc=$?
      end_ns=$(date +%s%N 2>/dev/null || echo 0)
      elapsed_ms=$(( (end_ns - start_ns) / 1000000 ))

      stdout_content=$(json_escape "$(cat "$stdout_file" 2>/dev/null | head -c 4096)")
      if [[ $rc -eq 124 ]]; then
        printf '{"version":1,"error":"timeout","steps":0,"elapsed_ms":%d,"snapshots":[],"stdout":""}' "$elapsed_ms" > "$out_file"
      elif [[ $rc -ne 0 ]]; then
        err_content=$(json_escape "$(cat "$stderr_file" 2>/dev/null | head -5)")
        printf '{"version":1,"error":"runtime_error","stderr":"%s","steps":0,"elapsed_ms":%d,"snapshots":[],"stdout":"%s"}' \
          "$err_content" "$elapsed_ms" "$stdout_content" > "$out_file"
      else
        printf '{"version":1,"steps":0,"elapsed_ms":%d,"max_memory_bytes":0,"memory_delta_bytes":0,"max_loop_depth":0,"branch_count":0,"branch_factor":0,"has_divergence":false,"divergence_step":null,"snapshots":[],"stdout":"%s"}' \
          "$elapsed_ms" "$stdout_content" > "$out_file"
      fi
      ;;

    cpp)
      start_ns=$(date +%s%N 2>/dev/null || echo 0)
      if [[ -n "$stdin_redirect" ]]; then
        timeout "$timeout_sec" "$bin" < "$stdin_file" >"$stdout_file" 2>"$stderr_file"
      else
        timeout "$timeout_sec" "$bin" >"$stdout_file" 2>"$stderr_file"
      fi
      rc=$?
      end_ns=$(date +%s%N 2>/dev/null || echo 0)
      elapsed_ms=$(( (end_ns - start_ns) / 1000000 ))

      stdout_content=$(json_escape "$(cat "$stdout_file" 2>/dev/null | head -c 4096)")
      if [[ $rc -eq 124 ]]; then
        printf '{"version":1,"error":"timeout","steps":0,"elapsed_ms":%d,"snapshots":[],"stdout":""}' "$elapsed_ms" > "$out_file"
      elif [[ $rc -ne 0 ]]; then
        err_content=$(json_escape "$(cat "$stderr_file" 2>/dev/null | head -5)")
        printf '{"version":1,"error":"runtime_error","stderr":"%s","steps":0,"elapsed_ms":%d,"snapshots":[],"stdout":"%s"}' \
          "$err_content" "$elapsed_ms" "$stdout_content" > "$out_file"
      else
        printf '{"version":1,"steps":0,"elapsed_ms":%d,"max_memory_bytes":0,"memory_delta_bytes":0,"max_loop_depth":0,"branch_count":0,"branch_factor":0,"has_divergence":false,"divergence_step":null,"snapshots":[],"stdout":"%s"}' \
          "$elapsed_ms" "$stdout_content" > "$out_file"
      fi
      ;;

    *)
      printf '{"version":1,"error":"unknown_language","steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""}' > "$out_file"
      ;;
  esac

  rm -f "$stdout_file" "$stderr_file"
  return 0
}

merge_telemetry() {
  python3 -c "
import sys, json

def safe_load(path):
    try:
        with open(path) as f:
            raw = f.read().strip()
        while raw and ord(raw[0]) < 8:
            raw = raw[1:]
        return json.loads(raw)
    except Exception as e:
        return {'version': 1, 'error': 'parse_error: ' + str(e), 'steps': 0,
                'elapsed_ms': 0, 'snapshots': [], 'stdout': ''}

s = safe_load('/tmp/student_telemetry.json')
o = safe_load('/tmp/oracle_telemetry.json')
print(json.dumps({'student': s, 'oracle': o}))
"
}

main() {
  local student_b64="${STUDENT_CODE_B64:-}"
  local oracle_b64="${ORACLE_CODE_B64:-}"
  local lang="${LANGUAGE:-python}"
  local exec_mode="${EXEC_MODE:-dual}"
  local custom_input_b64="${CUSTOM_INPUT_B64:-}"

  if [[ -z "$student_b64" ]]; then
    printf '{"student":{"error":"missing_code"},"oracle":{}}\n'
    exit 1
  fi

  local ext
  case "$lang" in
    python)     ext=".py"   ;;
    javascript) ext=".js"   ;;
    cpp)        ext=".cpp"  ;;
    *)
      printf '{"student":{"error":"unknown_language"},"oracle":{}}\n'
      exit 1
      ;;
  esac

  local student_src="/tmp/student${ext}"
  local student_bin="/tmp/student_bin"
  local stdin_file="/tmp/custom_stdin"

  write_code "$student_b64" "$student_src"
  write_stdin "$custom_input_b64" "$stdin_file"

  if [[ "$exec_mode" == "single" ]]; then
    # Run Code mode — no oracle, just student code with optional stdin
    if [[ "$lang" == "cpp" ]]; then
      local compile_result
      compile_result=$(compile_cpp "$student_src" "$student_bin")
      if [[ $? -ne 0 ]]; then
        printf '{"student":%s,"oracle":{"version":1,"steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""}}\n' "$compile_result"
        return
      fi
    fi

    log "Running student ($lang) [single mode]..."
    run_one "$lang" "$student_src" "$student_bin" "/tmp/student_telemetry.json" "$stdin_file"

    python3 -c "
import json
def safe_load(path):
    try:
        with open(path) as f:
            raw = f.read().strip()
        while raw and ord(raw[0]) < 8:
            raw = raw[1:]
        return json.loads(raw)
    except:
        return {'version': 1, 'error': 'parse_error', 'steps': 0, 'elapsed_ms': 0, 'snapshots': [], 'stdout': ''}
s = safe_load('/tmp/student_telemetry.json')
print(json.dumps({'student': s, 'oracle': {}}))
"
    return
  fi

  # Dual mode — student + oracle (submit)
  if [[ -z "$oracle_b64" ]]; then
    printf '{"student":{"error":"missing_oracle"},"oracle":{}}\n'
    exit 1
  fi

  local oracle_src="/tmp/oracle${ext}"
  local oracle_bin="/tmp/oracle_bin"

  write_code "$oracle_b64" "$oracle_src"

  if [[ "$lang" == "cpp" ]]; then
    local compile_result
    compile_result=$(compile_cpp "$student_src" "$student_bin")
    if [[ $? -ne 0 ]]; then
      printf '{"student":%s,"oracle":{"version":1,"steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""}}\n' "$compile_result"
      return
    fi
    compile_result=$(compile_cpp "$oracle_src" "$oracle_bin")
    if [[ $? -ne 0 ]]; then
      printf '{"student":{"version":1,"steps":0,"elapsed_ms":0,"snapshots":[],"stdout":""},"oracle":%s}\n' "$compile_result"
      return
    fi
  fi

  log "Running student ($lang) [dual mode]..."
  run_one "$lang" "$student_src" "$student_bin" "/tmp/student_telemetry.json" "$stdin_file"

  log "Running oracle ($lang)..."
  run_one "$lang" "$oracle_src" "$oracle_bin" "/tmp/oracle_telemetry.json"

  merge_telemetry
}

main "$@"
