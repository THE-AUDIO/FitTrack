def test_create_workout(client, auth_headers):
    ex_list = client.get("/api/exercises", headers=auth_headers).json()
    pompes = [e for e in ex_list if e["name"] == "Pompes"][0]

    res = client.post("/api/workouts", headers=auth_headers, json={
        "title": "Morning Workout",
        "date": "2026-06-11",
        "duration_minutes": 30,
        "exercises": [{
            "exercise_id": pompes["id"],
            "order_index": 0,
            "rest_seconds": 60,
            "sets": [
                {"set_number": 1, "reps": 20, "weight_kg": None},
                {"set_number": 2, "reps": 18, "weight_kg": None},
                {"set_number": 3, "reps": 15, "weight_kg": None},
            ],
        }],
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Morning Workout"
    assert data["total_calories"] is not None
    assert len(data["exercises"]) == 1
    assert len(data["exercises"][0]["sets"]) == 3


def test_list_workouts(client, auth_headers):
    res = client.get("/api/workouts", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_get_workout(client, auth_headers):
    ex_list = client.get("/api/exercises", headers=auth_headers).json()
    ex = ex_list[0]
    create = client.post("/api/workouts", headers=auth_headers, json={
        "title": "Get Test", "date": "2026-06-11", "duration_minutes": 20,
        "exercises": [{
            "exercise_id": ex["id"], "order_index": 0,
            "sets": [{"set_number": 1, "reps": 10}],
        }],
    }).json()

    res = client.get(f"/api/workouts/{create['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Get Test"


def test_delete_workout(client, auth_headers):
    ex_list = client.get("/api/exercises", headers=auth_headers).json()
    ex = ex_list[0]
    create = client.post("/api/workouts", headers=auth_headers, json={
        "title": "To Delete", "date": "2026-06-11", "duration_minutes": 10,
        "exercises": [{"exercise_id": ex["id"], "order_index": 0, "sets": []}],
    }).json()

    res = client.delete(f"/api/workouts/{create['id']}", headers=auth_headers)
    assert res.status_code == 204


def test_workout_calories(client, auth_headers, user_id):
    ex_list = client.get("/api/exercises", headers=auth_headers).json()
    pompes = [e for e in ex_list if e["name"] == "Pompes"][0]

    client.put("/api/auth/me", headers=auth_headers, json={"weight_kg": 75})
    w = client.post("/api/workouts", headers=auth_headers, json={
        "title": "Cal Test", "date": "2026-06-11", "duration_minutes": 30,
        "exercises": [{
            "exercise_id": pompes["id"], "order_index": 0, "rest_seconds": 60,
            "sets": [
                {"set_number": 1, "reps": 45},
                {"set_number": 2, "reps": 30},
                {"set_number": 3, "reps": 25},
                {"set_number": 4, "reps": 20},
            ],
        }],
    }).json()

    assert w["total_calories"] is not None
    assert w["total_calories"] > 0

    cal_res = client.get(f"/api/workouts/{w['id']}/calories", headers=auth_headers)
    assert cal_res.status_code == 200
    assert cal_res.json()["total_calories"] > 0
