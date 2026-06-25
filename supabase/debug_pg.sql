-- STEP 1: Check if the old global playground data still exists in app_state
SELECT * FROM app_state WHERE key = 'playground';

-- STEP 2: Check all rows in pg_sheets (who has data?)
SELECT owner_id, data FROM pg_sheets;

-- STEP 3: List all admin/manager members and their IDs
SELECT id, name, role FROM members WHERE role IN ('admin', 'manager') ORDER BY id;

-- STEP 4: If pg_sheets is empty but app_state had data,
-- manually assign existing data to the correct user.
-- Run the INSERT below ONLY if STEP 1 returned data and STEP 2 is empty.
/*
INSERT INTO pg_sheets (owner_id, data)
SELECT 'REPLACE_WITH_PARTH_MEMBER_ID', value
FROM app_state
WHERE key = 'playground'
ON CONFLICT (owner_id) DO NOTHING;

DELETE FROM app_state WHERE key = 'playground';
*/

-- STEP 5: If app_state is empty and pg_sheets has the wrong owner_id,
-- update the owner to Parth's member ID.
-- Run the UPDATE below ONLY if pg_sheets has data under the wrong owner_id.
/*
UPDATE pg_sheets SET owner_id = 'REPLACE_WITH_PARTH_MEMBER_ID'
WHERE owner_id != 'REPLACE_WITH_PARTH_MEMBER_ID';
*/
