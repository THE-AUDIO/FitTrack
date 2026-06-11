import json
import os
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import settings
from app.models.workout import WorkoutSession, WorkoutExercise
from app.models.nutrition import NutritionSuggestion, SuggestionContextEnum


class NutritionService:
    def __init__(self, db: Session):
        self.db = db
        self._gemini_client = None
        self._groq_client = None
        if settings.gemini_api_key:
            try:
                from google import genai
                self._gemini_client = genai.Client(api_key=settings.gemini_api_key)
            except ImportError:
                pass
        if settings.groq_api_key:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=settings.groq_api_key)
            except ImportError:
                pass

    def _call_gemini(self, prompt: str) -> Optional[dict]:
        try:
            response = self._gemini_client.models.generate_content(
                model=settings.gemini_model,
                contents=prompt,
                config={"temperature": 0.7, "max_output_tokens": 1000},
            )
            content = response.text.strip()
            return self._parse_json_response(content)
        except Exception:
            return None

    def _call_groq(self, prompt: str) -> Optional[dict]:
        try:
            response = self._groq_client.chat.completions.create(
                model=settings.groq_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000,
            )
            content = response.choices[0].message.content.strip()
            return self._parse_json_response(content)
        except Exception:
            return None

    @staticmethod
    def _parse_json_response(content: str) -> dict:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
        return json.loads(content.strip())

    def _fallback_suggestion(self, calories: int, locale_str: str) -> dict:
        return {
            "recovery_foods": [
                {"name": "Banane", "reason": "Glucides rapides + potassium pour la récupération musculaire"},
                {"name": "Œufs", "reason": "Protéines complètes pour la réparation des tissus"},
                {"name": "Eau de coco", "reason": "Hydratation et électrolytes naturels"},
            ],
            "meal_plan": {
                "timing": "Dans les 30-60 min post-séance (fenêtre anabolique)",
                "snack": f"Banane + poignée d'amandes (~250 kcal)",
                "meal": f"Repas équilibré protéines + glucides complexes (~{int(calories * 0.4)} kcal)",
            },
            "hydration_tip": "Buvez 500ml d'eau dans l'heure suivant l'entraînement. Ajoutez une pincée de sel si vous avez beaucoup transpiré.",
        }

    def suggest(
        self,
        session_id: str,
        context: str,
        user_country: str,
        user_city: Optional[str],
    ) -> NutritionSuggestion:
        session = self.db.query(WorkoutSession).options(
            joinedload(WorkoutSession.exercises).joinedload(WorkoutExercise.sets),
            joinedload(WorkoutSession.exercises).joinedload(WorkoutExercise.exercise),
        ).filter(WorkoutSession.id == session_id).first()

        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        calories = session.total_calories or 0
        locale_parts = [user_country]
        if user_city:
            locale_parts.insert(0, user_city)
        locale_str = ", ".join(locale_parts)

        exercises_detail = []
        for we in session.exercises:
            sets_detail = []
            for s in we.sets:
                parts = []
                if s.reps is not None:
                    parts.append(f"{s.reps} reps")
                if s.weight_kg is not None:
                    parts.append(f"{s.weight_kg} kg")
                if s.duration_seconds is not None:
                    parts.append(f"{s.duration_seconds}s")
                sets_detail.append(f"Série {s.set_number}: {', '.join(parts) if parts else 'terminé'}")
            muscles = ", ".join(we.exercise.muscle_groups) if we.exercise.muscle_groups else "N/A"
            exercises_detail.append(
                f"- {we.exercise.name} ({we.exercise.category})\n"
                f"  Muscles: {muscles} | MET: {we.exercise.met_value} | Repos: {we.rest_seconds or 0}s\n"
                f"  Calories brûlées: {we.calories_burned or 0} kcal\n"
                f"  Séries:\n" + "\n".join(f"    {sd}" for sd in sets_detail)
            )

        exercises_str = "\n".join(exercises_detail)

        skill_path = os.path.join(os.path.dirname(__file__), "..", "..", "skills", "nutrition-suggestions", "SKILL.md")
        skill_path = os.path.abspath(skill_path)
        skill_content = ""
        if os.path.exists(skill_path):
            with open(skill_path, encoding="utf-8") as f:
                skill_content = f.read().strip()

        prompt = f"""{skill_content}

# Contexte de la séance
L'utilisateur vient de terminer une séance de sport. Voici le détail :

**Informations générales**
- Titre : {session.title}
- Date : {session.date}
- Durée : {session.duration_minutes} minutes
- Calories totales brûlées : {calories} kcal
- Localisation : {locale_str}

**Exercices réalisés**
{exercises_str}"""

        suggestion_json = None
        if self._gemini_client:
            suggestion_json = self._call_gemini(prompt)
        if suggestion_json is None and self._groq_client:
            suggestion_json = self._call_groq(prompt)
        if suggestion_json is None:
            suggestion_json = self._fallback_suggestion(calories, locale_str)

        suggestion = self.db.query(NutritionSuggestion).filter(
            NutritionSuggestion.session_id == session_id
        ).first()
        if suggestion:
            suggestion.calories_burned = calories
            suggestion.context = SuggestionContextEnum(context)
            suggestion.country = user_country
            suggestion.city = user_city
            suggestion.suggestion_json = suggestion_json
        else:
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
