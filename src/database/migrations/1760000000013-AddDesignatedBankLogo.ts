import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDesignatedBankLogo1760000000013 implements MigrationInterface {
  name = 'AddDesignatedBankLogo1760000000013';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE designated_banks ADD COLUMN logo_storage_key VARCHAR(1000) NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE designated_banks DROP COLUMN logo_storage_key`,
    );
  }
}
