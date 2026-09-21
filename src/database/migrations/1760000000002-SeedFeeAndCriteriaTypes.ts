import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds catalogue data for fee_types and admissions_criteria_types
 * from ADM-F000_Extracted_Tables_and_Sample_Data_v2.xlsx.
 */
export class SeedFeeAndCriteriaTypes1760000000002 implements MigrationInterface {
  name = 'SeedFeeAndCriteriaTypes1760000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO fee_types (id, name) VALUES
        (7001, 'APPLICATION'),
        (7002, 'PROCESSING'),
        (7003, 'OTHER')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
      SELECT setval(pg_get_serial_sequence('fee_types', 'id'), GREATEST((SELECT MAX(id) FROM fee_types), 1));
    `);

    await queryRunner.query(`
      INSERT INTO admissions_criteria_types
        (id, code, name, description, value_data_type, status, sort_order, created_at, updated_at)
      VALUES
        (
          3001,
          'QUALIFICATION',
          'Qualification',
          'Required prior qualification',
          'TEXT',
          'ACTIVE',
          1,
          '2026-06-01 10:00:00+00',
          '2026-06-01 10:00:00+00'
        ),
        (
          3002,
          'MIN_PERCENTAGE',
          'Minimum Percentage',
          'Minimum obtained percentage',
          'PERCENTAGE',
          'ACTIVE',
          2,
          '2026-06-01 10:00:00+00',
          '2026-06-01 10:00:00+00'
        ),
        (
          3003,
          'SUBJECT_REQUIRED',
          'Required Subject',
          'Subject required in prior qualification',
          'TEXT',
          'ACTIVE',
          3,
          '2026-06-01 10:00:00+00',
          '2026-06-01 10:00:00+00'
        ),
        (
          3004,
          'ENTRY_TEST',
          'Entry Test',
          'Requirement for an entry test',
          'BOOLEAN',
          'ACTIVE',
          4,
          '2026-06-01 10:00:00+00',
          '2026-06-01 10:00:00+00'
        )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        value_data_type = EXCLUDED.value_data_type,
        status = EXCLUDED.status,
        sort_order = EXCLUDED.sort_order,
        updated_at = EXCLUDED.updated_at;
      SELECT setval(
        pg_get_serial_sequence('admissions_criteria_types', 'id'),
        GREATEST((SELECT MAX(id) FROM admissions_criteria_types), 1)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM admissions_criteria_types
      WHERE id IN (3001, 3002, 3003, 3004);
    `);
    await queryRunner.query(`
      DELETE FROM fee_types
      WHERE id IN (7001, 7002, 7003);
    `);
  }
}
