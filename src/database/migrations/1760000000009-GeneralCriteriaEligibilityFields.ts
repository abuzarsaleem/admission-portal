import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds structured eligibility fields on general_criteria so MIN_PERCENTAGE
 * (and similar) rules can be evaluated against applicant academic marks.
 */
export class GeneralCriteriaEligibilityFields1760000000009
  implements MigrationInterface
{
  name = 'GeneralCriteriaEligibilityFields1760000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE general_criteria
        ADD COLUMN IF NOT EXISTS criteria_value NUMERIC(10, 2) NULL,
        ADD COLUMN IF NOT EXISTS criteria_value_max NUMERIC(10, 2) NULL,
        ADD COLUMN IF NOT EXISTS applies_to_degree_type VARCHAR(80) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE general_criteria
        DROP CONSTRAINT IF EXISTS chk_general_criteria_value_range
    `);
    await queryRunner.query(`
      ALTER TABLE general_criteria
        ADD CONSTRAINT chk_general_criteria_value_range
        CHECK (
          criteria_value IS NULL
          OR criteria_value_max IS NULL
          OR criteria_value_max >= criteria_value
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE general_criteria
        DROP CONSTRAINT IF EXISTS chk_general_criteria_value_range
    `);
    await queryRunner.query(`
      ALTER TABLE general_criteria
        DROP COLUMN IF EXISTS applies_to_degree_type,
        DROP COLUMN IF EXISTS criteria_value_max,
        DROP COLUMN IF EXISTS criteria_value
    `);
  }
}
