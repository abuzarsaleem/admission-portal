import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProcessingFeeTables1760000000010 implements MigrationInterface {
  name = 'CreateProcessingFeeTables1760000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE applications
        ADD COLUMN IF NOT EXISTS processing_fee_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID'
    `);
    await queryRunner.query(`
      ALTER TABLE applications
        DROP CONSTRAINT IF EXISTS chk_applications_processing_fee_status
    `);
    await queryRunner.query(`
      ALTER TABLE applications
        ADD CONSTRAINT chk_applications_processing_fee_status
        CHECK (processing_fee_status IN (
          'UNPAID', 'PARTIALLY_PAID', 'EVIDENCE_SUBMITTED', 'VERIFIED', 'LATE_PAYMENT_VERIFIED'
        ))
    `);

    await queryRunner.query(`
      CREATE TABLE processing_fee_challans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        challan_number VARCHAR(100) NOT NULL UNIQUE,
        issue_date TIMESTAMPTZ NOT NULL,
        due_date TIMESTAMPTZ NOT NULL,
        designated_bank_id UUID NOT NULL,
        collection_bank_name VARCHAR(150) NOT NULL,
        collection_bank_branch VARCHAR(150) NOT NULL,
        collection_bank_account VARCHAR(100) NOT NULL,
        branch_code VARCHAR(50) NOT NULL,
        institution_code VARCHAR(50) NULL,
        applicant_name VARCHAR(150) NOT NULL,
        applicant_contact_number VARCHAR(30) NOT NULL,
        registration_number VARCHAR(100) NOT NULL,
        intake_session VARCHAR(255) NOT NULL,
        programmes_applied_for TEXT NOT NULL,
        total_amount_payable NUMERIC(14,2) NOT NULL,
        amount_in_words VARCHAR(255) NOT NULL,
        payment_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID',
        payment_date TIMESTAMPTZ NULL,
        amount_paid NUMERIC(14,2) NULL,
        late_payment_flag BOOLEAN NOT NULL DEFAULT FALSE,
        verified_by VARCHAR(100) NULL,
        verification_date TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_processing_fee_challan_status CHECK (payment_status IN (
          'UNPAID', 'PARTIALLY_PAID', 'EVIDENCE_SUBMITTED', 'VERIFIED', 'LATE_PAYMENT_VERIFIED'
        ))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_processing_fee_challans_tenant ON processing_fee_challans(tenant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_processing_fee_challans_applicant ON processing_fee_challans(applicant_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_processing_fee_challans_status ON processing_fee_challans(payment_status)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_processing_fee_challan_per_applicant ON processing_fee_challans(tenant_id, applicant_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE processing_fee_challan_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        challan_id UUID NOT NULL REFERENCES processing_fee_challans(id) ON DELETE CASCADE,
        fee_type_code VARCHAR(50) NOT NULL,
        description VARCHAR(200) NOT NULL,
        quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
        unit_amount NUMERIC(14,2) NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        currency CHAR(3) NOT NULL,
        due_date TIMESTAMPTZ NULL,
        source_reference VARCHAR(100) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_processing_fee_items_challan ON processing_fee_challan_items(challan_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE designated_banks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        bank_name VARCHAR(150) NOT NULL,
        branch_name VARCHAR(150) NOT NULL,
        branch_code VARCHAR(50) NOT NULL,
        account_title VARCHAR(200) NOT NULL,
        account_number VARCHAR(100) NOT NULL,
        effective_from TIMESTAMPTZ NOT NULL,
        effective_to TIMESTAMPTZ NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_designated_banks_tenant_active ON designated_banks(tenant_id, is_active)`,
    );
    await queryRunner.query(`
      ALTER TABLE processing_fee_challans
      ADD CONSTRAINT fk_processing_fee_challan_designated_bank
      FOREIGN KEY (designated_bank_id) REFERENCES designated_banks(id) ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      CREATE TABLE payment_evidence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        applicant_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        challan_id UUID NOT NULL REFERENCES processing_fee_challans(id) ON DELETE CASCADE,
        online_payment_transaction_id UUID NULL,
        storage_key VARCHAR(500) NOT NULL,
        file_format VARCHAR(10) NOT NULL,
        evidence_source VARCHAR(30) NOT NULL,
        upload_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        verification_indicator VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED',
        verified_by VARCHAR(100) NULL,
        verification_date TIMESTAMPTZ NULL,
        replaced_by UUID NULL,
        is_current BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT chk_payment_evidence_source CHECK (evidence_source IN ('BANK_RECEIPT', 'ONLINE_RECEIPT')),
        CONSTRAINT chk_payment_evidence_indicator CHECK (verification_indicator IN ('UNVERIFIED', 'VERIFIED', 'REJECTED'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_payment_evidence_challan_current ON payment_evidence(challan_id, is_current)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_payment_evidence_transaction ON payment_evidence(online_payment_transaction_id)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_payment_evidence_one_current_per_challan ON payment_evidence(challan_id) WHERE is_current = TRUE`,
    );

    await queryRunner.query(`
      CREATE TABLE online_payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        challan_id UUID NOT NULL REFERENCES processing_fee_challans(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
        payment_method VARCHAR(30) NOT NULL,
        transaction_reference VARCHAR(150) NOT NULL,
        currency CHAR(3) NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'INITIATED',
        paid_at TIMESTAMPTZ NULL,
        confirmed_at TIMESTAMPTZ NULL,
        provider_code VARCHAR(60) NULL,
        notes VARCHAR(500) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_online_payment_reference UNIQUE (tenant_id, transaction_reference),
        CONSTRAINT chk_online_payment_method CHECK (payment_method IN ('WALLET', 'MOBILE_ACCOUNT')),
        CONSTRAINT chk_online_payment_status CHECK (status IN ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_online_payment_challan ON online_payment_transactions(challan_id)`,
    );
    await queryRunner.query(`
      ALTER TABLE payment_evidence
      ADD CONSTRAINT fk_payment_evidence_online_payment
      FOREIGN KEY (online_payment_transaction_id) REFERENCES online_payment_transactions(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE TABLE bank_reconciliation_imports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        import_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        file_reference VARCHAR(500) NOT NULL,
        total_records INTEGER NOT NULL DEFAULT 0,
        matched_records INTEGER NOT NULL DEFAULT 0,
        exception_records INTEGER NOT NULL DEFAULT 0,
        imported_by VARCHAR(100) NOT NULL,
        import_status VARCHAR(20) NOT NULL DEFAULT 'COMPLETE',
        source_format VARCHAR(20) NOT NULL DEFAULT 'CSV',
        source_columns_hash VARCHAR(128) NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_bank_imports_tenant_date ON bank_reconciliation_imports(tenant_id, import_date)`,
    );

    await queryRunner.query(`
      CREATE TABLE bank_reconciliation_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        import_id UUID NOT NULL REFERENCES bank_reconciliation_imports(id) ON DELETE CASCADE,
        receipt_no VARCHAR(100) NOT NULL,
        consumer_no VARCHAR(100) NOT NULL,
        class_name VARCHAR(255) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        valid_date_of_voucher DATE NOT NULL,
        due_date DATE NOT NULL,
        amount_within_dd NUMERIC(14,2) NOT NULL,
        amount_after_dd NUMERIC(14,2) NOT NULL,
        campus_code VARCHAR(50) NOT NULL,
        date_paid DATE NOT NULL,
        amount NUMERIC(14,2) NOT NULL,
        payment_mode VARCHAR(50) NOT NULL,
        branch_code VARCHAR(50) NOT NULL,
        usertext1 VARCHAR(255) NULL,
        usertext2 VARCHAR(255) NULL,
        usertext3 VARCHAR(255) NULL,
        usertext4 VARCHAR(255) NULL,
        usertext5 VARCHAR(255) NULL,
        matched_challan_id UUID NULL REFERENCES processing_fee_challans(id) ON DELETE SET NULL,
        match_status VARCHAR(40) NOT NULL,
        registration_match BOOLEAN NULL,
        amount_match BOOLEAN NULL,
        duplicate_key VARCHAR(200) NULL,
        exception_type VARCHAR(60) NULL,
        resolution_status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
        resolved_by VARCHAR(100) NULL,
        resolution_date TIMESTAMPTZ NULL,
        CONSTRAINT chk_bank_resolution_status CHECK (resolution_status IN ('OPEN', 'RESOLVED', 'IGNORED'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_bank_records_receipt ON bank_reconciliation_records(receipt_no)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bank_records_import_receipt ON bank_reconciliation_records(import_id, receipt_no)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_bank_records_exception_queue ON bank_reconciliation_records(match_status, resolution_status)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS bank_reconciliation_records`);
    await queryRunner.query(`DROP TABLE IF EXISTS bank_reconciliation_imports`);
    await queryRunner.query(`DROP TABLE IF EXISTS payment_evidence`);
    await queryRunner.query(`DROP TABLE IF EXISTS online_payment_transactions`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS processing_fee_challan_items`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS processing_fee_challans`);
    await queryRunner.query(`DROP TABLE IF EXISTS designated_banks`);
    await queryRunner.query(
      `ALTER TABLE applications DROP COLUMN IF EXISTS processing_fee_status`,
    );
  }
}
