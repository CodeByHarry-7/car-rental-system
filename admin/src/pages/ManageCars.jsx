import { useState, useEffect } from "react";
import styled from "styled-components";
import { api } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import CarImages from "../components/CarImages";

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
  min-width: 800px;
`

const Th = styled.th`
  text-align: left;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #5f5e5e;
  padding: 16px;
  background: #f8f8f8;
  border-bottom: 1px solid #e2e2e2;
  font-weight: 600;
`

const Td = styled.td`
  padding: 16px;
  font-size: 14px;
  color: #1a1c1c;
  border-bottom: 1px solid #e2e2e2;
  font-family: 'Inter', sans-serif;
  vertical-align: middle;
`

const CarName = styled.div`
  font-weight: 600;
  color: #1a1c1c;
`

const CarYear = styled.span`
  font-size: 12px;
  color: #5f5e5e;
  font-weight: normal;
`

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'available': return '#dcfce7';
      case 'on_rent': return '#fef3c7';
      case 'maintenance': return '#fee2e2';
      default: return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'available': return '#16a34a';
      case 'on_rent': return '#d97706';
      case 'maintenance': return '#dc2626';
      default: return '#5f5e5e';
    }
  }};
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
  min-width: 150px;
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

const LoadingMsg = styled.div`
  text-align: center;
  padding: 48px;
  color: #5f5e5e;
  font-size: 14px;
`

// ── Modal Components ─────────────────────────────────────────────────────────

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
`

const ModalCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 32px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
  
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  outline: none;
  resize: vertical;
  min-height: 80px;
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

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
`

const SaveButton = styled.button`
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

const CancelButton = styled.button`
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

const ImagesPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`

const ImagesPanelTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Montserrat', sans-serif;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #5f5e5e;
  padding: 4px 8px;
  border-radius: 8px;
  
  &:hover {
    background: #f0f0f0;
    color: #1a1c1c;
  }
`

const PricingPanel = styled(ImagesPanel)``

const PricingTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
`

const PTh = styled.th`
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #5f5e5e;
  padding: 8px 12px 8px 0;
  border-bottom: 1px solid #e2e2e2;
  font-weight: 600;
`

const PTd = styled.td`
  padding: 10px 12px 10px 0;
  font-size: 13px;
  color: #1a1c1c;
  border-bottom: 1px solid #e2e2e2;
`

const PricingForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 12px;
  align-items: end;
  background: #f8f8f8;
  padding: 16px;
  border-radius: 12px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`

const SmallInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  outline: none;
  
  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const SmallSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  outline: none;
  background: white;
  cursor: pointer;
`

const SmallLabel = styled.label`
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: #5f5e5e;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const AddPriceBtn = styled.button`
  padding: 8px 16px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  
  &:hover {
    background: #5d4201;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DeletePriceBtn = styled.button`
  padding: 4px 10px;
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`

const EmptyPricing = styled.p`
  color: #5f5e5e;
  font-size: 13px;
  padding: 16px 0;
`

// ── Constants (match FilterSidebar) ─────────────────────────────────────────

const CATEGORIES = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Sports', 'Electric']
const TRANSMISSIONS = ['Manual', 'Automatic']
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']
const PRICE_TYPES = ['hourly', 'daily', 'weekly']
const STATUSES = ['available', 'on_rent', 'maintenance']

// ── CarPricing Component ─────────────────────────────────────────────────────

const CarPricing = ({ carId }) => {
  const [slabs, setSlabs] = useState([])
  const [form, setForm] = useState({ type: 'daily', duration_value: '', price: '' })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    fetchSlabs()
  }, [carId])

  const fetchSlabs = async () => {
    try {
      const res = await api.get(`/pricing/${carId}`)
      setSlabs(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdd = async () => {
    if (!form.duration_value || !form.price) return
    setSaving(true)
    try {
      await api.post('/pricing', {
        car_id: carId,
        type: form.type,
        duration_value: parseInt(form.duration_value),
        price: parseFloat(form.price),
      })
      setForm({ type: 'daily', duration_value: '', price: '' })
      fetchSlabs()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add pricing')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/pricing/${id}`)
      fetchSlabs()
    } catch (err) {
      alert('Failed to delete pricing')
    }
  }

  const handleEditSave = async (id) => {
    try {
      await api.put(`/pricing/${id}`, {
        type: editForm.type,
        duration_value: parseInt(editForm.duration_value),
        price: parseFloat(editForm.price),
      })
      setEditingId(null)
      fetchSlabs()
    } catch (err) {
      alert('Failed to update pricing')
    }
  }

  return (
    <div>
      {slabs.length === 0 ? (
        <EmptyPricing>No pricing set yet. Add one below.</EmptyPricing>
      ) : (
        <PricingTable>
          <thead>
            <tr>
              <PTh>Type</PTh>
              <PTh>Duration Value</PTh>
              <PTh>Price (₹)</PTh>
              <PTh>Actions</PTh>
            </tr>
          </thead>
          <tbody>
            {slabs.map(slab => (
              <tr key={slab.id}>
                {editingId === slab.id ? (
                  <>
                    <PTd>
                      <SmallSelect
                        value={editForm.type}
                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                      >
                        {PRICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </SmallSelect>
                    </PTd>
                    <PTd>
                      <SmallInput
                        type="number"
                        value={editForm.duration_value}
                        onChange={e => setEditForm({ ...editForm, duration_value: e.target.value })}
                      />
                    </PTd>
                    <PTd>
                      <SmallInput
                        type="number"
                        value={editForm.price}
                        onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                      />
                    </PTd>
                    <PTd style={{ display: 'flex', gap: 6 }}>
                      <AddPriceBtn onClick={() => handleEditSave(slab.id)}>Save</AddPriceBtn>
                      <DeletePriceBtn onClick={() => setEditingId(null)}>Cancel</DeletePriceBtn>
                    </PTd>
                  </>
                ) : (
                  <>
                    <PTd style={{ textTransform: 'capitalize' }}>{slab.type}</PTd>
                    <PTd>{slab.duration_value}</PTd>
                    <PTd>₹{slab.price}</PTd>
                    <PTd style={{ display: 'flex', gap: 6 }}>
                      <AddPriceBtn
                        onClick={() => {
                          setEditingId(slab.id)
                          setEditForm({ type: slab.type, duration_value: slab.duration_value, price: slab.price })
                        }}
                      >
                        Edit
                      </AddPriceBtn>
                      <DeletePriceBtn onClick={() => handleDelete(slab.id)}>Delete</DeletePriceBtn>
                    </PTd>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </PricingTable>
      )}

      <PricingForm>
        <div>
          <SmallLabel>Type</SmallLabel>
          <SmallSelect
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            {PRICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </SmallSelect>
        </div>
        <div>
          <SmallLabel>Duration Value</SmallLabel>
          <SmallInput
            type="number"
            placeholder="e.g., 1"
            value={form.duration_value}
            onChange={e => setForm({ ...form, duration_value: e.target.value })}
          />
        </div>
        <div>
          <SmallLabel>Price (₹)</SmallLabel>
          <SmallInput
            type="number"
            placeholder="e.g., 1500"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <AddPriceBtn onClick={handleAdd} disabled={saving || !form.duration_value || !form.price}>
          {saving ? 'Adding...' : '+ Add'}
        </AddPriceBtn>
      </PricingForm>
    </div>
  )
}

// ── emptyForm ─────────────────────────────────────────────────────────────────

const emptyForm = {
  location_id: "",
  make: "",
  model: "",
  year: "",
  category: "",
  transmission: "",
  fuel_type: "",
  seats: "",
  status: "available",
  description: "",
}

// ── ManageCars Component ─────────────────────────────────────────────────────

const ManageCars = () => {
  const [cars, setCars] = useState([])
  const [locations, setLocations] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ show: false, carId: null })
  const [editCar, setEditCar] = useState(null)
  const [selectedCarId, setSelectedCarId] = useState(null)
  const [pricingCarId, setPricingCarId] = useState(null)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    fetchCars()
    fetchLocations()
  }, [])

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchCars = async () => {
    try {
      const res = await api.get("/cars")
      setCars(Array.isArray(res.data) ? res.data : res.data.cars || [])
    } catch (err) {
      console.error("Error fetching cars:", err)
    }
  }

  const fetchLocations = async () => {
    try {
      const res = await api.get("/locations")
      setLocations(Array.isArray(res.data) ? res.data : res.data.locations || [])
    } catch (err) {
      console.error("Error fetching locations:", err)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editCar) {
        await api.put(`/cars/${editCar.id}`, form)
      } else {
        await api.post("/cars", form)
      }
      setShowModal(false)
      setEditCar(null)
      setForm(emptyForm)
      fetchCars()
    } catch (err) {
      alert(err.response?.data?.message || "Error saving car")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (car) => {
    setEditCar(car)
    setForm({
      location_id: car.location_id,
      make: car.make,
      model: car.model,
      year: car.year,
      category: car.category,
      transmission: car.transmission,
      fuel_type: car.fuel_type,
      seats: car.seats,
      status: car.status || "available",
      description: car.description || "",
    })
    setShowModal(true)
    setOpenDropdown(null)
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/cars/${confirmModal.carId}`)
      setConfirmModal({ show: false, carId: null })
      fetchCars()
    } catch (err) {
      alert("Error deleting car")
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditCar(null)
    setForm(emptyForm)
  }

  const selectedCar = cars.find(c => c.id === selectedCarId)
  const pricingCar = cars.find(c => c.id === pricingCarId)

  const getStatusLabel = (status) => {
    const labels = {
      available: 'Available',
      on_rent: 'On Rent',
      maintenance: 'Maintenance'
    }
    return labels[status] || status
  }

  return (
    <PageWrapper>
      <TopBar>
        <PageTitle>Manage Cars</PageTitle>
        <AddButton onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Car
        </AddButton>
      </TopBar>

      <TableWrapper>
        {cars.length === 0 ? (
          <EmptyState>No cars found. Click "Add Car" to create one.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Car</Th>
                <Th>Category</Th>
                <Th>Transmission</Th>
                <Th>Fuel</Th>
                <Th>Seats</Th>
                <Th>Status</Th>
                <Th style={{ width: 60 }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <Td>
                    <CarName>{car.make} {car.model} <CarYear>({car.year})</CarYear></CarName>
                  </Td>
                  <Td>{car.category}</Td>
                  <Td>{car.transmission}</Td>
                  <Td>{car.fuel_type}</Td>
                  <Td>{car.seats}</Td>
                  <Td>
                    <StatusBadge $status={car.status}>
                      {getStatusLabel(car.status)}
                    </StatusBadge>
                  </Td>
                  <ActionCell>
                    <ThreeDotsButton onClick={(e) => {
                      e.stopPropagation()
                      setOpenDropdown(openDropdown === car.id ? null : car.id)
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="5" r="1" fill="currentColor" />
                        <circle cx="12" cy="19" r="1" fill="currentColor" />
                      </svg>
                    </ThreeDotsButton>
                    {openDropdown === car.id && (
                      <DropdownMenu>
                        <DropdownItem onClick={() => handleEdit(car)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                            <path d="M4 20h16" />
                          </svg>
                          Edit Car
                        </DropdownItem>
                        <DropdownItem onClick={() => {
                          setSelectedCarId(car.id)
                          setPricingCarId(null)
                          setOpenDropdown(null)
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Manage Images
                        </DropdownItem>
                        <DropdownItem onClick={() => {
                          setPricingCarId(car.id)
                          setSelectedCarId(null)
                          setOpenDropdown(null)
                        }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="2" />
                            <path d="M12 2v2M12 20v2M2 12h2M20 12h2" strokeWidth="2" />
                          </svg>
                          Manage Pricing
                        </DropdownItem>
                        <DropdownItem className="delete" onClick={() => setConfirmModal({ show: true, carId: car.id })}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" />
                            <path d="M9 3h6" />
                          </svg>
                          Delete Car
                        </DropdownItem>
                      </DropdownMenu>
                    )}
                  </ActionCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableWrapper>

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseModalButton>
            <ModalTitle>{editCar ? "Edit Car" : "Add New Car"}</ModalTitle>
            
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Location</Label>
                <Select name="location_id" value={form.location_id} onChange={handleChange} required>
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </Select>
              </FormGroup>
              
              <TwoCol>
                <FormGroup>
                  <Label>Make</Label>
                  <Input name="make" placeholder="e.g., Toyota" value={form.make} onChange={handleChange} required />
                </FormGroup>
                <FormGroup>
                  <Label>Model</Label>
                  <Input name="model" placeholder="e.g., Fortuner" value={form.model} onChange={handleChange} required />
                </FormGroup>
              </TwoCol>
              
              <TwoCol>
                <FormGroup>
                  <Label>Year</Label>
                  <Input type="number" name="year" placeholder="e.g., 2023" value={form.year} onChange={handleChange} required />
                </FormGroup>
                <FormGroup>
                  <Label>Seats</Label>
                  <Input type="number" name="seats" placeholder="e.g., 5" value={form.seats} onChange={handleChange} required />
                </FormGroup>
              </TwoCol>
              
              <TwoCol>
                <FormGroup>
                  <Label>Category</Label>
                  <Select name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select Category</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Transmission</Label>
                  <Select name="transmission" value={form.transmission} onChange={handleChange} required>
                    <option value="">Select Transmission</option>
                    {TRANSMISSIONS.map(trans => (
                      <option key={trans} value={trans}>{trans}</option>
                    ))}
                  </Select>
                </FormGroup>
              </TwoCol>
              
              <TwoCol>
                <FormGroup>
                  <Label>Fuel Type</Label>
                  <Select name="fuel_type" value={form.fuel_type} onChange={handleChange} required>
                    <option value="">Select Fuel Type</option>
                    {FUEL_TYPES.map(fuel => (
                      <option key={fuel} value={fuel}>{fuel}</option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Status</Label>
                  <Select name="status" value={form.status} onChange={handleChange} required>
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </Select>
                </FormGroup>
              </TwoCol>
              
              <FormGroup>
                <Label>Description</Label>
                <Textarea name="description" placeholder="Car description..." value={form.description} onChange={handleChange} />
              </FormGroup>
              
              <ModalButtons>
                <CancelButton type="button" onClick={handleCloseModal}>Cancel</CancelButton>
                <SaveButton type="submit" disabled={loading}>
                  {loading ? "Saving..." : (editCar ? "Save Changes" : "Create Car")}
                </SaveButton>
              </ModalButtons>
            </form>
          </ModalCard>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {confirmModal.show && (
        <ConfirmModal
          title="Delete Car"
          message="Are you sure you want to delete this car? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal({ show: false, carId: null })}
        />
      )}

      {/* Images Panel */}
      {selectedCarId && (
        <ImagesPanel>
          <ImagesPanelTitle>
            Manage Images — {selectedCar?.make} {selectedCar?.model}
            <CloseButton onClick={() => setSelectedCarId(null)}>✕</CloseButton>
          </ImagesPanelTitle>
          <CarImages carId={selectedCarId} />
        </ImagesPanel>
      )}

      {/* Pricing Panel */}
      {pricingCarId && (
        <PricingPanel>
          <ImagesPanelTitle>
            Manage Pricing — {pricingCar?.make} {pricingCar?.model}
            <CloseButton onClick={() => setPricingCarId(null)}>✕</CloseButton>
          </ImagesPanelTitle>
          <CarPricing carId={pricingCarId} />
        </PricingPanel>
      )}
    </PageWrapper>
  )
}

export default ManageCars