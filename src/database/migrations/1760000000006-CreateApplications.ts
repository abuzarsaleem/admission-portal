import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ADM-F001 — single physical applications table (spec: admissions_applications).
 * Project naming drops the admissions_ prefix (same as intakes/offerings).
 */
export class CreateApplications1760000000006 implements MigrationInterface {
  name = 'CreateApplications1760000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SEQUENCE IF NOT EXISTS applications_application_id_seq
        AS BIGINT
        START WITH 1000001
        INCREMENT BY 1
        MINVALUE 1000001
        NO MAXVALUE
        CACHE 1
    `);

    await queryRunner.query(`
      CREATE TABLE applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        application_id BIGINT NOT NULL
          DEFAULT nextval('applications_application_id_seq'),
        application_reference VARCHAR(100) NOT NULL,
        intake_id UUID NOT NULL
          REFERENCES intakes (id) ON DELETE RESTRICT,
        applicant_name VARCHAR(150) NOT NULL,
        registered_email VARCHAR(255) NOT NULL,
        normalized_email VARCHAR(255) NOT NULL,
        cnic_number VARCHAR(30) NULL,
        passport_number VARCHAR(50) NULL,
        normalized_identity VARCHAR(80) NOT NULL,
        mobile_number VARCHAR(30) NOT NULL,
        gender VARCHAR(30) NULL,
        marital_status VARCHAR(30) NULL,
        date_of_birth DATE NULL,
        profile_photograph VARCHAR(500) NULL,
        primary_nationality_id VARCHAR(10) NULL,
        secondary_nationality_id VARCHAR(10) NULL,
        disability_declared BOOLEAN NULL,
        referral_source VARCHAR(50) NULL,
        application_status VARCHAR(30) NOT NULL DEFAULT 'REGISTERED',
        overall_completion INTEGER NOT NULL DEFAULT 0,
        registration_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        applied_date TIMESTAMPTZ NULL,
        account_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        iam_user_id UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_applications_status
          CHECK (application_status IN (
            'REGISTERED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETE'
          )),
        CONSTRAINT chk_applications_account_status
          CHECK (account_status IN ('ACTIVE', 'ARCHIVED')),
        CONSTRAINT chk_applications_identity_present
          CHECK (
            (cnic_number IS NOT NULL AND btrim(cnic_number) <> '')
            OR (passport_number IS NOT NULL AND btrim(passport_number) <> '')
          ),
        CONSTRAINT chk_applications_completion
          CHECK (overall_completion >= 0 AND overall_completion <= 100)
      )
    `);

    await queryRunner.query(`
      ALTER SEQUENCE applications_application_id_seq OWNED BY applications.application_id
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_applications_application_id
        ON applications (application_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_applications_application_reference
        ON applications (application_reference)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_applications_tenant_intake_email
        ON applications (tenant_id, intake_id, normalized_email)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_applications_tenant_intake_identity
        ON applications (tenant_id, intake_id, normalized_identity)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_applications_tenant_id ON applications (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_applications_intake_id ON applications (intake_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_applications_status ON applications (application_status)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_applications_iam_user_id ON applications (iam_user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS applications CASCADE`);
    await queryRunner.query(
      `DROP SEQUENCE IF EXISTS applications_application_id_seq`,
    );
  }
}
