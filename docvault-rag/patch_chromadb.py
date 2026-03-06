"""
patch_chromadb.py — Run once after creating/recreating the venv on Python 3.14.

Patches chromadb's config.py to use pydantic-settings v2 instead of the
pydantic.v1 compat shim, which was dropped in Python 3.14.

Usage:
    .venv/Scripts/python patch_chromadb.py
"""
import pathlib
import sys

config = pathlib.Path(sys.prefix) / "Lib/site-packages/chromadb/config.py"
if not config.exists():
    print(f"ERROR: chromadb not found at {config}")
    sys.exit(1)

text = config.read_text(encoding="utf-8")
original = text

# 1. Replace pydantic v1 imports with pydantic-settings v2
OLD_IMPORTS = (
    "in_pydantic_v2 = False\n"
    "try:\n"
    "    from pydantic import BaseSettings\n"
    "except ImportError:\n"
    "    in_pydantic_v2 = True\n"
    "    from pydantic.v1 import BaseSettings\n"
    "    from pydantic.v1 import validator\n"
    "\n"
    "if not in_pydantic_v2:\n"
    "    from pydantic import validator  # type: ignore # noqa\n"
)
NEW_IMPORTS = (
    "# Pydantic v2 / pydantic-settings v2 path (Python 3.14 compatible)\n"
    "from pydantic_settings import BaseSettings\n"
    "from pydantic import field_validator\n"
    "\n"
    "in_pydantic_v2 = True  # always pydantic v2 now\n"
)
text = text.replace(OLD_IMPORTS, NEW_IMPORTS)

# 2. Fix @validator -> @field_validator
text = text.replace(
    '@validator("chroma_server_nofile", pre=True, always=True, allow_reuse=True)\n'
    '    def empty_str_to_none',
    '@field_validator("chroma_server_nofile", mode="before")\n'
    '    @classmethod\n'
    '    def empty_str_to_none',
)

# 3. Move chroma_server_nofile field BEFORE validator (fix field order)
text = text.replace(
    '    @field_validator("chroma_server_nofile", mode="before")\n'
    '    @classmethod\n'
    '    def empty_str_to_none(cls, v: str) -> Optional[str]:\n'
    '        if type(v) is str and v.strip() == "":\n'
    '            return None\n'
    '        return v\n'
    '\n'
    '    chroma_server_nofile: Optional[int] = None\n',
    '    chroma_server_nofile: Optional[int] = None\n'
    '\n'
    '    @field_validator("chroma_server_nofile", mode="before")\n'
    '    @classmethod\n'
    '    def empty_str_to_none(cls, v: str) -> Optional[str]:\n'
    '        if type(v) is str and v.strip() == "":\n'
    '            return None\n'
    '        return v\n',
)

# 4. Add type annotations to bare class variables
for bare, typed in [
    ("    chroma_coordinator_host = ", "    chroma_coordinator_host: str = "),
    ("    chroma_logservice_host = ", "    chroma_logservice_host: str = "),
    ("    chroma_logservice_port = ", "    chroma_logservice_port: int = "),
]:
    text = text.replace(bare, typed)

# 5. Convert inner Config class to model_config
text = text.replace(
    "    class Config:\n        env_file = \".env\"\n        env_file_encoding = \"utf-8\"",
    '    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}',
)

# 6. Ensure existing model_config has extra=ignore
text = text.replace(
    '{"env_file": ".env", "env_file_encoding": "utf-8"}',
    '{"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}',
)

if text == original:
    print("WARNING: No changes were applied. chromadb may already be patched or layout changed.")
else:
    config.write_text(text, encoding="utf-8")
    print(f"chromadb config.py patched successfully at:\n  {config}")

# Verify
try:
    import importlib
    import chromadb  # noqa
    importlib.reload(chromadb)
    print("Import verification: OK")
except Exception as e:
    print(f"Import verification FAILED: {e}")
    print("Manual review of the patched file may be needed.")
