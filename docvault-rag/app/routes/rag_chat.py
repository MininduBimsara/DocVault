from fastapi import APIRouter, Depends

from app.core.security import require_internal_key
from app.schemas.rag_chat import RagChatRequest, RagChatResponse
from app.services.rag_chat_service import run_rag_chat

router = APIRouter()


@router.post("/chat", response_model=RagChatResponse, dependencies=[Depends(require_internal_key)])
async def rag_chat(body: RagChatRequest) -> RagChatResponse:
    return run_rag_chat(body)
