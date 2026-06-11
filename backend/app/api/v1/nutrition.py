from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.nutrition import NutritionSuggestRequest, NutritionSuggestionResponse
from app.services.nutrition import NutritionService

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


@router.post("/suggest", response_model=NutritionSuggestionResponse, status_code=status.HTTP_201_CREATED)
def suggest_nutrition(
    data: NutritionSuggestRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    suggestion = NutritionService(db).suggest(
        session_id=data.session_id,
        context=data.context,
        user_country=user.country or "France",
        user_city=user.city,
    )
    return suggestion


@router.get("/history", response_model=list[NutritionSuggestionResponse])
def nutrition_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return NutritionService(db).history(user.id)
