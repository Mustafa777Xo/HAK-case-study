from fastapi.testclient import TestClient


def create_request(client: TestClient, *, title: str = "Vendor Contract") -> int:
    response = client.post(
        "/requests/",
        json={
            "title": title,
            "request_type": "Internal Approval",
            "requested_by": "Requester",
            "department": "Finance",
            "priority": "Medium",
            "created_by_id": 1,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def upload_pdf(client: TestClient, request_id: int, pdf_file) -> None:
    response = client.post(f"/requests/{request_id}/upload-pdf", files=pdf_file)
    assert response.status_code == 200, response.text


def add_approver(client: TestClient, request_id: int, approver_id: int, role: str = "Approver") -> dict:
    response = client.post(
        f"/requests/{request_id}/approvers",
        json={"approver_id": approver_id, "role": role, "sequence": 999},
    )
    assert response.status_code == 201, response.text
    return response.json()


def submit_request(client: TestClient, request_id: int) -> dict:
    response = client.post(f"/requests/{request_id}/submit")
    assert response.status_code == 200, response.text
    return response.json()


def steps_by_sequence(request: dict) -> list[dict]:
    return sorted(request["approval_steps"], key=lambda step: step["sequence"])


def test_submit_requires_pdf_and_at_least_one_approver(client: TestClient, pdf_file) -> None:
    request_id = create_request(client)

    response = client.post(f"/requests/{request_id}/submit")
    assert response.status_code == 400
    assert response.json()["detail"] == "A PDF attachment is required before submitting."

    upload_pdf(client, request_id, pdf_file)
    response = client.post(f"/requests/{request_id}/submit")
    assert response.status_code == 400
    assert response.json()["detail"] == "At least one approver must be added before submitting."


def test_pdf_upload_accepts_only_pdf_files(client: TestClient) -> None:
    request_id = create_request(client)

    response = client.post(
        f"/requests/{request_id}/upload-pdf",
        files={"file": ("notes.txt", b"not a pdf", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Only PDF files are accepted."


def test_approver_sequence_is_server_assigned_and_duplicates_are_rejected(
    client: TestClient,
    pdf_file,
) -> None:
    request_id = create_request(client)
    upload_pdf(client, request_id, pdf_file)

    first = add_approver(client, request_id, 2, "Reviewer")
    second = add_approver(client, request_id, 3, "Approver")
    duplicate = client.post(
        f"/requests/{request_id}/approvers",
        json={"approver_id": 2, "role": "Reviewer", "sequence": 1},
    )

    assert first["sequence"] == 1
    assert second["sequence"] == 2
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "This user is already an approver on the request."


def test_two_step_approval_stays_pending_until_final_approver_acts(
    client: TestClient,
    pdf_file,
) -> None:
    request_id = create_request(client)
    upload_pdf(client, request_id, pdf_file)
    add_approver(client, request_id, 2, "Reviewer")
    add_approver(client, request_id, 3, "Approver")

    submitted = submit_request(client, request_id)
    submitted_steps = steps_by_sequence(submitted)
    assert submitted["status"] == "Pending Approval"
    assert [(step["approver_id"], step["status"]) for step in submitted_steps] == [
        (2, "Pending"),
        (3, "Waiting"),
    ]

    wrong_user = client.post(
        f"/approvals/{submitted_steps[0]['id']}/approve",
        headers={"X-User-Id": "3"},
        json={"comments": "Trying to skip ahead"},
    )
    assert wrong_user.status_code == 403

    response = client.post(
        f"/approvals/{submitted_steps[0]['id']}/approve",
        headers={"X-User-Id": "2"},
        json={"comments": "Reviewed"},
    )
    assert response.status_code == 200, response.text

    after_first_approval = client.get(f"/requests/{request_id}").json()
    active_steps = steps_by_sequence(after_first_approval)
    assert after_first_approval["status"] == "Pending Approval"
    assert [(step["approver_id"], step["status"]) for step in active_steps] == [
        (2, "Approved"),
        (3, "Pending"),
    ]

    pending_for_second_approver = client.get("/approvals/pending", params={"approver_id": 3})
    assert pending_for_second_approver.status_code == 200
    assert [item["request"]["id"] for item in pending_for_second_approver.json()] == [request_id]

    response = client.post(
        f"/approvals/{active_steps[1]['id']}/approve",
        headers={"X-User-Id": "3"},
        json={"comments": "Approved"},
    )
    assert response.status_code == 200, response.text

    final_request = client.get(f"/requests/{request_id}").json()
    assert final_request["status"] == "Approved"
    assert [step["status"] for step in steps_by_sequence(final_request)] == ["Approved", "Approved"]


def test_rejection_is_terminal_and_skips_remaining_steps(client: TestClient, pdf_file) -> None:
    request_id = create_request(client)
    upload_pdf(client, request_id, pdf_file)
    add_approver(client, request_id, 2, "Reviewer")
    add_approver(client, request_id, 3, "Approver")
    add_approver(client, request_id, 4, "Signatory")
    submitted = submit_request(client, request_id)
    first_step = steps_by_sequence(submitted)[0]

    response = client.post(
        f"/approvals/{first_step['id']}/reject",
        headers={"X-User-Id": "2"},
        json={"comments": "Missing required clause"},
    )
    assert response.status_code == 200, response.text

    rejected_request = client.get(f"/requests/{request_id}").json()
    assert rejected_request["status"] == "Rejected"
    assert [step["status"] for step in steps_by_sequence(rejected_request)] == [
        "Rejected",
        "Skipped",
        "Skipped",
    ]

    pending_for_next_approver = client.get("/approvals/pending", params={"approver_id": 3})
    assert pending_for_next_approver.status_code == 200
    assert pending_for_next_approver.json() == []


def test_request_list_reports_current_pending_approver(client: TestClient, pdf_file) -> None:
    request_id = create_request(client)
    upload_pdf(client, request_id, pdf_file)
    add_approver(client, request_id, 2, "Reviewer")
    add_approver(client, request_id, 3, "Approver")
    submitted = submit_request(client, request_id)
    first_step = steps_by_sequence(submitted)[0]

    response = client.get("/requests/")
    assert response.status_code == 200
    row = next(item for item in response.json() if item["id"] == request_id)
    assert row["current_pending_approver"] == "Reviewer"

    client.post(
        f"/approvals/{first_step['id']}/approve",
        headers={"X-User-Id": "2"},
        json={"comments": "Reviewed"},
    )

    response = client.get("/requests/")
    assert response.status_code == 200
    row = next(item for item in response.json() if item["id"] == request_id)
    assert row["current_pending_approver"] == "Approver"
