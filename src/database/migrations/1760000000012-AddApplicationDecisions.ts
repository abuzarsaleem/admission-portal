import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationDecisions1760000000012 implements MigrationInterface {
  name = 'AddApplicationDecisions1760000000012';
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE applications ADD COLUMN rejection_reason TEXT NULL, ADD COLUMN rejection_reason_code VARCHAR(60) NULL, ADD COLUMN status_updated_by UUID NULL, ADD COLUMN status_updated_at TIMESTAMPTZ NULL`);
    await q.query(`ALTER TABLE applications DROP CONSTRAINT IF EXISTS chk_applications_status`);
    await q.query(`ALTER TABLE applications ADD CONSTRAINT chk_applications_status CHECK (application_status IN ('REGISTERED','IN_PROGRESS','SUBMITTED','COMPLETE','APPROVED','REJECTED'))`);
    await q.query(`CREATE TABLE application_status_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
      applicant_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      from_status VARCHAR(30) NOT NULL, to_status VARCHAR(30) NOT NULL,
      reason_code VARCHAR(60) NULL, reason TEXT NULL, acted_by UUID NULL,
      source VARCHAR(20) NOT NULL DEFAULT 'MANUAL', acted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_application_status_audit_source CHECK (source IN ('MANUAL','SYSTEM'))
    )`);
    await q.query(`CREATE INDEX idx_application_status_audits_history ON application_status_audits(tenant_id, applicant_id, acted_at DESC)`);
  }
  async down(q: QueryRunner): Promise<void> {
    const decisions = await q.query(`SELECT 1 FROM applications WHERE application_status IN ('APPROVED','REJECTED') LIMIT 1`);
    if (decisions.length) throw new Error('Cannot roll back application decisions while approved/rejected applications exist; migrate or archive those decisions first.');
    await q.query(`DROP TABLE IF EXISTS application_status_audits`);
    await q.query(`ALTER TABLE applications DROP CONSTRAINT IF EXISTS chk_applications_status`);
    await q.query(`ALTER TABLE applications ADD CONSTRAINT chk_applications_status CHECK (application_status IN ('REGISTERED','IN_PROGRESS','SUBMITTED','COMPLETE'))`);
    await q.query(`ALTER TABLE applications DROP COLUMN IF EXISTS rejection_reason, DROP COLUMN IF EXISTS rejection_reason_code, DROP COLUMN IF EXISTS status_updated_by, DROP COLUMN IF EXISTS status_updated_at`);
  }
}
