# Chromadb + Python 3.14 Compatibility Fix

## Problem

Python **3.14** dropped the `pydantic.v1` compatibility shim that ships inside pydantic v2.
Chromadb **1.5.2** (the latest version, and the only one with pre-built Windows wheels) still uses `pydantic.v1.BaseSettings` internally. This causes the following error on import:

```
pydantic.v1.errors.ConfigError: unable to infer "chroma_server_nofile" attribute
```

## Root Cause

`chromadb/config.py` (inside the venv) does:

```python
try:
    from pydantic import BaseSettings   # fails on pydantic v2
except ImportError:
    from pydantic.v1 import BaseSettings  # broken on Python 3.14
    from pydantic.v1 import validator
```

On Python 3.14, `pydantic.v1` raises a `ConfigError` because the compat shim can no longer resolve model fields.

## Fix Applied

The file `.venv/Lib/site-packages/chromadb/config.py` was patched with four changes:

| #   | Change                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Replace `pydantic.v1` imports with `pydantic_settings.BaseSettings` + `pydantic.field_validator`                                           |
| 2   | Replace `@validator(...)` with `@field_validator(..., mode="before")` + `@classmethod`                                                     |
| 3   | Add `str`/`int` type annotations to 3 bare class variables (`chroma_coordinator_host`, `chroma_logservice_host`, `chroma_logservice_port`) |
| 4   | Convert inner `class Config` to `model_config = {..., "extra": "ignore"}`                                                                  |

## Re-applying the Patch

The patch applies only to the **local venv**. If you recreate the venv, run once after `pip install -r requirements.txt`:

```bash
# from docvault-rag/
.\.venv\Scripts\activate
python patch_chromadb.py
```

The script [`patch_chromadb.py`](./patch_chromadb.py) (in this directory) applies all four changes and verifies the import succeeds.

## Verification

```bash
.\.venv\Scripts\python.exe -c "import chromadb; print(chromadb.__version__)"
# → 1.5.2  (no error)
```

## Why Not Just Downgrade Chromadb?

| Version       | Issue                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------- |
| 0.4.x / 0.5.x | Requires building `chroma-hnswlib` from source — no pre-built Windows wheels for Python 3.14 |
| 1.x (latest)  | Pre-built wheels exist, but uses `pydantic.v1` broken on Python 3.14                         |

Patching the venv is the only viable option until the chromadb team ships an official Python 3.14 fix.
