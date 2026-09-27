import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ADM-F002 follow-ups:
 * - academic roll_number
 * - drop selected_test_centre_id; store accepted offering declaration IDs
 * - allow configurable preference_order (>= 1)
 */
export class ApplicationCompletionAdjustments1760000000008
  implements MigrationInterface
{
  name = 'ApplicationCompletionAdjustments1760000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE application_academic_information
        ADD COLUMN IF NOT EXISTS roll_number VARCHAR(80) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE application_declarations
        DROP COLUMN IF EXISTS selected_test_centre_id
    `);

    await queryRunner.query(`
      ALTER TABLE application_declarations
        ADD COLUMN IF NOT EXISTS accepted_offering_declaration_ids UUID[] NOT NULL DEFAULT '{}'
    `);

    await queryRunner.query(`
      ALTER TABLE application_programme_options
        DROP CONSTRAINT IF EXISTS chk_programme_option_preference
    `);

    await queryRunner.query(`
      ALTER TABLE application_programme_options
        ADD CONSTRAINT chk_programme_option_preference
          CHECK (preference_order >= 1 AND preference_order <= 20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE application_programme_options
        DROP CONSTRAINT IF EXISTS chk_programme_option_preference
    `);

    await queryRunner.query(`
      ALTER TABLE application_programme_options
        ADD CONSTRAINT chk_programme_option_preference
          CHECK (preference_order IN (1, 2))
    `);

    await queryRunner.query(`
      ALTER TABLE application_declarations
        DROP COLUMN IF EXISTS accepted_offering_declaration_ids
    `);

    await queryRunner.query(`
      ALTER TABLE application_declarations
        ADD COLUMN IF NOT EXISTS selected_test_centre_id VARCHAR(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE application_academic_information
        DROP COLUMN IF EXISTS roll_number
    `);
  }
}
