def test_create_project(client, alice_token):
    r = client.post("/api/projects", json={"name": "My Project", "key": "MP", "description": "desc"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 201
    assert r.json()["key"] == "MP"


def test_create_project_duplicate_key(client, alice_token, project):
    r = client.post("/api/projects", json={"name": "Another", "key": "TST", "description": ""},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 409
    assert r.json()["detail"]["error"]["code"] == "KEY_CONFLICT"


def test_list_projects_only_yours(client, alice_token, bob_token, project):
    # Alice is member of project, Bob is not
    r = client.get("/api/projects", headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert len(r.json()) == 1

    # Bob should see 0 projects (not a member of any)
    r2 = client.get("/api/projects", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 200
    assert len(r2.json()) == 0


def test_list_projects_empty(client, bob_token):
    r = client.get("/api/projects", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 200
    assert r.json() == []


def test_add_member(client, alice_token, bob, project):
    r = client.post(f"/api/projects/{project.id}/members",
                    json={"email": "bob@example.com", "role": "member"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code in (200, 201)
    assert r.json()["role"] == "member"
    assert r.json()["user"]["email"] == "bob@example.com"


def test_add_member_duplicate_updates_role(client, alice_token, bob, project_with_bob):
    # Bob is already a member — adding again with maintainer role should update it
    r = client.post(f"/api/projects/{project_with_bob.id}/members",
                    json={"email": "bob@example.com", "role": "maintainer"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code in (200, 201)
    assert r.json()["role"] == "maintainer"


def test_add_member_unauthorized(client, bob_token, bob, project_with_bob):
    # Bob is a member, not maintainer — cannot add members
    r = client.post(f"/api/projects/{project_with_bob.id}/members",
                    json={"email": "alice@example.com", "role": "member"},
                    headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_add_member_not_project_member(client, bob_token, project):
    # Bob is not in the project at all
    r = client.post(f"/api/projects/{project.id}/members",
                    json={"email": "alice@example.com", "role": "member"},
                    headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_add_member_user_not_found(client, alice_token, project):
    r = client.post(f"/api/projects/{project.id}/members",
                    json={"email": "ghost@example.com", "role": "member"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 404


def test_non_member_cannot_list_issues(client, bob_token, project):
    # Bob is not a member of project
    r = client.get(f"/api/projects/{project.id}/issues",
                   headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403