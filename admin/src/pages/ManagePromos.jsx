import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { api } from '../context/AuthContext'
import ConfirmModal from '../components/ConfirmModal'

// ── Styled Components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  width: 100%;
`

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a1c1c;
  margin-bottom: 24px;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
`

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
  
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`

const AddButton = styled.button`
  padding: 12px 24px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #5d4201;
    transform: scale(1.01);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 480px) {
    width: 100%;
    justify-content: center;
  }
`

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
`

const Th = styled.th`
  padding: 16px;
  text-align: left;
  background: #f8f8f8;
  color: #5f5e5e;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e2e2e2;
`

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e2e2e2;
  font-size: 14px;
  color: #1a1c1c;
  font-family: 'Inter', sans-serif;
`

const CodeBadge = styled.span`
  font-family: monospace;
  font-size: 13px;
  font-weight: 700;
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 8px;
  letter-spacing: 0.05em;
  color: #775a19;
  border: 1px solid #e2e2e2;
`

const ActiveBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$active ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.$active ? '#16a34a' : '#dc2626'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
    transform: scale(1.02);
  }
`

// Dropdown Menu Components
const ActionCell = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e2e2e2;
  position: relative;
`

const ThreeDotsButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f0f0f0;
  }
  
  svg {
    width: 20px;
    height: 20px;
    stroke: #5f5e5e;
  }
`

const DropdownMenu = styled.div`
  position: absolute;
  top: 45px;
  right: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 140px;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  color: #1a1c1c;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
  }
  
  &:first-child {
    border-bottom: 1px solid #e2e2e2;
  }
  
  svg {
    width: 16px;
    height: 16px;
    stroke: #5f5e5e;
  }
  
  &.delete {
    color: #dc2626;
    
    svg {
      stroke: #dc2626;
    }
    
    &:hover {
      background: #fee2e2;
    }
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: 16px;
  color: #aaa;
  font-size: 14px;
`

// Modern Modal Components
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ModalCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
  
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #e2e2e2;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c5a059;
    border-radius: 4px;
  }
  
  @media (max-width: 480px) {
    padding: 24px;
  }
`

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 480px) {
    font-size: 20px;
    margin-bottom: 20px;
  }
`

const CloseModalButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f0f0f0;
  }
  
  svg {
    width: 20px;
    height: 20px;
    stroke: #5f5e5e;
  }
`

const FormGroup = styled.div`
  margin-bottom: 20px;
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4e4639;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const Select = styled.select`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  outline: none;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`

const SaveBtn = styled.button`
  flex: 1;
  padding: 12px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #5d4201;
    transform: scale(1.01);
  }
  
  &:disabled {
    background: #c5a059;
    cursor: not-allowed;
  }
`

const CancelBtn = styled.button`
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  color: #5f5e5e;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e8e8e8;
    border-color: #c5a059;
  }
`

const ErrorMsg = styled.p`
  color: #ba1a1a;
  font-size: 13px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(186, 26, 26, 0.08);
  border-radius: 8px;
`

const LoadingMsg = styled.div`
  text-align: center;
  padding: 48px;
  color: #5f5e5e;
  font-size: 14px;
`

// ── helpers ───────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  code: '',
  discount_type: 'flat',
  discount_value: '',
  min_amount: '',
  max_uses: '',
  expiry: '',
  is_active: true,
}

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
}) : '—'

// ── component ─────────────────────────────────────────────────────────────────

const ManagePromos = () => {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ show: false, promoId: null })

  useEffect(() => {
    fetchPromos()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchPromos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/promos')
      setPromos(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (promo) => {
    setEditing(promo)
    setForm({
      code: promo.code,
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_amount: promo.min_amount || '',
      max_uses: promo.max_uses || '',
      expiry: promo.expiry ? promo.expiry.slice(0, 10) : '',
      is_active: promo.is_active,
    })
    setFormError(null)
    setShowModal(true)
    setOpenDropdown(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setFormError(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount_value) {
      setFormError('Code and discount value are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      if (editing) {
        const res = await api.put(`/admin/promos/${editing.id}`, form)
        setPromos(prev => prev.map(p => p.id === editing.id ? res.data : p))
      } else {
        const res = await api.post('/admin/promos', form)
        setPromos(prev => [res.data, ...prev])
      }
      closeModal()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save promo code.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/promos/${confirmModal.promoId}`)
      setPromos(prev => prev.filter(p => p.id !== confirmModal.promoId))
      setConfirmModal({ show: false, promoId: null })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete')
    }
  }

  const handleToggleActive = async (promo) => {
    try {
      const res = await api.put(`/admin/promos/${promo.id}`, {
        ...promo,
        is_active: !promo.is_active,
      })
      setPromos(prev => prev.map(p => p.id === promo.id ? res.data : p))
    } catch (err) {
      alert('Failed to update status')
    }
  }

  return (
    <PageWrapper>
      <TopBar>
        <PageTitle>Manage Promo Codes</PageTitle>
        <AddButton onClick={openAdd}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Promo Code
        </AddButton>
      </TopBar>

      {loading ? (
        <LoadingMsg>Loading promo codes...</LoadingMsg>
      ) : promos.length === 0 ? (
        <EmptyState>No promo codes yet. Click "Add Promo Code" to create one.</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Type</Th>
                <Th>Discount</Th>
                <Th>Min Amount</Th>
                <Th>Uses</Th>
                <Th>Expiry</Th>
                <Th>Status</Th>
                <Th style={{ width: 60 }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {promos.map(promo => (
                <tr key={promo.id}>
                  <Td><CodeBadge>{promo.code}</CodeBadge></Td>
                  <Td style={{ textTransform: 'capitalize' }}>{promo.discount_type}</Td>
                  <Td style={{ color: '#775a19', fontWeight: 600 }}>
                    {promo.discount_type === 'flat'
                      ? `₹${promo.discount_value}`
                      : `${promo.discount_value}%`}
                  </Td>
                  <Td>{promo.min_amount ? `₹${promo.min_amount}` : '—'}</Td>
                  <Td>
                    {promo.used_count || 0}
                    {promo.max_uses ? ` / ${promo.max_uses}` : ' / ∞'}
                  </Td>
                  <Td>{formatDate(promo.expiry)}</Td>
                  <Td>
                    <ActiveBadge
                      $active={promo.is_active}
                      onClick={() => handleToggleActive(promo)}
                    >
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </ActiveBadge>
                  </Td>
                  <ActionCell>
                    <ThreeDotsButton onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdown(openDropdown === promo.id ? null : promo.id)
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="5" r="1" fill="currentColor" />
                        <circle cx="12" cy="19" r="1" fill="currentColor" />
                      </svg>
                    </ThreeDotsButton>
                    {openDropdown === promo.id && (
                      <DropdownMenu>
                        <DropdownItem onClick={() => openEdit(promo)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                            <path d="M4 20h16" />
                          </svg>
                          Edit
                        </DropdownItem>
                        <DropdownItem className="delete" onClick={() => setConfirmModal({ show: true, promoId: promo.id })}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
                            <path d="M9 3h6" />
                          </svg>
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    )}
                  </ActionCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrapper>
      )}

      {/* Modern Modal */}
      {showModal && (
        <Modal onClick={closeModal}>
          <ModalCard onClick={e => e.stopPropagation()}>
            <CloseModalButton onClick={closeModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseModalButton>
            <ModalTitle>{editing ? 'Edit Promo Code' : 'Add New Promo Code'}</ModalTitle>

            <FormGroup>
              <Label>Code</Label>
              <Input
                name="code"
                value={form.code}
                onChange={handleChange}
                placeholder="e.g., SAVE200"
                style={{ textTransform: 'uppercase' }}
              />
            </FormGroup>

            <TwoCol>
              <FormGroup>
                <Label>Discount Type</Label>
                <Select name="discount_type" value={form.discount_type} onChange={handleChange}>
                  <option value="flat">Flat (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Discount Value</Label>
                <Input
                  name="discount_value"
                  type="number"
                  value={form.discount_value}
                  onChange={handleChange}
                  placeholder={form.discount_type === 'flat' ? '200' : '10'}
                />
              </FormGroup>
            </TwoCol>

            <TwoCol>
              <FormGroup>
                <Label>Min Amount (₹)</Label>
                <Input
                  name="min_amount"
                  type="number"
                  value={form.min_amount}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </FormGroup>
              <FormGroup>
                <Label>Max Uses</Label>
                <Input
                  name="max_uses"
                  type="number"
                  value={form.max_uses}
                  onChange={handleChange}
                  placeholder="Unlimited"
                />
              </FormGroup>
            </TwoCol>

            <FormGroup>
              <Label>Expiry Date</Label>
              <Input
                name="expiry"
                type="date"
                value={form.expiry}
                onChange={handleChange}
              />
            </FormGroup>

            <FormGroup style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <Label htmlFor="is_active" style={{ margin: 0, cursor: 'pointer' }}>
                Active (visible to users)
              </Label>
            </FormGroup>

            {formError && <ErrorMsg>{formError}</ErrorMsg>}

            <ModalActions>
              <CancelBtn onClick={closeModal}>Cancel</CancelBtn>
              <SaveBtn onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Promo'}
              </SaveBtn>
            </ModalActions>
          </ModalCard>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {confirmModal.show && (
        <ConfirmModal
          title="Delete Promo Code"
          message="Are you sure you want to delete this promo code? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal({ show: false, promoId: null })}
        />
      )}
    </PageWrapper>
  )
}

export default ManagePromos