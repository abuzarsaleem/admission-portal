import { useEffect, useState } from 'react'
import { Camera, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/client'
import {
  createAddresses,
  createContacts,
  createProfileStep,
  getAddresses,
  getContacts,
  getProfileStep,
  updateAddresses,
  updateContacts,
  updateProfileStep,
  uploadProfilePhotograph,
} from '@/lib/api/applications'
import { normalizeMobileNumber } from '@/lib/admissions-display'
import {
  ADDRESS_TYPE_OPTIONS,
  CONTACT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  REFERRAL_OPTIONS,
} from '@/lib/application-steps'
import type {
  AddressFields,
  AddressType,
  ApplicationAddressResponse,
  ApplicationContactResponse,
  ContactFields,
  ContactType,
  SaveProfileRequest,
} from '@/lib/api/types'

type Props = {
  applicantId: string
  defaultName?: string
  onSaved: () => void
  onBack?: () => void
}

type AddressDraft = AddressFields & { localKey: string; id?: string }
type ContactDraft = ContactFields & { localKey: string; id?: string }

function emptyAddress(): AddressDraft {
  return {
    localKey: `addr-${Date.now()}`,
    addressType: 'PRIMARY',
    addressLine1: '',
    addressLine2: '',
    countryId: 'PK',
    provinceId: 'PK-PB',
    cityId: 'PK-PB-LHE',
    postalCode: '',
    isSameAsPrimary: false,
  }
}

function emptyContact(): ContactDraft {
  return {
    localKey: `contact-${Date.now()}`,
    contactType: 'EMERGENCY',
    name: '',
    relationship: 'FATHER',
    mobileNumber: '',
    occupation: '',
    identityDocumentNumber: '',
    telephone: '',
    email: '',
    addressLine: '',
  }
}

export function ProfileStep({ applicantId, defaultName, onSaved, onBack }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  const [applicantName, setApplicantName] = useState(defaultName ?? '')
  const [gender, setGender] = useState('MALE')
  const [maritalStatus, setMaritalStatus] = useState('SINGLE')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [mobileLocal, setMobileLocal] = useState('')
  const [telephone, setTelephone] = useState('')
  const [primaryNationalityId, setPrimaryNationalityId] = useState('PK')
  const [secondaryNationalityId, setSecondaryNationalityId] = useState('')
  const [domicileId, setDomicileId] = useState('PK-PB-LHE')
  const [disabilityDeclared, setDisabilityDeclared] = useState(false)
  const [referralSource, setReferralSource] = useState('FRIEND')

  const [addresses, setAddresses] = useState<ApplicationAddressResponse[]>([])
  const [contacts, setContacts] = useState<ApplicationContactResponse[]>([])
  const [addressDraft, setAddressDraft] = useState<AddressDraft | null>(null)
  const [contactDraft, setContactDraft] = useState<ContactDraft | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [profile, addressList, contactList] = await Promise.all([
          getProfileStep(applicantId).catch(() => null),
          getAddresses(applicantId).catch(() => []),
          getContacts(applicantId).catch(() => []),
        ])
        if (cancelled) return

        if (profile) {
          setProfileSaved(profile.profileStepSaved)
          setApplicantName(profile.applicantName || defaultName || '')
          if (profile.gender) setGender(String(profile.gender))
          if (profile.maritalStatus) setMaritalStatus(String(profile.maritalStatus))
          if (profile.dateOfBirth) setDateOfBirth(String(profile.dateOfBirth).slice(0, 10))
          if (profile.mobileNumber) {
            setMobileLocal(profile.mobileNumber.replace(/^\+92/, '').replace(/^0/, ''))
          }
          if (profile.telephone) setTelephone(String(profile.telephone))
          if (profile.primaryNationalityId) {
            setPrimaryNationalityId(String(profile.primaryNationalityId))
          }
          if (profile.secondaryNationalityId) {
            setSecondaryNationalityId(String(profile.secondaryNationalityId))
          }
          if (profile.domicileId) setDomicileId(String(profile.domicileId))
          if (profile.disabilityDeclared != null) {
            setDisabilityDeclared(!!profile.disabilityDeclared)
          }
          if (profile.referralSource) setReferralSource(String(profile.referralSource))
          setPhotoUrl(
            profile.profilePhotographDownloadUrl || profile.profilePhotograph || null,
          )
        }

        const resolvedAddresses =
          addressList.length > 0 ? addressList : (profile?.addresses ?? [])
        const resolvedContacts =
          contactList.length > 0 ? contactList : (profile?.contacts ?? [])
        setAddresses(resolvedAddresses)
        setContacts(resolvedContacts)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load profile.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [applicantId, defaultName])

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true)
    setError(null)
    try {
      const result = await uploadProfilePhotograph(applicantId, file)
      setPhotoUrl(result.downloadUrl || result.profilePhotograph)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Unable to upload photograph.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function saveAddressDraft() {
    if (!addressDraft) return
    if (
      !addressDraft.addressLine1.trim() ||
      !addressDraft.countryId.trim() ||
      !addressDraft.provinceId.trim() ||
      !addressDraft.cityId.trim()
    ) {
      setError('Please complete all required address fields.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload: AddressFields = {
        addressType: addressDraft.addressType,
        addressLine1: addressDraft.addressLine1.trim(),
        addressLine2: addressDraft.addressLine2?.trim() || undefined,
        countryId: addressDraft.countryId.trim(),
        provinceId: addressDraft.provinceId.trim(),
        cityId: addressDraft.cityId.trim(),
        postalCode: addressDraft.postalCode?.trim() || undefined,
        isSameAsPrimary: false,
      }

      if (addressDraft.id) {
        const updated = await updateAddresses(applicantId, [
          { ...payload, id: addressDraft.id },
        ])
        setAddresses(prev => {
          const byId = new Map(prev.map(item => [item.id, item]))
          for (const item of updated) byId.set(item.id, item)
          // Prefer refreshed list if API returned full set
          return updated.length >= prev.length
            ? updated
            : Array.from(byId.values())
        })
        const refreshed = await getAddresses(applicantId).catch(() => null)
        if (refreshed) setAddresses(refreshed)
      } else {
        const created = await createAddresses(applicantId, [payload])
        const refreshed = await getAddresses(applicantId).catch(() => created)
        setAddresses(refreshed.length ? refreshed : [...addresses, ...created])
      }
      setAddressDraft(null)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Unable to save address.')
    } finally {
      setSaving(false)
    }
  }

  async function saveContactDraft() {
    if (!contactDraft) return
    if (
      !contactDraft.name.trim() ||
      !contactDraft.relationship.trim() ||
      !contactDraft.mobileNumber.trim()
    ) {
      setError('Please complete all required contact fields.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload: ContactFields = {
        contactType: contactDraft.contactType,
        name: contactDraft.name.trim(),
        relationship: contactDraft.relationship.trim(),
        mobileNumber: normalizeMobileNumber(contactDraft.mobileNumber),
        occupation: contactDraft.occupation?.trim() || undefined,
        identityDocumentNumber: contactDraft.identityDocumentNumber?.trim() || undefined,
        telephone: contactDraft.telephone?.trim() || undefined,
        email: contactDraft.email?.trim() || undefined,
        addressLine: contactDraft.addressLine?.trim() || undefined,
      }

      if (contactDraft.id) {
        await updateContacts(applicantId, [{ ...payload, id: contactDraft.id }])
        const refreshed = await getContacts(applicantId).catch(() => null)
        if (refreshed) setContacts(refreshed)
      } else {
        const created = await createContacts(applicantId, [payload])
        const refreshed = await getContacts(applicantId).catch(() => created)
        setContacts(refreshed.length ? refreshed : [...contacts, ...created])
      }
      setContactDraft(null)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Unable to save contact.')
    } finally {
      setSaving(false)
    }
  }

  function startEditAddress(item: ApplicationAddressResponse) {
    setError(null)
    setAddressDraft({
      localKey: `addr-${item.id}`,
      id: item.id,
      addressType: item.addressType,
      addressLine1: item.addressLine1,
      addressLine2: item.addressLine2 ?? '',
      countryId: item.countryId,
      provinceId: item.provinceId,
      cityId: item.cityId,
      postalCode: item.postalCode ?? '',
      isSameAsPrimary: item.isSameAsPrimary,
    })
  }

  function startEditContact(item: ApplicationContactResponse) {
    setError(null)
    setContactDraft({
      localKey: `contact-${item.id}`,
      id: item.id,
      contactType: item.contactType,
      name: item.name,
      relationship: item.relationship,
      mobileNumber: item.mobileNumber.replace(/^\+92/, '').replace(/^0/, ''),
      occupation: item.occupation ?? '',
      identityDocumentNumber: item.identityDocumentNumber ?? '',
      telephone: item.telephone ?? '',
      email: item.email ?? '',
      addressLine: item.addressLine ?? '',
    })
  }

  function removeAddress(id: string) {
    setAddresses(prev => prev.filter(item => item.id !== id))
    if (addressDraft?.id === id) setAddressDraft(null)
    setError(null)
  }

  function removeContact(id: string) {
    setContacts(prev => prev.filter(item => item.id !== id))
    if (contactDraft?.id === id) setContactDraft(null)
    setError(null)
  }

  async function handleContinue() {
    if (addressDraft || contactDraft) {
      setError('Save or cancel the open address/contact form before continuing.')
      return
    }
    if (addresses.length === 0) {
      setError('Add at least one address before continuing.')
      return
    }
    if (contacts.length === 0) {
      setError('Add at least one contact before continuing.')
      return
    }
    if (
      !applicantName.trim() ||
      !dateOfBirth ||
      !mobileLocal.trim() ||
      !primaryNationalityId.trim()
    ) {
      setError('Please complete all required personal information fields.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      // Sync remaining addresses/contacts (update existing after local removals).
      if (addresses.length > 0) {
        await updateAddresses(
          applicantId,
          addresses.map(item => ({
            id: item.id,
            addressType: item.addressType,
            addressLine1: item.addressLine1,
            addressLine2: item.addressLine2 ?? undefined,
            countryId: item.countryId,
            provinceId: item.provinceId,
            cityId: item.cityId,
            postalCode: item.postalCode ?? undefined,
            isSameAsPrimary: item.isSameAsPrimary,
          })),
        )
      }
      if (contacts.length > 0) {
        await updateContacts(
          applicantId,
          contacts.map(item => ({
            id: item.id,
            contactType: item.contactType,
            name: item.name,
            relationship: item.relationship,
            mobileNumber: item.mobileNumber,
            occupation: item.occupation ?? undefined,
            identityDocumentNumber: item.identityDocumentNumber ?? undefined,
            telephone: item.telephone ?? undefined,
            email: item.email ?? undefined,
            addressLine: item.addressLine ?? undefined,
          })),
        )
      }

      const profileBody: SaveProfileRequest = {
        applicantName: applicantName.trim(),
        gender,
        maritalStatus,
        dateOfBirth,
        mobileNumber: normalizeMobileNumber(mobileLocal),
        telephone: telephone.trim() || undefined,
        primaryNationalityId: primaryNationalityId.trim(),
        secondaryNationalityId: secondaryNationalityId.trim() || undefined,
        domicileId: domicileId.trim() || undefined,
        disabilityDeclared,
        referralSource: referralSource.trim() || undefined,
      }

      if (profileSaved) {
        await updateProfileStep(applicantId, profileBody)
      } else {
        await createProfileStep(applicantId, profileBody)
        setProfileSaved(true)
      }

      onSaved()
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Unable to save profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#6374ab]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading personal information...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#071759]">Personal Information</h2>
        <p className="mt-1 text-sm text-[#354a8d]">
          Fill personal details, then add at least one address and one contact.
        </p>
      </div>

      <section className="rounded-xl border border-[#e4e9f4] bg-white p-5">
        <h3 className="font-semibold text-[#071759]">Profile Photograph</h3>
        <p className="mt-1 text-xs text-[#6374ab]">JPEG, PNG, or WEBP — max 5MB.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-xl border border-[#dce5f6] bg-[#f8faff]">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8 text-[#94a3b8]" />
            )}
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-[#dce5f6] bg-white px-4 text-sm font-medium text-[#19316f]">
            {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {photoUrl ? 'Replace Photo' : 'Upload Photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void handlePhotoUpload(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-[#e4e9f4] bg-white p-5">
        <h3 className="font-semibold text-[#071759]">Personal Details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <Input value={applicantName} onChange={e => setApplicantName(e.target.value)} />
          </Field>
          <Field label="Date of Birth">
            <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </Field>
          <Field label="Gender">
            <select
              value={gender}
              onChange={e => setGender(e.target.value)}
              className="h-10 w-full rounded-md border border-[#dce5f6] px-3 text-sm"
            >
              {GENDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Marital Status">
            <select
              value={maritalStatus}
              onChange={e => setMaritalStatus(e.target.value)}
              className="h-10 w-full rounded-md border border-[#dce5f6] px-3 text-sm"
            >
              {MARITAL_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mobile Number">
            <div className="flex h-10 items-center gap-2 rounded-md border border-[#dce5f6] px-3">
              <span className="text-xs font-semibold text-[#19316f]">+92</span>
              <Input
                value={mobileLocal}
                onChange={e => setMobileLocal(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>
          </Field>
          <Field label="Telephone" required={false}>
            <Input value={telephone} onChange={e => setTelephone(e.target.value)} />
          </Field>
          <Field label="Primary Nationality ID">
            <Input
              value={primaryNationalityId}
              onChange={e => setPrimaryNationalityId(e.target.value)}
            />
          </Field>
          <Field label="Secondary Nationality ID" required={false}>
            <Input
              value={secondaryNationalityId}
              onChange={e => setSecondaryNationalityId(e.target.value)}
            />
          </Field>
          <Field label="Domicile ID" required={false}>
            <Input value={domicileId} onChange={e => setDomicileId(e.target.value)} />
          </Field>
          <Field label="Referral Source" required={false}>
            <select
              value={referralSource}
              onChange={e => setReferralSource(e.target.value)}
              className="h-10 w-full rounded-md border border-[#dce5f6] px-3 text-sm"
            >
              {REFERRAL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-center gap-2 pt-6 sm:col-span-2">
            <input
              id="disability"
              type="checkbox"
              checked={disabilityDeclared}
              onChange={e => setDisabilityDeclared(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="disability" className="text-sm text-[#334155]">
              I declare a disability (if applicable)
            </label>
          </div>
        </div>
      </section>

      {/* Addresses */}
      <section className="space-y-4 rounded-xl border border-[#e4e9f4] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#071759]">Addresses</h3>
            <p className="text-xs text-[#6374ab]">At least one address is required.</p>
          </div>
          {!addressDraft ? (
            <Button
              type="button"
              className="h-9 bg-[#0c3cff] hover:bg-[#0934dc]"
              onClick={() => {
                setError(null)
                setAddressDraft(emptyAddress())
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Address
            </Button>
          ) : null}
        </div>

        {addresses.length === 0 && !addressDraft ? (
          <div className="rounded-lg border border-dashed border-[#dce5f6] bg-[#f8faff] px-4 py-8 text-center text-sm text-[#6374ab]">
            No addresses added yet. Click Add Address to open the form.
          </div>
        ) : null}

        {addresses
          .filter(item => item.id !== addressDraft?.id)
          .map(item => (
          <div
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[#e8edf5] px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-[#071759]">{item.addressType}</p>
              <p className="mt-0.5 text-sm text-[#354a8d]">{item.addressLine1}</p>
              <p className="text-xs text-[#6374ab]">
                {item.cityId} · {item.provinceId} · {item.countryId}
                {item.postalCode ? ` · ${item.postalCode}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-[#0c3cff]"
                onClick={() => startEditAddress(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-red-600"
                onClick={() => removeAddress(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {addressDraft ? (
          <div className="rounded-xl border border-[#0c3cff] bg-[#f8faff] p-4 ring-2 ring-[#dbe7ff]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#071759]">
                {addressDraft.id ? 'Edit Address' : 'New Address'}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-[#6374ab]"
                onClick={() => setAddressDraft(null)}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Address Type">
                <select
                  value={addressDraft.addressType}
                  onChange={e =>
                    setAddressDraft(prev =>
                      prev ? { ...prev, addressType: e.target.value as AddressType } : prev,
                    )
                  }
                  className="h-10 w-full rounded-md border border-[#dce5f6] bg-white px-3 text-sm"
                >
                  {ADDRESS_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Postal Code" required={false}>
                <Input
                  value={addressDraft.postalCode ?? ''}
                  onChange={e =>
                    setAddressDraft(prev => (prev ? { ...prev, postalCode: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Address Line 1">
                <Input
                  value={addressDraft.addressLine1}
                  onChange={e =>
                    setAddressDraft(prev =>
                      prev ? { ...prev, addressLine1: e.target.value } : prev,
                    )
                  }
                />
              </Field>
              <Field label="Address Line 2" required={false}>
                <Input
                  value={addressDraft.addressLine2 ?? ''}
                  onChange={e =>
                    setAddressDraft(prev =>
                      prev ? { ...prev, addressLine2: e.target.value } : prev,
                    )
                  }
                />
              </Field>
              <Field label="Country ID">
                <Input
                  value={addressDraft.countryId}
                  onChange={e =>
                    setAddressDraft(prev => (prev ? { ...prev, countryId: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Province ID">
                <Input
                  value={addressDraft.provinceId}
                  onChange={e =>
                    setAddressDraft(prev => (prev ? { ...prev, provinceId: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="City ID">
                <Input
                  value={addressDraft.cityId}
                  onChange={e =>
                    setAddressDraft(prev => (prev ? { ...prev, cityId: e.target.value } : prev))
                  }
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                disabled={saving}
                className="h-9 bg-[#0c3cff] hover:bg-[#0934dc]"
                onClick={() => void saveAddressDraft()}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {addressDraft.id ? 'Update Address' : 'Save Address'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {/* Contacts */}
      <section className="space-y-4 rounded-xl border border-[#e4e9f4] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[#071759]">Contacts</h3>
            <p className="text-xs text-[#6374ab]">At least one contact is required.</p>
          </div>
          {!contactDraft ? (
            <Button
              type="button"
              className="h-9 bg-[#0c3cff] hover:bg-[#0934dc]"
              onClick={() => {
                setError(null)
                setContactDraft(emptyContact())
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Contact
            </Button>
          ) : null}
        </div>

        {contacts.length === 0 && !contactDraft ? (
          <div className="rounded-lg border border-dashed border-[#dce5f6] bg-[#f8faff] px-4 py-8 text-center text-sm text-[#6374ab]">
            No contacts added yet. Click Add Contact to open the form.
          </div>
        ) : null}

        {contacts
          .filter(item => item.id !== contactDraft?.id)
          .map(item => (
          <div
            key={item.id}
            className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[#e8edf5] px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-[#071759]">
                {item.name}{' '}
                <span className="text-xs font-medium text-[#6374ab]">({item.contactType})</span>
              </p>
              <p className="mt-0.5 text-xs text-[#6374ab]">
                {item.relationship} · {item.mobileNumber}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-[#0c3cff]"
                onClick={() => startEditContact(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-red-600"
                onClick={() => removeContact(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ))}

        {contactDraft ? (
          <div className="rounded-xl border border-[#0c3cff] bg-[#f8faff] p-4 ring-2 ring-[#dbe7ff]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#071759]">
                {contactDraft.id ? 'Edit Contact' : 'New Contact'}
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-[#6374ab]"
                onClick={() => setContactDraft(null)}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Contact Type">
                <select
                  value={contactDraft.contactType}
                  onChange={e =>
                    setContactDraft(prev =>
                      prev ? { ...prev, contactType: e.target.value as ContactType } : prev,
                    )
                  }
                  className="h-10 w-full rounded-md border border-[#dce5f6] bg-white px-3 text-sm"
                >
                  {CONTACT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Relationship">
                <Input
                  value={contactDraft.relationship}
                  onChange={e =>
                    setContactDraft(prev =>
                      prev ? { ...prev, relationship: e.target.value } : prev,
                    )
                  }
                />
              </Field>
              <Field label="Contact Name">
                <Input
                  value={contactDraft.name}
                  onChange={e =>
                    setContactDraft(prev => (prev ? { ...prev, name: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Mobile Number">
                <div className="flex h-10 items-center gap-2 rounded-md border border-[#dce5f6] bg-white px-3">
                  <span className="text-xs font-semibold text-[#19316f]">+92</span>
                  <Input
                    value={contactDraft.mobileNumber}
                    onChange={e =>
                      setContactDraft(prev =>
                        prev
                          ? {
                              ...prev,
                              mobileNumber: e.target.value.replace(/\D/g, '').slice(0, 11),
                            }
                          : prev,
                      )
                    }
                    className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </Field>
              <Field label="CNIC / Identity" required={false}>
                <Input
                  value={contactDraft.identityDocumentNumber ?? ''}
                  onChange={e =>
                    setContactDraft(prev =>
                      prev ? { ...prev, identityDocumentNumber: e.target.value } : prev,
                    )
                  }
                />
              </Field>
              <Field label="Occupation" required={false}>
                <Input
                  value={contactDraft.occupation ?? ''}
                  onChange={e =>
                    setContactDraft(prev =>
                      prev ? { ...prev, occupation: e.target.value } : prev,
                    )
                  }
                />
              </Field>
              <Field label="Telephone" required={false}>
                <Input
                  value={contactDraft.telephone ?? ''}
                  onChange={e =>
                    setContactDraft(prev =>
                      prev ? { ...prev, telephone: e.target.value } : prev,
                    )
                  }
                />
              </Field>
              <Field label="Email" required={false}>
                <Input
                  type="email"
                  value={contactDraft.email ?? ''}
                  onChange={e =>
                    setContactDraft(prev => (prev ? { ...prev, email: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Address Line" required={false}>
                <Input
                  value={contactDraft.addressLine ?? ''}
                  onChange={e =>
                    setContactDraft(prev =>
                      prev ? { ...prev, addressLine: e.target.value } : prev,
                    )
                  }
                />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                disabled={saving}
                className="h-9 bg-[#0c3cff] hover:bg-[#0934dc]"
                onClick={() => void saveContactDraft()}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {contactDraft.id ? 'Update Contact' : 'Save Contact'}
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <Button type="button" variant="outline" className="h-11 border-[#dce5f6]" onClick={onBack}>
            Previous
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleContinue()}
          className="h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  required = true,
}: {
  label: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#334155]">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
    </div>
  )
}
