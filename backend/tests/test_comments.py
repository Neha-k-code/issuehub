import time


def make_issue(client, project_id, token, title="Test Issue"):
    r = client.post(f"/api/projects/{project_id}/issues",
                    json={"title": title, "priority": "medium"},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    return r.json()


def test_create_comment(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.post(f"/api/issues/{issue['id']}/comments",
                    json={"body": "This is a comment"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 201
    assert r.json()["body"] == "This is a comment"
    assert r.json()["author"]["email"] == "alice@example.com"


def test_list_comments(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    client.post(f"/api/issues/{issue['id']}/comments",
                json={"body": "First comment"},
                headers={"Authorization": f"Bearer {alice_token}"})
    client.post(f"/api/issues/{issue['id']}/comments",
                json={"body": "Second comment"},
                headers={"Authorization": f"Bearer {alice_token}"})
    r = client.get(f"/api/issues/{issue['id']}/comments",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    comments = r.json()
    assert len(comments) == 2
    assert comments[0]["body"] == "First comment"
    assert comments[1]["body"] == "Second comment"


def test_comments_oldest_first(client, alice_token, bob_token, project_with_bob):
    issue = make_issue(client, project_with_bob.id, alice_token)
    client.post(f"/api/issues/{issue['id']}/comments",
                json={"body": "Alice's comment"},
                headers={"Authorization": f"Bearer {alice_token}"})
    client.post(f"/api/issues/{issue['id']}/comments",
                json={"body": "Bob's comment"},
                headers={"Authorization": f"Bearer {bob_token}"})
    r = client.get(f"/api/issues/{issue['id']}/comments",
                   headers={"Authorization": f"Bearer {alice_token}"})
    comments = r.json()
    assert comments[0]["body"] == "Alice's comment"
    assert comments[1]["body"] == "Bob's comment"


def test_comment_by_member(client, alice_token, bob_token, project_with_bob):
    issue = make_issue(client, project_with_bob.id, alice_token)
    r = client.post(f"/api/issues/{issue['id']}/comments",
                    json={"body": "Bob's comment"},
                    headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 201


def test_comment_non_member_forbidden(client, alice_token, bob_token, project):
    # Bob is not a member of project
    issue = make_issue(client, project.id, alice_token)
    r = client.post(f"/api/issues/{issue['id']}/comments",
                    json={"body": "Sneaky comment"},
                    headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_empty_comment_rejected(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.post(f"/api/issues/{issue['id']}/comments",
                    json={"body": ""},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 422


def test_comment_on_nonexistent_issue(client, alice_token):
    r = client.post("/api/issues/99999/comments",
                    json={"body": "Ghost comment"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 404


def test_list_comments_on_nonexistent_issue(client, alice_token):
    r = client.get("/api/issues/99999/comments",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 404