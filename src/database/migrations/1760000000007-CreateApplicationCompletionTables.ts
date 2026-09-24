import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ADM-F002 — application completion child tables + profile/step columns on applications.
 * Project naming drops the admissions_ prefix (same as applications / intakes).
 */
export class CreateApplicationCompletionTables1760000000007
  implements MigrationInterface
{
  name = 'CreateApplicationCompletionTables1760000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS telephone VARCHAR(30) NULL,
        ADD COLUMN IF NOT EXISTS domicile_id VARCHAR(50) NULL,
        ADD COLUMN IF NOT EXISTS academic_step_saved BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS programme_step_saved BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS profile_step_saved BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS declaration_step_saved BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ NULL
    `);

    await queryRunner.query(`
      CREATE TABLE application_academic_information (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL
          REFERENCES applications (id) ON DELETE CASCADE,
        degree_type VARCHAR(80) NOT NULL,
        qualification_name VARCHAR(200) NOT NULL,
        board_or_institution VARCHAR(255) NOT NULL,
        passing_year VARCHAR(10) NOT NULL,
        division VARCHAR(50) NOT NULL,
        grade VARCHAR(50) NOT NULL,
        marks_or_gpa_obtained VARCHAR(50) NOT NULL,
        marks_or_gpa_total VARCHAR(50) NOT NULL,
        percentage NUMERIC(6, 2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_academic_info_percentage
          CHECK (percentage >= 0 AND percentage <= 100)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_academic_info_tenant
        ON application_academic_information (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_academic_info_applicant
        ON application_academic_information (applicant_id)
    `);

    await queryRunner.query(`
      CREATE TABLE application_academic_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL
          REFERENCES applications (id) ON DELETE CASCADE,
        academic_information_id UUID NOT NULL
          REFERENCES application_academic_information (id) ON DELETE CASCADE,
        document_type VARCHAR(50) NOT NULL,
        file_reference VARCHAR(500) NOT NULL,
        original_file_name VARCHAR(255) NULL,
        mime_type VARCHAR(100) NULL,
        file_size INTEGER NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        verification_status VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED',
        CONSTRAINT chk_academic_doc_type
          CHECK (document_type IN ('CERTIFICATE', 'MARKSHEET', 'TRANSCRIPT')),
        CONSTRAINT chk_academic_doc_verification
          CHECK (verification_status IN ('UNVERIFIED', 'VERIFIED', 'REJECTED')),
        CONSTRAINT chk_academic_doc_file_size
          CHECK (file_size IS NULL OR file_size >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_academic_docs_tenant
        ON application_academic_documents (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_academic_docs_applicant
        ON application_academic_documents (applicant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_academic_docs_academic_info
        ON application_academic_documents (academic_information_id)
    `);

    await queryRunner.query(`
      CREATE TABLE application_programme_selection (
        applicant_id UUID PRIMARY KEY
          REFERENCES applications (id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL,
        intake_session_id UUID NOT NULL
          REFERENCES intakes (id) ON DELETE RESTRICT,
        qualification_level VARCHAR(30) NOT NULL,
        applied_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        step_saved BOOLEAN NOT NULL DEFAULT FALSE,
        saved_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_programme_selection_level
          CHECK (qualification_level IN (
            'UNDERGRADUATE', 'POSTGRADUATE', 'PHD'
          ))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_programme_selection_tenant
        ON application_programme_selection (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_programme_selection_intake
        ON application_programme_selection (intake_session_id)
    `);

    await queryRunner.query(`
      CREATE TABLE application_programme_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL
          REFERENCES applications (id) ON DELETE CASCADE,
        programme_offering_id UUID NOT NULL
          REFERENCES programme_offerings (id) ON DELETE RESTRICT,
        preference_order SMALLINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_programme_option_preference
          CHECK (preference_order IN (1, 2)),
        CONSTRAINT uq_programme_option_preference
          UNIQUE (applicant_id, preference_order),
        CONSTRAINT uq_programme_option_offering
          UNIQUE (applicant_id, programme_offering_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_programme_options_tenant
        ON application_programme_options (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_programme_options_applicant
        ON application_programme_options (applicant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_programme_options_offering
        ON application_programme_options (programme_offering_id)
    `);

    await queryRunner.query(`
      CREATE TABLE application_addresses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL
          REFERENCES applications (id) ON DELETE CASCADE,
        address_type VARCHAR(30) NOT NULL,
        address_line_1 VARCHAR(255) NOT NULL,
        address_line_2 VARCHAR(255) NULL,
        country_id VARCHAR(50) NOT NULL,
        province_id VARCHAR(50) NOT NULL,
        city_id VARCHAR(50) NOT NULL,
        postal_code VARCHAR(20) NULL,
        is_same_as_primary BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_application_address_type
          CHECK (address_type IN ('PRIMARY', 'SECONDARY')),
        CONSTRAINT uq_application_address_type
          UNIQUE (applicant_id, address_type)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_application_addresses_tenant
        ON application_addresses (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_application_addresses_applicant
        ON application_addresses (applicant_id)
    `);

    await queryRunner.query(`
      CREATE TABLE application_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL
          REFERENCES applications (id) ON DELETE CASCADE,
        contact_type VARCHAR(30) NOT NULL,
        name VARCHAR(150) NOT NULL,
        identity_document_number VARCHAR(50) NULL,
        relationship VARCHAR(80) NOT NULL,
        occupation VARCHAR(100) NULL,
        mobile_number VARCHAR(30) NOT NULL,
        telephone VARCHAR(30) NULL,
        email VARCHAR(255) NULL,
        address_line VARCHAR(500) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_application_contact_type
          CHECK (contact_type IN ('PARENT', 'GUARDIAN', 'EMERGENCY'))
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_application_contacts_tenant
        ON application_contacts (tenant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_application_contacts_applicant
        ON application_contacts (applicant_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_application_contacts_type
        ON application_contacts (applicant_id, contact_type)
    `);

    await queryRunner.query(`
      CREATE TABLE application_declarations (
        applicant_id UUID PRIMARY KEY
          REFERENCES applications (id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL,
        declaration_accepted BOOLEAN NOT NULL DEFAULT FALSE,
        declaration_acceptance_date TIMESTAMPTZ NULL,
        declaration_version VARCHAR(50) NULL,
        disciplinary_issue_declared BOOLEAN NOT NULL DEFAULT FALSE,
        disciplinary_issue_details TEXT NULL,
        selected_test_centre_id VARCHAR(100) NULL,
        submission_date TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_declaration_disciplinary_details
          CHECK (
            disciplinary_issue_declared = FALSE
            OR (
              disciplinary_issue_details IS NOT NULL
              AND btrim(disciplinary_issue_details) <> ''
            )
          )
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_application_declarations_tenant
        ON application_declarations (tenant_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS application_declarations`);
    await queryRunner.query(`DROP TABLE IF EXISTS application_contacts`);
    await queryRunner.query(`DROP TABLE IF EXISTS application_addresses`);
    await queryRunner.query(`DROP TABLE IF EXISTS application_programme_options`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS application_programme_selection`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS application_academic_documents`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS application_academic_information`,
    );

    await queryRunner.query(`
      ALTER TABLE applications
        DROP COLUMN IF EXISTS telephone,
        DROP COLUMN IF EXISTS domicile_id,
        DROP COLUMN IF EXISTS academic_step_saved,
        DROP COLUMN IF EXISTS programme_step_saved,
        DROP COLUMN IF EXISTS profile_step_saved,
        DROP COLUMN IF EXISTS declaration_step_saved,
        DROP COLUMN IF EXISTS submission_date
    `);
  }
}
