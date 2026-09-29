import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdmissionDocuments1760000000011 implements MigrationInterface {
  name = 'CreateAdmissionDocuments1760000000011';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE document_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), code VARCHAR(60) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL, category VARCHAR(40) NOT NULL, description TEXT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await q.query(`CREATE TABLE offering_required_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
      programme_offering_id UUID NOT NULL REFERENCES programme_offerings(id) ON DELETE CASCADE,
      document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
      mandatory BOOLEAN NOT NULL DEFAULT TRUE, condition_code VARCHAR(60) NULL,
      sort_order INTEGER NOT NULL DEFAULT 0, active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by UUID NOT NULL, updated_by UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT uq_offering_required_document_type UNIQUE (tenant_id, programme_offering_id, document_type_id)
    )`);
    await q.query(`CREATE INDEX idx_offering_required_resolution ON offering_required_documents(tenant_id, programme_offering_id, active, sort_order)`);
    await q.query(`CREATE TABLE applicant_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
      applicant_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      application_id BIGINT NOT NULL, programme_offering_id UUID NOT NULL REFERENCES programme_offerings(id) ON DELETE RESTRICT,
      offering_required_document_id UUID NOT NULL REFERENCES offering_required_documents(id) ON DELETE RESTRICT,
      document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
      source_module VARCHAR(10) NOT NULL DEFAULT 'F004', source_document_id UUID NULL,
      file_reference VARCHAR(1000) NULL, file_name VARCHAR(255) NULL, mime_type VARCHAR(100) NULL,
      file_size_bytes BIGINT NULL, checksum_sha256 CHAR(64) NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'NOT_SUBMITTED', submitted_by UUID NULL,
      submitted_at TIMESTAMPTZ NULL, resubmission_reason TEXT NULL,
      resubmission_requested_at TIMESTAMPTZ NULL, verified_by UUID NULL, verified_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT chk_applicant_document_source CHECK (source_module IN ('F002','F004')),
      CONSTRAINT chk_applicant_document_status CHECK (status IN ('NOT_SUBMITTED','SUBMITTED','RESUBMISSION_REQUIRED','VERIFIED')),
      CONSTRAINT chk_applicant_document_file_source CHECK (
        (source_module='F002' AND source_document_id IS NOT NULL AND file_reference IS NULL) OR
        (source_module='F004' AND source_document_id IS NULL AND file_reference IS NOT NULL) OR
        (status='NOT_SUBMITTED' AND source_document_id IS NULL AND file_reference IS NULL)
      ),
      CONSTRAINT uq_applicant_document_requirement UNIQUE (tenant_id, applicant_id, offering_required_document_id)
    )`);
    await q.query(`CREATE INDEX idx_applicant_documents_tenant_status ON applicant_documents(tenant_id, status)`);
    await q.query(`CREATE INDEX idx_applicant_documents_source ON applicant_documents(source_module, source_document_id)`);
    await q.query(`CREATE TABLE document_verification_audits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id UUID NOT NULL,
      applicant_document_id UUID NOT NULL REFERENCES applicant_documents(id) ON DELETE CASCADE,
      action VARCHAR(40) NOT NULL, from_status VARCHAR(30) NULL, to_status VARCHAR(30) NOT NULL,
      reason TEXT NULL, acted_by UUID NOT NULL, acted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    await q.query(`CREATE INDEX idx_document_audit_history ON document_verification_audits(applicant_document_id, acted_at)`);
    await q.query(`INSERT INTO document_types(code,name,category,description) VALUES
      ('CNIC_FRONT','CNIC Front','IDENTITY','Front side of applicant CNIC'),
      ('CNIC_BACK','CNIC Back','IDENTITY','Back side of applicant CNIC'),
      ('PASSPORT','Passport','IDENTITY','Passport biodata page, where applicable'),
      ('B_FORM','B-Form / Child Registration Certificate','IDENTITY','For applicants without CNIC where institution permits'),
      ('FATHER_GUARDIAN_CNIC','Father / Guardian CNIC','IDENTITY','Identity document of father/guardian'),
      ('SECONDARY_CERTIFICATE','Secondary School Certificate','ACADEMIC','SSC / Matric certificate'),
      ('SECONDARY_MARKSHEET','Secondary School Marksheet','ACADEMIC','SSC / Matric marksheet'),
      ('HIGHER_SECONDARY_CERTIFICATE','Higher Secondary Certificate','ACADEMIC','HSSC / Intermediate certificate'),
      ('HIGHER_SECONDARY_MARKSHEET','Higher Secondary Marksheet','ACADEMIC','HSSC / Intermediate marksheet'),
      ('DIPLOMA_CERTIFICATE','Diploma Certificate','ACADEMIC','Diploma/technical qualification certificate where applicable'),
      ('DIPLOMA_MARKSHEET','Diploma Marksheet','ACADEMIC','Diploma/technical qualification marksheet where applicable'),
      ('TRANSCRIPT','Academic Transcript','ACADEMIC','Transcript for transfer/higher qualification cases'),
      ('DOMICILE','Domicile Certificate','RESIDENCY','Domicile/residency evidence where required'),
      ('CHARACTER_CERTIFICATE','Character Certificate','SUPPORTING','Character certificate where required'),
      ('MIGRATION_CERTIFICATE','Migration Certificate','SUPPORTING','Migration certificate where required'),
      ('EQUIVALENCE_CERTIFICATE','Equivalence Certificate','ACADEMIC','IBCC/HEC or relevant equivalence where applicable'),
      ('NOC','No Objection Certificate','SUPPORTING','NOC for transfer/employment/other applicable cases'),
      ('DISABILITY_CERTIFICATE','Disability Certificate','SPECIAL_CASE','Supporting certificate for declared disability where required'),
      ('AFFIDAVIT','Affidavit','SUPPORTING','Institution-specific affidavit where required'),
      ('OTHER_SUPPORTING_DOCUMENT','Other Supporting Document','SUPPORTING','Configurable additional admission document')
      ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS document_verification_audits');
    await q.query('DROP TABLE IF EXISTS applicant_documents');
    await q.query('DROP TABLE IF EXISTS offering_required_documents');
    await q.query('DROP TABLE IF EXISTS document_types');
  }
}
