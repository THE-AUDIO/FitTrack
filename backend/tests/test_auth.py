def test_register(client):
    res = client.post("/api/auth/register", json={
        "email": "new@example.com",
        "password": "password123",
        "full_name": "New User",
    })
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_register_duplicate(client):
    client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "password123",
        "full_name": "User",
    })
    res = client.post("/api/auth/register", json={
        "email": "dup@example.com",
        "password": "password123",
        "full_name": "User",
    })
    assert res.status_code == 409


def test_login(client):
    client.post("/api/auth/register", json={
        "email": "login@example.com",
        "password": "password123",
        "full_name": "Login User",
    })
    res = client.post("/api/auth/login", json={
        "email": "login@example.com",
        "password": "password123",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data


def test_login_invalid(client):
    res = client.post("/api/auth/login", json={
        "email": "wrong@example.com",
        "password": "wrong",
    })
    assert res.status_code == 401


def test_refresh(client):
    reg = client.post("/api/auth/register", json={
        "email": "refresh@example.com",
        "password": "password123",
        "full_name": "Refresh",
    })
    refresh_token = reg.json()["refresh_token"]

    res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_me(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_update_profile(client, auth_headers):
    res = client.put("/api/auth/me", headers=auth_headers, json={
        "weight_kg": 75.5,
        "height_cm": 180,
        "country": "France",
        "city": "Paris",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["weight_kg"] == 75.5
    assert data["country"] == "France"
