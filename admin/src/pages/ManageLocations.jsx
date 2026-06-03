import { useState, useEffect } from "react";
import styled from "styled-components";
import { api } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

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

const LocationName = styled.span`
  font-weight: 600;
  color: #1a1c1c;
`

const LocationAddress = styled.div`
  font-size: 12px;
  color: #5f5e5e;
  margin-top: 4px;
`

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$active ? "#dcfce7" : "#fee2e2"};
  color: ${props => props.$active ? "#16a34a" : "#dc2626"};
`

const Coordinates = styled.div`
  font-family: monospace;
  font-size: 12px;
  color: #775a19;
`

const OpeningHours = styled.span`
  font-size: 12px;
  color: #5f5e5e;
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
  max-width: 520px;
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
  
  @media (max-width: 480px) {
    gap: 10px;
  }
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

const emptyForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  lat: "",
  lng: "",
  phone: "",
  opening_hours: "",
  is_active: true,
};

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editLocation, setEditLocation] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, locationId: null });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/locations");
      setLocations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editLocation) {
        await api.put(`/locations/${editLocation.id}`, form);
      } else {
        await api.post("/locations", form);
      }
      setShowModal(false);
      setEditLocation(null);
      setForm(emptyForm);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving location");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (location) => {
    setEditLocation(location);
    setForm({
      name: location.name,
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      lat: location.lat || "",
      lng: location.lng || "",
      phone: location.phone || "",
      opening_hours: location.opening_hours || "",
      is_active: location.is_active,
    });
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/locations/${confirmModal.locationId}`);
      setConfirmModal({ show: false, locationId: null });
      fetchLocations();
    } catch (err) {
      alert("Error deleting location");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditLocation(null);
    setForm(emptyForm);
  };

  return (
    <PageWrapper>
      <TopBar>
        <PageTitle>Manage Locations</PageTitle>
        <AddButton onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Location
        </AddButton>
      </TopBar>

      <TableWrapper>
        {loading ? (
          <LoadingMsg>Loading locations...</LoadingMsg>
        ) : locations.length === 0 ? (
          <EmptyState>No locations found. Click "Add Location" to create one.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Location</Th>
                <Th>City</Th>
                <Th>State</Th>
                <Th>Phone</Th>
                <Th>Hours</Th>
                <Th>Status</Th>
                <Th style={{ width: 60 }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => (
                <tr key={location.id}>
                  <Td>
                    <LocationName>{location.name}</LocationName>
                    <LocationAddress>{location.address}</LocationAddress>
                  </Td>
                  <Td>{location.city}</Td>
                  <Td>{location.state}</Td>
                  <Td>{location.phone || "—"}</Td>
                  <Td><OpeningHours>{location.opening_hours || "—"}</OpeningHours></Td>
                  <Td>
                    <StatusBadge $active={location.is_active}>
                      {location.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </Td>
                  <ActionCell>
                    <ThreeDotsButton onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === location.id ? null : location.id);
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="5" r="1" fill="currentColor" />
                        <circle cx="12" cy="19" r="1" fill="currentColor" />
                      </svg>
                    </ThreeDotsButton>
                    {openDropdown === location.id && (
                      <DropdownMenu>
                        <DropdownItem onClick={() => handleEdit(location)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                            <path d="M4 20h16" />
                          </svg>
                          Edit
                        </DropdownItem>
                        <DropdownItem className="delete" onClick={() => setConfirmModal({ show: true, locationId: location.id })}>
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
        )}
      </TableWrapper>

      {/* Modern Modal */}
      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseModalButton>
            <ModalTitle>{editLocation ? "Edit Location" : "Add New Location"}</ModalTitle>
            
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Name</Label>
                <Input name="name" placeholder="e.g. Surat Airport" value={form.name} onChange={handleChange} required />
              </FormGroup>
              
              <FormGroup>
                <Label>Address</Label>
                <Input name="address" placeholder="Full address" value={form.address} onChange={handleChange} required />
              </FormGroup>
              
              <TwoCol>
                <FormGroup>
                  <Label>City</Label>
                  <Input name="city" placeholder="e.g. Surat" value={form.city} onChange={handleChange} required />
                </FormGroup>
                <FormGroup>
                  <Label>State</Label>
                  <Input name="state" placeholder="e.g. Gujarat" value={form.state} onChange={handleChange} required />
                </FormGroup>
              </TwoCol>
              
              <TwoCol>
                <FormGroup>
                  <Label>Latitude</Label>
                  <Input name="lat" placeholder="e.g. 21.1144" value={form.lat} onChange={handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label>Longitude</Label>
                  <Input name="lng" placeholder="e.g. 72.7418" value={form.lng} onChange={handleChange} />
                </FormGroup>
              </TwoCol>
              
              <TwoCol>
                <FormGroup>
                  <Label>Phone</Label>
                  <Input name="phone" placeholder="Contact number" value={form.phone} onChange={handleChange} />
                </FormGroup>
                <FormGroup>
                  <Label>Opening Hours</Label>
                  <Input name="opening_hours" placeholder="e.g. 9am - 9pm" value={form.opening_hours} onChange={handleChange} />
                </FormGroup>
              </TwoCol>
              
              <ModalButtons>
                <CancelButton type="button" onClick={handleCloseModal}>Cancel</CancelButton>
                <SaveButton type="submit" disabled={saving}>
                  {saving ? "Saving..." : (editLocation ? "Save Changes" : "Create Location")}
                </SaveButton>
              </ModalButtons>
            </form>
          </ModalCard>
        </Modal>
      )}

      {confirmModal.show && (
        <ConfirmModal
          title="Delete Location"
          message="Are you sure you want to delete this location? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal({ show: false, locationId: null })}
        />
      )}
    </PageWrapper>
  );
};

export default ManageLocations;