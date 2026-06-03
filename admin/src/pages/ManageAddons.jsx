import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { api } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";

const PageWrapper = styled.div`
  width: 100%;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a1c1c;
  margin-bottom: 24px;
  font-family: 'Montserrat', sans-serif;
  padding-top: 0;
  
  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
`;

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
`;

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
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
`;

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
`;

const Td = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e2e2e2;
  font-size: 14px;
  color: #1a1c1c;
  font-family: 'Inter', sans-serif;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$active ? "#dcfce7" : "#fee2e2"};
  color: ${props => props.$active ? "#16a34a" : "#dc2626"};
`;

// Dropdown Menu Components
const ActionCell = styled.td`
  padding: 16px;
  border-bottom: 1px solid #e2e2e2;
  position: relative;
`;

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
`;

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
`;

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
`;

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
`;

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
`;

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
`;

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
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4e4639;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

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
`;

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
`;

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
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

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
`;

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
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  background: white;
  border-radius: 16px;
  color: #aaa;
  font-size: 14px;
`;

const emptyForm = {
  name: "",
  description: "",
  price: "",
  is_active: "true",
};

const ManageAddons = () => {
  const [addons, setAddons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editAddon, setEditAddon] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, addonId: null });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchAddons();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAddons = async () => {
    const res = await api.get("/addons");
    setAddons(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editAddon) {
        await api.put(`/addons/${editAddon.id}`, form);
      } else {
        await api.post("/addons", form);
      }
      setShowModal(false);
      setEditAddon(null);
      setForm(emptyForm);
      fetchAddons();
    } catch (err) {
      alert(err.response?.data?.message || "Error saving addon");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (addon) => {
    setEditAddon(addon);
    setForm({
      name: addon.name,
      description: addon.description || "",
      price: addon.price,
      is_active: addon.is_active ? "true" : "false",
    });
    setShowModal(true);
    setOpenDropdown(null);
  };

  const handleDeleteClick = (addonId) => {
    setConfirmModal({ show: true, addonId });
    setOpenDropdown(null);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/addons/${confirmModal.addonId}`);
      setConfirmModal({ show: false, addonId: null });
      fetchAddons();
    } catch (err) {
      alert("Error deleting addon");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditAddon(null);
    setForm(emptyForm);
  };

  return (
    <PageWrapper>
      <TopBar>
        <PageTitle>Manage Add-ons</PageTitle>
        <AddButton onClick={() => setShowModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Addon
        </AddButton>
      </TopBar>

      {addons.length === 0 ? (
        <EmptyState>No add-ons found. Click "Add Addon" to create one.</EmptyState>
      ) : (
        <TableWrapper>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Description</Th>
                <Th>Price</Th>
                <Th>Status</Th>
                <Th style={{ width: 60 }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon) => (
                <tr key={addon.id}>
                  <Td style={{ fontWeight: 500 }}>{addon.name}</Td>
                  <Td>{addon.description || "—"}</Td>
                  <Td style={{ color: "#775a19", fontWeight: 600 }}>₹{addon.price}</Td>
                  <Td>
                    <StatusBadge $active={addon.is_active}>
                      {addon.is_active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </Td>
                  <ActionCell ref={openDropdown === addon.id ? dropdownRef : null}>
                    <ThreeDotsButton onClick={() => setOpenDropdown(openDropdown === addon.id ? null : addon.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="5" r="1" fill="currentColor" />
                        <circle cx="12" cy="19" r="1" fill="currentColor" />
                      </svg>
                    </ThreeDotsButton>
                    {openDropdown === addon.id && (
                      <DropdownMenu>
                        <DropdownItem onClick={() => handleEdit(addon)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                            <path d="M4 20h16" />
                          </svg>
                          Edit
                        </DropdownItem>
                        <DropdownItem className="delete" onClick={() => handleDeleteClick(addon.id)}>
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
        <Modal onClick={handleCloseModal}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <CloseModalButton onClick={handleCloseModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </CloseModalButton>
            <ModalTitle>{editAddon ? "Edit Addon" : "Add New Addon"}</ModalTitle>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Name</Label>
                <Input 
                  name="name" 
                  placeholder="e.g., Child Seat" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                />
              </FormGroup>
              <FormGroup>
                <Label>Description</Label>
                <Textarea 
                  name="description" 
                  placeholder="Short description..." 
                  value={form.description} 
                  onChange={handleChange} 
                />
              </FormGroup>
              <FormGroup>
                <Label>Price (₹)</Label>
                <Input 
                  type="number" 
                  name="price" 
                  placeholder="e.g., 200" 
                  value={form.price} 
                  onChange={handleChange} 
                  required 
                />
              </FormGroup>
              <FormGroup>
                <Label>Status</Label>
                <Select name="is_active" value={form.is_active} onChange={handleChange}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </FormGroup>
              <ModalButtons>
                <CancelButton type="button" onClick={handleCloseModal}>Cancel</CancelButton>
                <SaveButton type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Addon"}
                </SaveButton>
              </ModalButtons>
            </form>
          </ModalCard>
        </Modal>
      )}

      {confirmModal.show && (
        <ConfirmModal
          title="Delete Addon"
          message="Are you sure you want to delete this addon? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmModal({ show: false, addonId: null })}
        />
      )}
    </PageWrapper>
  );
};

export default ManageAddons;