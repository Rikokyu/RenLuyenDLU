# API documentation

Base URL: `/api/v1`

## Evidence

The evidence API follows `Evidence.ID` and its foreign key `Evidence.IdAcRegis` to `Activity_Registration`. Registration then provides the student and activity. Student identity and contact fields are read from the related `"User"` row.

### `POST /student-evidences`

Submits one valid JPG or PNG image (maximum 5 MB and 20 megapixels) for an activity registration. The authenticated endpoint accepts `multipart/form-data` fields `registration_id`, `request_key`, and `file`. Image bytes are stored in MinIO; the filename and object key are stored with the `Evidence` record. Existing evidence encoded in the database remains readable.

MinIO is configured with `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, and `MINIO_USE_SSL`. For local development, Compose exposes MinIO on host port 9002 and its console on host port 9003 (container ports 9000 and 9001). The backend running inside Compose connects to `minio:9000`.

### `GET /evidences`

Returns evidence rows with the nested `registration.student.user`, `registration.student.class.major.faculty`, and `registration.activity` objects.

Optional query parameters:

| Parameter    | Meaning                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `search`     | Match activity title, student code, or user's first/last name                                  |
| `status`     | Evidence status: `0` pending, `1` approved, `2` rejected                                       |
| `class_id`   | Filter by the student's class ID                                                               |
| `major_id`   | Filter by the student's major                                                                  |
| `faculty_id` | Filter by the student's faculty ID (class filter takes precedence when `class_id` is provided) |
| `from_date`  | Include registrations from this date (`YYYY-MM-DD`)                                            |
| `to_date`    | Include registrations through this date (`YYYY-MM-DD`)                                         |

Successful responses use `{ "status": "success", "message": "...", "data": [...] }`.

### `GET /evidences/filters`

Returns active faculties, majors, and classes from the database. The client narrows majors by faculty and classes by selected faculty and/or major.

### `GET /evidences/stats`

Returns `{ "total": 0, "pending": 0, "approved": 0, "rejected": 0 }` under `data`.

### `GET /evidences/detail?evidence_id={id}`

Returns one evidence row by its database primary key, including its registration, student, and activity.

### `PUT /evidences/status`

Request body:

```json
{
  "evidence_id": 1,
  "status": 1
}
```

`evidence_id` is the primary key from `Evidence.ID`; `status` must be `0`, `1`, or `2`.

### `PUT /evidences/approve`

Approves the displayed evidence rows in one request. The frontend sends the IDs of the rows currently loaded in the table:

```json
{
  "evidence_ids": [1, 2, 3]
}
```

The update is atomic: if an ID does not exist, none of the requested rows are changed.
