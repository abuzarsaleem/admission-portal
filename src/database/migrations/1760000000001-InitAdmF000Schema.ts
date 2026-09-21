import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ADM-F000 physical schema from Extracted Tables workbook v2.
 * Creates all 11 tables with FKs, uniques, indexes, and check constraints.
 */
export class InitAdmF000Schema1760000000001 implements MigrationInterface {
  name = 'InitAdmF000Schema1760000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fee_types (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL
      );
      CREATE UNIQUE INDEX uq_fee_types_name ON fee_types (name);
      CREATE INDEX idx_fee_types_name ON fee_types (name);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_criteria_types (
        id BIGSERIAL PRIMARY KEY,
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
      CREATE UNIQUE INDEX uq_admissions_criteria_types_code ON admissions_criteria_types (code);
      CREATE INDEX idx_admissions_criteria_types_name ON admissions_criteria_types (name);
      CREATE INDEX idx_admissions_criteria_types_status ON admissions_criteria_types (status);
      CREATE INDEX idx_admissions_criteria_types_sort_order ON admissions_criteria_types (sort_order);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_departments (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_departments_status
          CHECK (status IN ('ACTIVE', 'INACTIVE'))
      );
      CREATE UNIQUE INDEX uq_admissions_departments_tenant_code
        ON admissions_departments (tenant_id, code);
      CREATE INDEX idx_admissions_departments_tenant_id ON admissions_departments (tenant_id);
      CREATE INDEX idx_admissions_departments_code ON admissions_departments (code);
      CREATE INDEX idx_admissions_departments_name ON admissions_departments (name);
      CREATE INDEX idx_admissions_departments_status ON admissions_departments (status);
      CREATE INDEX idx_admissions_departments_created_by ON admissions_departments (created_by);
      CREATE INDEX idx_admissions_departments_updated_by ON admissions_departments (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_programmes (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        department_id BIGINT NOT NULL
          REFERENCES admissions_departments (id) ON DELETE RESTRICT,
        code VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        programme_grouping VARCHAR(150) NULL,
        curriculum_reference VARCHAR(255) NULL,
        degree_level VARCHAR(30) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        sort_order INTEGER NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_programmes_degree_level
          CHECK (degree_level IN ('Bachelor', 'Master', 'Doctorate')),
        CONSTRAINT chk_admissions_programmes_status
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED'))
      );
      CREATE UNIQUE INDEX uq_admissions_programmes_tenant_code
        ON admissions_programmes (tenant_id, code);
      CREATE INDEX idx_admissions_programmes_tenant_id ON admissions_programmes (tenant_id);
      CREATE INDEX idx_admissions_programmes_department_id ON admissions_programmes (department_id);
      CREATE INDEX idx_admissions_programmes_code ON admissions_programmes (code);
      CREATE INDEX idx_admissions_programmes_name ON admissions_programmes (name);
      CREATE INDEX idx_admissions_programmes_grouping ON admissions_programmes (programme_grouping);
      CREATE INDEX idx_admissions_programmes_curriculum ON admissions_programmes (curriculum_reference);
      CREATE INDEX idx_admissions_programmes_degree_level ON admissions_programmes (degree_level);
      CREATE INDEX idx_admissions_programmes_status ON admissions_programmes (status);
      CREATE INDEX idx_admissions_programmes_sort_order ON admissions_programmes (sort_order);
      CREATE INDEX idx_admissions_programmes_created_by ON admissions_programmes (created_by);
      CREATE INDEX idx_admissions_programmes_updated_by ON admissions_programmes (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_general_criteria (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        criteria_type_id BIGINT NOT NULL
          REFERENCES admissions_criteria_types (id) ON DELETE RESTRICT,
        criteria_name VARCHAR(150) NULL,
        criteria_requirement TEXT NOT NULL,
        criteria_operator VARCHAR(30) NULL,
        criteria_unit VARCHAR(30) NULL,
        mandatory BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT chk_admissions_general_criteria_operator
          CHECK (
            criteria_operator IS NULL OR criteria_operator IN (
              'EQUALS',
              'GREATER_THAN',
              'GREATER_THAN_OR_EQUAL',
              'LESS_THAN',
              'REQUIRED',
              'BETWEEN'
            )
          )
      );
      CREATE INDEX idx_admissions_general_criteria_tenant_id
        ON admissions_general_criteria (tenant_id);
      CREATE INDEX idx_admissions_general_criteria_type_id
        ON admissions_general_criteria (criteria_type_id);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_intakes (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        intake_name VARCHAR(255) NOT NULL,
        intake_code VARCHAR(100) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        application_open_at TIMESTAMPTZ NOT NULL,
        application_close_at TIMESTAMPTZ NOT NULL,
        published_at TIMESTAMPTZ NULL,
        published_by BIGINT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_intakes_status
          CHECK (status IN ('DRAFT', 'CONFIGURED', 'UNDER_REVIEW', 'PUBLISHED', 'CLOSED')),
        CONSTRAINT chk_admissions_intakes_window
          CHECK (application_close_at > application_open_at)
      );
      CREATE UNIQUE INDEX uq_admissions_intakes_tenant_code
        ON admissions_intakes (tenant_id, intake_code);
      CREATE INDEX idx_admissions_intakes_tenant_id ON admissions_intakes (tenant_id);
      CREATE INDEX idx_admissions_intakes_name ON admissions_intakes (intake_name);
      CREATE INDEX idx_admissions_intakes_status ON admissions_intakes (status);
      CREATE INDEX idx_admissions_intakes_open_at ON admissions_intakes (application_open_at);
      CREATE INDEX idx_admissions_intakes_close_at ON admissions_intakes (application_close_at);
      CREATE INDEX idx_admissions_intakes_published_at ON admissions_intakes (published_at);
      CREATE INDEX idx_admissions_intakes_published_by ON admissions_intakes (published_by);
      CREATE INDEX idx_admissions_intakes_created_at ON admissions_intakes (created_at);
      CREATE INDEX idx_admissions_intakes_created_by ON admissions_intakes (created_by);
      CREATE INDEX idx_admissions_intakes_updated_at ON admissions_intakes (updated_at);
      CREATE INDEX idx_admissions_intakes_updated_by ON admissions_intakes (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_programme_offerings (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        intake_id BIGINT NOT NULL
          REFERENCES admissions_intakes (id) ON DELETE RESTRICT,
        programme_id BIGINT NOT NULL
          REFERENCES admissions_programmes (id) ON DELETE RESTRICT,
        offering_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        display_order INTEGER NULL,
        published_description TEXT NOT NULL,
        published_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_programme_offerings_status
          CHECK (offering_status IN ('DRAFT', 'CONFIGURED', 'UNDER_REVIEW', 'PUBLISHED', 'CLOSED'))
      );
      CREATE INDEX idx_admissions_programme_offerings_tenant_id
        ON admissions_programme_offerings (tenant_id);
      CREATE INDEX idx_admissions_programme_offerings_intake_id
        ON admissions_programme_offerings (intake_id);
      CREATE INDEX idx_admissions_programme_offerings_programme_id
        ON admissions_programme_offerings (programme_id);
      CREATE INDEX idx_admissions_programme_offerings_status
        ON admissions_programme_offerings (offering_status);
      CREATE INDEX idx_admissions_programme_offerings_display_order
        ON admissions_programme_offerings (display_order);
      CREATE INDEX idx_admissions_programme_offerings_published_at
        ON admissions_programme_offerings (published_at);
      CREATE INDEX idx_admissions_programme_offerings_created_by
        ON admissions_programme_offerings (created_by);
      CREATE INDEX idx_admissions_programme_offerings_updated_by
        ON admissions_programme_offerings (updated_by);
      CREATE UNIQUE INDEX uq_admissions_programme_offerings_intake_programme
        ON admissions_programme_offerings (tenant_id, intake_id, programme_id);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_general_fees (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        fee_type VARCHAR(50) NOT NULL
          REFERENCES fee_types (name) ON UPDATE CASCADE ON DELETE RESTRICT,
        amount DECIMAL(18, 2) NOT NULL,
        currency CHAR(3) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_general_fees_amount CHECK (amount >= 0),
        CONSTRAINT chk_admissions_general_fees_status
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED'))
      );
      CREATE INDEX idx_admissions_general_fees_tenant_id ON admissions_general_fees (tenant_id);
      CREATE INDEX idx_admissions_general_fees_fee_type ON admissions_general_fees (fee_type);
      CREATE INDEX idx_admissions_general_fees_currency ON admissions_general_fees (currency);
      CREATE INDEX idx_admissions_general_fees_status ON admissions_general_fees (status);
      CREATE INDEX idx_admissions_general_fees_created_by ON admissions_general_fees (created_by);
      CREATE INDEX idx_admissions_general_fees_updated_by ON admissions_general_fees (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_offering_fees (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        programme_offering_id BIGINT NOT NULL
          REFERENCES admissions_programme_offerings (id) ON DELETE RESTRICT,
        general_fee_id BIGINT NOT NULL
          REFERENCES admissions_general_fees (id) ON DELETE RESTRICT,
        effective_from TIMESTAMPTZ NULL,
        effective_to TIMESTAMPTZ NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        sort_order INTEGER NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_offering_fees_status
          CHECK (status IN ('ACTIVE', 'INACTIVE', 'RETIRED')),
        CONSTRAINT chk_admissions_offering_fees_window
          CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
      );
      CREATE INDEX idx_admissions_offering_fees_tenant_id ON admissions_offering_fees (tenant_id);
      CREATE INDEX idx_admissions_offering_fees_offering_id
        ON admissions_offering_fees (programme_offering_id);
      CREATE INDEX idx_admissions_offering_fees_general_fee_id
        ON admissions_offering_fees (general_fee_id);
      CREATE INDEX idx_admissions_offering_fees_effective_from
        ON admissions_offering_fees (effective_from);
      CREATE INDEX idx_admissions_offering_fees_effective_to
        ON admissions_offering_fees (effective_to);
      CREATE INDEX idx_admissions_offering_fees_status ON admissions_offering_fees (status);
      CREATE INDEX idx_admissions_offering_fees_sort_order ON admissions_offering_fees (sort_order);
      CREATE INDEX idx_admissions_offering_fees_created_by ON admissions_offering_fees (created_by);
      CREATE INDEX idx_admissions_offering_fees_updated_by ON admissions_offering_fees (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_admission_criteria (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        programme_offering_id BIGINT NOT NULL
          REFERENCES admissions_programme_offerings (id) ON DELETE RESTRICT,
        general_criteria_id BIGINT NOT NULL
          REFERENCES admissions_general_criteria (id) ON DELETE RESTRICT,
        sequence_no INTEGER NULL,
        effective_from TIMESTAMPTZ NULL,
        effective_to TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_admission_criteria_window
          CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
      );
      CREATE INDEX idx_admissions_admission_criteria_tenant_id
        ON admissions_admission_criteria (tenant_id);
      CREATE INDEX idx_admissions_admission_criteria_offering_id
        ON admissions_admission_criteria (programme_offering_id);
      CREATE INDEX idx_admissions_admission_criteria_general_id
        ON admissions_admission_criteria (general_criteria_id);
      CREATE INDEX idx_admissions_admission_criteria_sequence_no
        ON admissions_admission_criteria (sequence_no);
      CREATE INDEX idx_admissions_admission_criteria_effective_from
        ON admissions_admission_criteria (effective_from);
      CREATE INDEX idx_admissions_admission_criteria_effective_to
        ON admissions_admission_criteria (effective_to);
      CREATE INDEX idx_admissions_admission_criteria_created_by
        ON admissions_admission_criteria (created_by);
      CREATE INDEX idx_admissions_admission_criteria_updated_by
        ON admissions_admission_criteria (updated_by);
    `);

    await queryRunner.query(`
      CREATE TABLE admissions_supporting_information (
        id BIGSERIAL PRIMARY KEY,
        tenant_id BIGINT NOT NULL,
        programme_offering_id BIGINT NOT NULL
          REFERENCES admissions_programme_offerings (id) ON DELETE RESTRICT,
        information_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        reference_url VARCHAR(1000) NULL,
        mandatory BOOLEAN NOT NULL DEFAULT FALSE,
        display_order INTEGER NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by BIGINT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by BIGINT NOT NULL,
        CONSTRAINT chk_admissions_supporting_information_type
          CHECK (information_type IN ('FAQ', 'NOTE', 'INSTRUCTION', 'CONTACT', 'OTHER')),
        CONSTRAINT chk_admissions_supporting_information_status
          CHECK (status IN ('ACTIVE', 'INACTIVE'))
      );
      CREATE INDEX idx_admissions_supporting_information_tenant_id
        ON admissions_supporting_information (tenant_id);
      CREATE INDEX idx_admissions_supporting_information_offering_id
        ON admissions_supporting_information (programme_offering_id);
      CREATE INDEX idx_admissions_supporting_information_type
        ON admissions_supporting_information (information_type);
      CREATE INDEX idx_admissions_supporting_information_display_order
        ON admissions_supporting_information (display_order);
      CREATE INDEX idx_admissions_supporting_information_status
        ON admissions_supporting_information (status);
      CREATE INDEX idx_admissions_supporting_information_created_by
        ON admissions_supporting_information (created_by);
      CREATE INDEX idx_admissions_supporting_information_updated_by
        ON admissions_supporting_information (updated_by);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_supporting_information`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_admission_criteria`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_offering_fees`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_general_fees`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_programme_offerings`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_intakes`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_general_criteria`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_programmes`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_departments`);
    await queryRunner.query(`DROP TABLE IF EXISTS admissions_criteria_types`);
    await queryRunner.query(`DROP TABLE IF EXISTS fee_types`);
  }
}
