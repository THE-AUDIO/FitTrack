def test_stats_overview(client, auth_headers):
    res = client.get("/api/stats/overview", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_workouts" in data
    assert "current_streak" in data


def test_workouts_per_week(client, auth_headers):
    res = client.get("/api/stats/workouts-per-week", headers=auth_headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
