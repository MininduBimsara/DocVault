"""
Pydantic request / response schemas for the /ingest endpoint.
"""

from pydantic import BaseModel


class IngestRequest(BaseModel):
    userId: str
    docId: str
    filePath: str
    fileName: str


class IngestResponse(BaseModel):
    ok: bool
    message: str
