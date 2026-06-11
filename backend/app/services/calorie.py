from app.models.workout import WorkoutSession, WorkoutExercise

CADENCE_MAP = {
    "Musculation": 20,
    "Cardio": 40,
    "HIIT": 30,
    "Stretching": 15,
}


def calculate_exercise_calories(
    exercise: WorkoutExercise,
    weight_kg: float,
) -> float:
    sets_data = exercise.sets if exercise.sets else []
    if not sets_data:
        return 0.0

    total_reps = sum(s.reps or 0 for s in sets_data)
    num_sets = len(sets_data)
    rest_seconds = exercise.rest_seconds or 60

    category = exercise.exercise.category if exercise.exercise else "Musculation"
    cadence = CADENCE_MAP.get(category, 20)
    met = exercise.exercise.met_value if exercise.exercise else 3.5

    duration_hours = (total_reps / cadence + num_sets * rest_seconds / 60) / 60
    calories = met * weight_kg * duration_hours
    return round(calories, 1)


def calculate_session_calories(session: WorkoutSession) -> float:
    user = session.user
    weight = user.weight_kg or 70
    total_calories = 0.0

    for we in session.exercises:
        cal = calculate_exercise_calories(we, weight)
        we.calories_burned = cal
        total_calories += cal

    max_cal = session.duration_minutes * (8.0 * weight / 60)
    total_calories = min(total_calories, max_cal)
    session.total_calories = round(total_calories, 1)
    return round(total_calories, 1)
