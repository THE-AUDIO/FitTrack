from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.stats import StatsService

router = APIRouter(prefix="/api/calories", tags=["calories"])


@router.get("/history")
def calories_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StatsService(db).calories_history(user.id)
