from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("")
async def health_check() -> JSONResponse:
    return JSONResponse(content={"status": "ok", "service": "docvault-rag"})
