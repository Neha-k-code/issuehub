from app.models.models import Issue, StatusEnum, PriorityEnum


def make_issue(client, project_id, token, title="Test Issue", priority="medium"):
    r = client.post(f"/api/projects/{project_id}/issues",
                    json={"title": title, "description": "desc", "priority": priority},
                    headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201
    return r.json()


def test_create_issue(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    assert issue["title"] == "Test Issue"
    assert issue["status"] == "open"
    assert issue["priority"] == "medium"


def test_create_issue_non_member(client, bob_token, project):
    r = client.post(f"/api/projects/{project.id}/issues",
                    json={"title": "Hack", "priority": "low"},
                    headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_create_issue_invalid_priority(client, alice_token, project):
    r = client.post(f"/api/projects/{project.id}/issues",
                    json={"title": "Bad Priority", "priority": "urgent"},
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 422


def test_list_issues(client, alice_token, project):
    make_issue(client, project.id, alice_token, "Issue 1")
    make_issue(client, project.id, alice_token, "Issue 2")
    r = client.get(f"/api/projects/{project.id}/issues",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_pagination(client, alice_token, project):
    for i in range(12):
        make_issue(client, project.id, alice_token, f"Issue {i}")
    r = client.get(f"/api/projects/{project.id}/issues?page=1&limit=10",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert r.json()["total"] == 12
    assert len(r.json()["items"]) == 10

    r2 = client.get(f"/api/projects/{project.id}/issues?page=2&limit=10",
                    headers={"Authorization": f"Bearer {alice_token}"})
    assert r2.status_code == 200
    assert len(r2.json()["items"]) == 2


def test_get_issue(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.get(f"/api/issues/{issue['id']}", headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert r.json()["id"] == issue["id"]


def test_get_issue_not_found(client, alice_token):
    r = client.get("/api/issues/99999", headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 404


def test_reporter_can_update_title(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.patch(f"/api/issues/{issue['id']}", json={"title": "Updated Title"},
                     headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert r.json()["title"] == "Updated Title"


def test_reporter_cannot_edit_others_issue(client, alice_token, bob_token, project_with_bob):
    # Alice creates an issue
    issue = make_issue(client, project_with_bob.id, alice_token, "Alice's Issue")
    # Bob (member) tries to edit it — should be forbidden
    r = client.patch(f"/api/issues/{issue['id']}", json={"title": "Bob was here"},
                     headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_member_cannot_change_status(client, alice_token, bob_token, project_with_bob):
    issue = make_issue(client, project_with_bob.id, alice_token)
    r = client.patch(f"/api/issues/{issue['id']}", json={"status": "closed"},
                     headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_maintainer_can_change_status(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.patch(f"/api/issues/{issue['id']}", json={"status": "resolved"},
                     headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert r.json()["status"] == "resolved"


def test_update_issue_invalid_status(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.patch(f"/api/issues/{issue['id']}", json={"status": "done"},
                     headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 422


def test_update_issue_not_found(client, alice_token):
    r = client.patch("/api/issues/99999", json={"title": "Ghost"},
                     headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 404


def test_reporter_cannot_delete_own_issue(client, alice_token, bob_token, project_with_bob):
    # Bob creates an issue
    issue = make_issue(client, project_with_bob.id, bob_token, "Bob's Issue")
    # Bob tries to delete it — only maintainer can delete
    r = client.delete(f"/api/issues/{issue['id']}", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_delete_issue_maintainer(client, alice_token, project):
    issue = make_issue(client, project.id, alice_token)
    r = client.delete(f"/api/issues/{issue['id']}", headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 204


def test_delete_issue_member_forbidden(client, alice_token, bob_token, project_with_bob):
    issue = make_issue(client, project_with_bob.id, alice_token)
    r = client.delete(f"/api/issues/{issue['id']}", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 403


def test_filter_by_status(client, alice_token, project):
    make_issue(client, project.id, alice_token, "Open Issue")
    issue2 = make_issue(client, project.id, alice_token, "To Close")
    client.patch(f"/api/issues/{issue2['id']}", json={"status": "closed"},
                 headers={"Authorization": f"Bearer {alice_token}"})
    r = client.get(f"/api/projects/{project.id}/issues?status=open",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert all(i["status"] == "open" for i in r.json()["items"])


def test_filter_by_priority(client, alice_token, project):
    make_issue(client, project.id, alice_token, "Low Issue", priority="low")
    make_issue(client, project.id, alice_token, "Critical Issue", priority="critical")
    r = client.get(f"/api/projects/{project.id}/issues?priority=critical",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert all(i["priority"] == "critical" for i in r.json()["items"])


def test_sort_by_priority(client, alice_token, project):
    make_issue(client, project.id, alice_token, "Low Issue", priority="low")
    make_issue(client, project.id, alice_token, "Critical Issue", priority="critical")
    make_issue(client, project.id, alice_token, "High Issue", priority="high")
    r = client.get(f"/api/projects/{project.id}/issues?sort=priority",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    priorities = [i["priority"] for i in r.json()["items"]]
    assert priorities == sorted(priorities, key=lambda p: ["critical", "high", "medium", "low"].index(p))


def test_text_search(client, alice_token, project):
    make_issue(client, project.id, alice_token, "Login button broken")
    make_issue(client, project.id, alice_token, "Dashboard crash")
    r = client.get(f"/api/projects/{project.id}/issues?q=login",
                   headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) == 1
    assert "login" in items[0]["title"].lower()