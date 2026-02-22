def test_signup_success(client):
    r = client.post("/api/auth/signup", json={"name": "Charlie", "email": "charlie@example.com", "password": "password123"})
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "charlie@example.com"
    assert data["name"] == "Charlie"
    assert "id" in data


def test_signup_duplicate_email(client, alice):
    r = client.post("/api/auth/signup", json={"name": "Alice2", "email": "alice@example.com", "password": "password123"})
    assert r.status_code == 409
    assert r.json()["detail"]["error"]["code"] == "EMAIL_CONFLICT"


def test_signup_short_password(client):
    r = client.post("/api/auth/signup", json={"name": "Dave", "email": "dave@example.com", "password": "abc"})
    assert r.status_code == 422


def test_signup_missing_name(client):
    r = client.post("/api/auth/signup", json={"email": "noname@example.com", "password": "password123"})
    assert r.status_code == 422


def test_signup_empty_name(client):
    r = client.post("/api/auth/signup", json={"name": "   ", "email": "noname@example.com", "password": "password123"})
    assert r.status_code == 422


def test_login_success(client, alice):
    r = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "password123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, alice):
    r = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "wrongpassword"})
    assert r.status_code == 401
    assert r.json()["detail"]["error"]["code"] == "INVALID_CREDENTIALS"


def test_login_missing_email(client):
    r = client.post("/api/auth/login", json={"password": "password123"})
    assert r.status_code == 422


def test_login_missing_password(client):
    r = client.post("/api/auth/login", json={"email": "alice@example.com"})
    assert r.status_code == 422


def test_login_unknown_email(client):
    r = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "password123"})
    assert r.status_code == 401


def test_me(client, alice, alice_token):
    r = client.get("/api/me", headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "alice@example.com"


def test_me_unauthenticated(client):
    r = client.get("/api/me")
    assert r.status_code == 403