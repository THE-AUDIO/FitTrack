def test_list_default_exercises(client, auth_headers):
    res = client.get("/api/exercises", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 10


def test_create_custom_exercise(client, auth_headers):
    res = client.post("/api/exercises", headers=auth_headers, json={
        "name": "Test Exercise",
        "category": "Musculation",
        "muscle_groups": ["Biceps", "Triceps"],
        "met_value": 4.5,
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Test Exercise"
    assert data["met_value"] == 4.5
    assert data["is_default"] == False


def test_get_exercise(client, auth_headers):
    create = client.post("/api/exercises", headers=auth_headers, json={
        "name": "Get Test", "category": "Cardio", "met_value": 5.0,
    })
    ex_id = create.json()["id"]
    res = client.get(f"/api/exercises/{ex_id}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Get Test"


def test_update_custom_exercise(client, auth_headers):
    create = client.post("/api/exercises", headers=auth_headers, json={
        "name": "Old Name", "category": "HIIT", "met_value": 6.0,
    })
    ex_id = create.json()["id"]
    res = client.put(f"/api/exercises/{ex_id}", headers=auth_headers, json={
        "name": "New Name", "met_value": 7.0,
    })
    assert res.status_code == 200
    assert res.json()["name"] == "New Name"
    assert res.json()["met_value"] == 7.0


def test_delete_custom_exercise(client, auth_headers):
    create = client.post("/api/exercises", headers=auth_headers, json={
        "name": "To Delete", "category": "Stretching", "met_value": 2.0,
    })
    ex_id = create.json()["id"]
    res = client.delete(f"/api/exercises/{ex_id}", headers=auth_headers)
    assert res.status_code == 204


def test_cannot_delete_default(client, auth_headers):
    list_res = client.get("/api/exercises", headers=auth_headers)
    default_ex = [e for e in list_res.json() if e["is_default"]][0]
    res = client.delete(f"/api/exercises/{default_ex['id']}", headers=auth_headers)
    assert res.status_code == 403
