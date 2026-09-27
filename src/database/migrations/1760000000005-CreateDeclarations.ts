import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Declaration catalogue + masters + offering attachments (fees-style).
 * Replaces earlier single `declarations` table if present.
 * Spec tables: admissions_declaration_types / general_declarations / offering_declarations
 * (project naming: declaration_types, general_declarations, offering_declarations).
 */
export class CreateDeclarations1760000000005 implements MigrationInterface {
  name = 'CreateDeclarations1760000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS declarations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS offering_declarations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS general_declarations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS declaration_types CASCADE`);

    await queryRunner.query(`
      CREATE TABLE declaration_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL,
        name VARCHAR(150) NOT NULL,
        description VARCHAR(500) NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_declaration_types_status
          CHECK (status IN ('ACTIVE', 'INACTIVE'))
      );
      CREATE UNIQUE INDEX uq_declaration_types_code ON declaration_types (code);
      CREATE INDEX idx_declaration_types_name ON declaration_types (name);
      CREATE INDEX idx_declaration_types_status ON declaration_types (status);
    `);

    await queryRunner.query(`
      CREATE TABLE general_declarations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        declaration_type_id UUID NOT NULL
          REFERENCES declaration_types (id) ON DELETE RESTRICT,
        declaration_text TEXT NOT NULL,
        version VARCHAR(100) NOT NULL,
        effective_from TIMESTAMPTZ NOT NULL,
        effective_to TIMESTAMPTZ NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_general_declarations_status
          CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
        CONSTRAINT chk_general_declarations_effective_window
          CHECK (
            effective_to IS NULL
            OR effective_to > effective_from
          )
      );
      CREATE UNIQUE INDEX uq_general_declarations_tenant_type_version
        ON general_declarations (tenant_id, declaration_type_id, version);
      CREATE INDEX idx_general_declarations_tenant_id ON general_declarations (tenant_id);
      CREATE INDEX idx_general_declarations_type_id ON general_declarations (declaration_type_id);
      CREATE INDEX idx_general_declarations_status ON general_declarations (status);
    `);

    await queryRunner.query(`
      CREATE TABLE offering_declarations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        programme_offering_id UUID NOT NULL
          REFERENCES programme_offerings (id) ON DELETE RESTRICT,
        declaration_type_id UUID NOT NULL
          REFERENCES declaration_types (id) ON DELETE RESTRICT,
        declaration_text TEXT NOT NULL,
        version VARCHAR(100) NOT NULL,
        effective_from TIMESTAMPTZ NOT NULL,
        effective_to TIMESTAMPTZ NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by UUID NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID NOT NULL,
        CONSTRAINT chk_offering_declarations_status
          CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')),
        CONSTRAINT chk_offering_declarations_effective_window
          CHECK (
            effective_to IS NULL
            OR effective_to > effective_from
          )
      );
      CREATE INDEX idx_offering_declarations_tenant_id ON offering_declarations (tenant_id);
      CREATE INDEX idx_offering_declarations_offering_id
        ON offering_declarations (programme_offering_id);
      CREATE INDEX idx_offering_declarations_type_id
        ON offering_declarations (declaration_type_id);
      CREATE INDEX idx_offering_declarations_status ON offering_declarations (status);
    `);

    await queryRunner.query(`
      INSERT INTO declaration_types (id, code, name, description, status, created_at, updated_at)
      VALUES
        ('33333333-3333-4333-8333-333333333001', 'GENERAL', 'General Declaration',
         'General institutional declaration shown to applicants', 'ACTIVE', NOW(), NOW()),
        ('33333333-3333-4333-8333-333333333002', 'UNDERTAKING', 'Student Undertaking',
         'Student undertaking / commitment declaration', 'ACTIVE', NOW(), NOW()),
        ('33333333-3333-4333-8333-333333333003', 'DISCIPLINARY', 'Disciplinary Declaration',
         'Disciplinary rules acknowledgement', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        updated_at = NOW();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS offering_declarations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS general_declarations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS declaration_types CASCADE`);
  }
}
