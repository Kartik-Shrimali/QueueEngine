CREATE TABLE
    jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        priority TEXT NOT NULL DEFAULT 'normal',
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        run_after TIMESTAMPTZ NOT NULL DEFAULT now (),
        lease_token UUID,
        lease_expires_at TIMESTAMPTZ,
        worker_id TEXT,
        dead_reason TEXT,
        replayed_from UUID REFERENCES jobs (id) ON DELETE SET NULL,
        enqueued_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        first_started_at TIMESTAMPTZ,
        finished_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        CONSTRAINT jobs_priority_valid CHECK (priority IN ('critical', 'high', 'normal', 'low')),
        CONSTRAINT jobs_status_valid CHECK (
            status IN ('pending', 'active', 'completed', 'dead')
        ),
        CONSTRAINT jobs_dead_reason_valid CHECK (
            dead_reason IS NULL
            OR dead_reason IN ('exhausted', 'abandoned')
        ),
        CONSTRAINT jobs_attempts_bounded CHECK (attempts <= max_attempts),
        CONSTRAINT jobs_dead_reason_iff_dead CHECK(
            (status = 'dead') = (dead_reason IS NOT NULL)
        ),
        CONSTRAINT jobs_lease_iff_active CHECK(
            (status = 'active') = (lease_token IS NOT NULL)
        ),
        CONSTRAINT jobs_max_attempts_range CHECK(
            max_attempts BETWEEN 1 AND 50
        )
    );

    CREATE TABLE job_attempts(
        id BIGSERIAL PRIMARY KEY,
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        attempt_number INTEGER NOT NULL,
        worker_id TEXT NOT NULL,
        lease_token UUID NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ended_at TIMESTAMPTZ,
        duration_ms INTEGER,
        outcome TEXT,
        error_message TEXT,
        error_stack TEXT,

        CONSTRAINT attempts_outcome_valid CHECK(
            outcome IS NULL OR outcome IN('succeeded','failed','abandoned')
        ),
        CONSTRAINT attempts_ended_iff_outcome CHECK(
            (ended_at IS NULL) = (outcome IS NULL)
        ),
        CONSTRAINT attempts_unique_per_job UNIQUE(job_id , attempt_number) 
    );

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN 
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_touch_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE INDEX jobs_live
    ON jobs(status)
    WHERE status IN ('pending' , 'active');

CREATE INDEX jobs_pending_run_after
    ON jobs(run_after)
    WHERE status = 'pending';

CREATE INDEX jobs_active_lease_expiry
    ON jobs(lease_expires_at)
    WHERE status = 'active';

CREATE INDEX jobs_dead_recent
    ON jobs(finished_at DESC)
    WHERE status = 'dead';

CREATE INDEX jobs_keyset
    ON jobs(updated_at DESC, id DESC);

CREATE INDEX jobs_type_status ON jobs(type , status);

CREATE INDEX jobs_finished_at
    ON jobs(finished_at)
    WHERE status IN ('completed' , 'dead');

CREATE INDEX job_attempts_by_job ON job_attempts(job_id , attempt_number);

CREATE INDEX job_attempts_failures
    ON job_attempts(ended_at DESC)
    WHERE outcome IN ('failed' , 'abandoned');

CREATE INDEX jobs_replayed_from ON jobs(replayed_from)
    WHERE replayed_from IS NOT NULL;