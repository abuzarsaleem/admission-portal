import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes the admissions_ prefix from physical table names.
 */
export class RemoveAdmissionsTablePrefix1760000000003 implements MigrationInterface {
  name = 'RemoveAdmissionsTablePrefix1760000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE admissions_supporting_information RENAME TO supporting_information`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_admission_criteria RENAME TO admission_criteria`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_offering_fees RENAME TO offering_fees`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_general_fees RENAME TO general_fees`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_programme_offerings RENAME TO programme_offerings`,
    );
    await queryRunner.query(`ALTER TABLE admissions_intakes RENAME TO intakes`);
    await queryRunner.query(
      `ALTER TABLE admissions_general_criteria RENAME TO general_criteria`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_programmes RENAME TO programmes`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_departments RENAME TO departments`,
    );
    await queryRunner.query(
      `ALTER TABLE admissions_criteria_types RENAME TO criteria_types`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE criteria_types RENAME TO admissions_criteria_types`,
    );
    await queryRunner.query(
      `ALTER TABLE departments RENAME TO admissions_departments`,
    );
    await queryRunner.query(
      `ALTER TABLE programmes RENAME TO admissions_programmes`,
    );
    await queryRunner.query(
      `ALTER TABLE general_criteria RENAME TO admissions_general_criteria`,
    );
    await queryRunner.query(`ALTER TABLE intakes RENAME TO admissions_intakes`);
    await queryRunner.query(
      `ALTER TABLE programme_offerings RENAME TO admissions_programme_offerings`,
    );
    await queryRunner.query(
      `ALTER TABLE general_fees RENAME TO admissions_general_fees`,
    );
    await queryRunner.query(
      `ALTER TABLE offering_fees RENAME TO admissions_offering_fees`,
    );
    await queryRunner.query(
      `ALTER TABLE admission_criteria RENAME TO admissions_admission_criteria`,
    );
    await queryRunner.query(
      `ALTER TABLE supporting_information RENAME TO admissions_supporting_information`,
    );
  }
}
