-- birth_year is now derived from date_of_birth; drop the NOT NULL constraint
-- so legacy or edge-case upserts never fail on this column.
ALTER TABLE profiles ALTER COLUMN birth_year DROP NOT NULL;
