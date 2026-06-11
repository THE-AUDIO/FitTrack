import json
from typing import Optional

from anthropic import Anthropic
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.workout import WorkoutSession
from app.models.nutrition import NutritionSuggestion, SuggestionContextEnum


class NutritionService:
    def __init__(self, db: Session):
        self.db = db
        self.client = Anthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None

    def suggest(
        self,
        session_id: str,
        context: str,
        user_country: str,
        user_city: Optional[str],
    ) -> NutritionSuggestion:
        session = self.db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        calories = session.total_calories or 0
        locale_parts = [user_country]
        if user_city:
            locale_parts.insert(0, user_city)
        locale_str = ", ".join(locale_parts)

        prompt = f"""You are a fitness nutrition expert. A user just finished a workout and burned {calories} kcal.
Location: {locale_str}
Context: {context}

Provide localized post-workout nutrition suggestions in JSON format:
{{
  "recovery_foods": [{{"name": "...", "reason": "..."}}],
  "meal_plan": {{"timing": "...", "snack": "...", "meal": "..."}},
  "hydration_tip": "..."
}}

Use local foods from {locale_str}. Be specific and practical."""

        if not self.client:
            suggestion_json = {
                "recovery_foods": [
                    {"name": "Banane", "reason": "Glucides rapides + potassium"},
                    {"name": "Œufs", "reason": "Protéines complètes"},
                ],
                "meal_plan": {
                    "timing": "Dans les 30-60 min post-séance",
                    "snack": "Banane + eau (~120 kcal)",
                    "meal": f"Repas équilibré (~{int(calories * 0.4)} kcal)",
                },
                "hydration_tip": "Buvez 500ml d'eau dans l'heure.",
            }
        else:
            try:
                message = self.client.messages.create(
                    model=settings.claude_model,
                    max_tokens=1000,
                    temperature=0.7,
                    system="You are a helpful nutrition expert. Always respond in valid JSON only.",
                    messages=[{"role": "user", "content": prompt}],
                )
                content = message.content[0].text if message.content else "{}"
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                suggestion_json = json.loads(content.strip())
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"AI service error: {str(e)}",
                )

        suggestion = NutritionSuggestion(
            session_id=session_id,
            calories_burned=calories,
            context=SuggestionContextEnum(context),
            country=user_country,
            city=user_city,
            suggestion_json=suggestion_json,
        )
        self.db.add(suggestion)
        self.db.commit()
        self.db.refresh(suggestion)
        return suggestion

    def history(self, user_id: str) -> list[NutritionSuggestion]:
        return (
            self.db.query(NutritionSuggestion)
            .join(WorkoutSession, WorkoutSession.id == NutritionSuggestion.session_id)
            .filter(WorkoutSession.user_id == user_id)
            .order_by(NutritionSuggestion.generated_at.desc())
            .all()
        )
