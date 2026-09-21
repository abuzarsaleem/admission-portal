import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Converts all primary keys and tenant/user/FK identity columns from BIGINT to UUID.
 * Recreates ADM-F000 tables (development/test data is reset) and reseeds catalogues.
 */
export class ConvertIdsToUuid1760000000004 implements MigrationInterface {
  name = 'ConvertIdsToUuid1760000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    // Drop existing business tables (keep migrations)
    await queryRunner.query(`DROP TABLE IF EXISTS supporting_information CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admission_criteria CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS offering_fees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS general_fees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS programme_offerings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS intakes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS general_criteria CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS programmes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS criteria_types CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS fee_types CASCADE`);
    // Also drop legacy prefixed names if somehow still present
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_supporting_information CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_admission_criteria CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_offering_fees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_general_fees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_programme_offerings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_intakes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_general_criteria CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_programmes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_departments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_criteria_types CASCADE`);

    await queryRunner.query(`
      CREATE TABLE fee_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL
      );
      CREATE UNIQUE INDEX uq_fee_types_name ON fee_types (name);
      CREATE INDEX idx_fee_types_name ON fee_types (name);
    `);

    await queryRunner.query(`
      CREATE TABLE criteria_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        description VARCHAR(500) NULL,
        value_data_type VARCHAR(30) NOT NULL DEFAULT 'TEXT',
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        sort_order INTEGER NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_criteria_types_value_data_type
          CHECK (value_data_type IN ('TEXT', 'NUMBER', 'BOOLEAN', 'DATE', 'PERCENTAGE')),
        CONSTRAINT chk_criteria_types_status
          CHECK (status IN ('ACTIVE', 'INACTIVE'))
      );
      CREATE UNIQUE INDEX uq_criteria_types_code ON criteria_types (code);
      CREATE INDEX idx_criteria_types_name ON criteria_types (name);
      CREATE INDEX idx_criteria_types_status ON criteria_types (status);
      CREATE INDEX idx_criteria_types_sort_order ON criteria_types (sort_order);
    `);

    await queryRunner.query(`
      CREATE TABLE departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_departments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
      );
      CREATE UNIQUE INDEX uq_departments_tenant_code ON departments (tenant_id, code);
      CREATE INDEX idx_departments_tenant_id ON departments (tenant_id);
      CREATE INDEX idx_departments_code ON departments (code);
      CREATE INDEX idx_departments_name ON departments (name);
      CREATE INDEX idx_departments_status ON departments (status);
      CREATE INDEX idx_departments_created_by ON departments (created_by);
      CREATE INDEX idx_departments_updated_by ON departments (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE programmes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        department_id UUID NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        programme_grouping VARCHAR(150) NULL,
        curriculum_reference VARCHAR(255) NULL,
        degree_level VARCHAR(30) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        sort_order INTEGER NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_programmes_degree_level
          CHECK (degree_level IN ('Bachelor', 'Master', 'Doctorate')),
        CONSTRAINT chk_programmes_status
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED'))
      );
      CREATE UNIQUE INDEX uq_programmes_tenant_code ON programmes (tenant_id, code);
      CREATE INDEX idx_programmes_tenant_id ON programmes (tenant_id);
      CREATE INDEX idx_programmes_department_id ON programmes (department_id);
      CREATE INDEX idx_programmes_code ON programmes (code);
      CREATE INDEX idx_programmes_name ON programmes (name);
      CREATE INDEX idx_programmes_status ON programmes (status);
      CREATE INDEX idx_programmes_created_by ON programmes (created_by);
      CREATE INDEX idx_programmes_updated_by ON programmes (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE general_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        criteria_type_id UUID NOT NULL REFERENCES criteria_types (id) ON DELETE RESTRICT,
        criteria_name VARCHAR(150) NULL,
        criteria_requirement TEXT NOT NULL,
        criteria_operator VARCHAR(30) NULL,
        criteria_unit VARCHAR(30) NULL,
        mandatory BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT chk_general_criteria_operator
          CHECK (
            criteria_operator IS NULL OR criteria_operator IN (
              'EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL',
              'LESS_THAN', 'REQUIRED', 'BETWEEN'
            )
          )
      );
      CREATE INDEX idx_general_criteria_tenant_id ON general_criteria (tenant_id);
      CREATE INDEX idx_general_criteria_type_id ON general_criteria (criteria_type_id);
    `);

    await queryRunner.query(`
      CREATE TABLE intakes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        intake_name VARCHAR(255) NOT NULL,
        intake_code VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        application_open_at TIMESTAMPTZ NOT NULL,
        application_close_at TIMESTAMPTZ NOT NULL,
        published_at TIMESTAMPTZ NULL,
        published_by UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_intakes_status
          CHECK (status IN ('DRAFT', 'CONFIGURED', 'UNDER_REVIEW', 'PUBLISHED', 'CLOSED')),
        CONSTRAINT chk_intakes_window
          CHECK (application_close_at > application_open_at)
      );
      CREATE UNIQUE INDEX uq_intakes_tenant_code ON intakes (tenant_id, intake_code);
      CREATE INDEX idx_intakes_tenant_id ON intakes (tenant_id);
      CREATE INDEX idx_intakes_status ON intakes (status);
      CREATE INDEX idx_intakes_created_by ON intakes (created_by);
      CREATE INDEX idx_intakes_updated_by ON intakes (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE programme_offerings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        intake_id UUID NOT NULL REFERENCES intakes (id) ON DELETE RESTRICT,
        programme_id UUID NOT NULL REFERENCES programmes (id) ON DELETE RESTRICT,
        offering_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        display_order INTEGER NULL,
        published_description TEXT NOT NULL,
        published_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_programme_offerings_status
          CHECK (offering_status IN ('DRAFT', 'CONFIGURED', 'UNDER_REVIEW', 'PUBLISHED', 'CLOSED'))
      );
      CREATE INDEX idx_programme_offerings_tenant_id ON programme_offerings (tenant_id);
      CREATE INDEX idx_programme_offerings_intake_id ON programme_offerings (intake_id);
      CREATE INDEX idx_programme_offerings_programme_id ON programme_offerings (programme_id);
      CREATE UNIQUE INDEX uq_programme_offerings_intake_programme
        ON programme_offerings (tenant_id, intake_id, programme_id);
    `);

    await queryRunner.query(`
      CREATE TABLE general_fees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        fee_type VARCHAR(50) NOT NULL
          REFERENCES fee_types (name) ON UPDATE CASCADE ON DELETE RESTRICT,
        amount DECIMAL(18, 2) NOT NULL,
        currency CHAR(3) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_general_fees_amount CHECK (amount >= 0),
        CONSTRAINT chk_general_fees_status
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED'))
      );
      CREATE INDEX idx_general_fees_tenant_id ON general_fees (tenant_id);
      CREATE INDEX idx_general_fees_fee_type ON general_fees (fee_type);
    `);

    await queryRunner.query(`
      CREATE TABLE offering_fees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        programme_offering_id UUID NOT NULL
          REFERENCES programme_offerings (id) ON DELETE RESTRICT,
        general_fee_id UUID NOT NULL
          REFERENCES general_fees (id) ON DELETE RESTRICT,
        effective_from TIMESTAMPTZ NULL,
        effective_to TIMESTAMPTZ NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        sort_order INTEGER NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_offering_fees_status
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED')),
        CONSTRAINT chk_offering_fees_window
          CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
      );
      CREATE INDEX idx_offering_fees_tenant_id ON offering_fees (tenant_id);
      CREATE INDEX idx_offering_fees_offering_id ON offering_fees (programme_offering_id);
      CREATE INDEX idx_offering_fees_general_fee_id ON offering_fees (general_fee_id);
    `);

    await queryRunner.query(`
      CREATE TABLE admission_criteria (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        programme_offering_id UUID NOT NULL
          REFERENCES programme_offerings (id) ON DELETE RESTRICT,
        general_criteria_id UUID NOT NULL
          REFERENCES general_criteria (id) ON DELETE RESTRICT,
        sequence_no INTEGER NULL,
        effective_from TIMESTAMPTZ NULL,
        effective_to TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_admission_criteria_window
          CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
      );
      CREATE INDEX idx_admission_criteria_tenant_id ON admission_criteria (tenant_id);
      CREATE INDEX idx_admission_criteria_offering_id ON admission_criteria (programme_offering_id);
      CREATE INDEX idx_admission_criteria_general_id ON admission_criteria (general_criteria_id);
    `);

    await queryRunner.query(`
      CREATE TABLE supporting_information (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        programme_offering_id UUID NOT NULL
          REFERENCES programme_offerings (id) ON DELETE RESTRICT,
        information_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        reference_url VARCHAR(1000) NULL,
        mandatory BOOLEAN NOT NULL DEFAULT FALSE,
        display_order INTEGER NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_supporting_information_type
          CHECK (information_type IN ('FAQ', 'NOTE', 'INSTRUCTION', 'CONTACT', 'OTHER')),
        CONSTRAINT chk_supporting_information_status
          CHECK (status IN ('ACTIVE', 'INACTIVE'))
      );
      CREATE INDEX idx_supporting_information_tenant_id ON supporting_information (tenant_id);
      CREATE INDEX idx_supporting_information_offering_id ON supporting_information (programme_offering_id);
    `);

    // Seed catalogues with stable UUIDs
    await queryRunner.query(`
      INSERT INTO fee_types (id, name) VALUES
        ('11111111-1111-4111-8111-111111111001', 'APPLICATION'),
        ('11111111-1111-4111-8111-111111111002', 'PROCESSING'),
        ('11111111-1111-4111-8111-111111111003', 'OTHER')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);

    await queryRunner.query(`
      INSERT INTO criteria_types
        (id, code, name, description, value_data_type, status, sort_order, created_at, updated_at)
      VALUES
        ('22222222-2222-4222-8222-222222222001', 'QUALIFICATION', 'Qualification', 'Required prior qualification', 'TEXT', 'ACTIVE', 1, NOW(), NOW()),
        ('22222222-2222-4222-8222-222222222002', 'MIN_PERCENTAGE', 'Minimum Percentage', 'Minimum obtained percentage', 'PERCENTAGE', 'ACTIVE', 2, NOW(), NOW()),
        ('22222222-2222-4222-8222-222222222003', 'SUBJECT_REQUIRED', 'Required Subject', 'Subject required in prior qualification', 'TEXT', 'ACTIVE', 3, NOW(), NOW()),
        ('22222222-2222-4222-8222-222222222004', 'ENTRY_TEST', 'Entry Test', 'Requirement for an entry test', 'BOOLEAN', 'ACTIVE', 4, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        value_data_type = EXCLUDED.value_data_type,
        status = EXCLUDED.status,
        sort_order = EXCLUDED.sort_order,
        updated_at = EXCLUDED.updated_at;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Irreversible for practical purposes in this baseline — drop UUID schema only.
    await queryRunner.query(`DROP TABLE IF EXISTS supporting_information CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS admission_criteria CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS offering_fees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS general_fees CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS programme_offerings CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS intakes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS general_criteria CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS programmes CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS criteria_types CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS fee_types CASCADE`);
  }
}
