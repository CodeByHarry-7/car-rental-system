import { useState, useEffect } from 'react'
import styled from 'styled-components'
import toast from 'react-hot-toast'
import { useAuth, api } from '../context/AuthContext'
import { ProfileSkeleton } from '../components/SkeletonLoaders'

const PageWrapper = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 24px;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
  }
`

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 24px;
  
  @media (max-width: 768px) {
    font-size: 24px;
    margin-bottom: 20px;
  }
`

const TabContainer = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e2e2;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 768px) {
    gap: 0;
  }
`

const Tab = styled.button`
  padding: 12px 20px;
  background: none;
  border: none;
  color: ${props => props.$active ? '#775a19' : '#5f5e5e'};
  font-size: 14px;
  font-weight: ${props => props.$active ? '600' : '400'};
  cursor: pointer;
  border-bottom: 3px solid ${props => props.$active ? '#775a19' : 'transparent'};
  margin-bottom: -2px;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #775a19;
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 13px;
  }
`

const Card = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e2e2;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 16px;
    padding-bottom: 10px;
  }
`

const FormGroup = styled.div`
  margin-bottom: 20px;
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1a1c1c;
  margin-bottom: 8px;
`

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  font-size: 14px;
  color: #1a1c1c;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }

  &:disabled {
    background: #f3f3f3;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 11px 14px;
    font-size: 14px;
  }
`

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`

const Button = styled.button`
  padding: 12px 24px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #5d4201;
    transform: scale(1.01);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: #5f5e5e;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 11px 20px;
    font-size: 13px;
  }
`

const DangerButton = styled(Button)`
  background: #ba1a1a;

  &:hover {
    background: #dc2626;
  }
`

const UploadBox = styled.div`
  border: 2px dashed #e2e2e2;
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;

  &:hover {
    border-color: #775a19;
    background: rgba(119, 90, 25, 0.03);
  }
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`

const UploadIcon = styled.div`
  font-size: 36px;
  margin-bottom: 12px;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`

const UploadText = styled.p`
  font-size: 13px;
  color: #5f5e5e;
  margin: 0;
`

const UploadHint = styled.p`
  font-size: 11px;
  color: #5f5e5e;
  margin-top: 8px;
`

const DocumentPreview = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 12px;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
`

const DocThumb = styled.img`
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  
  @media (max-width: 768px) {
    width: 100px;
    height: 70px;
  }
`

const DocInfo = styled.div`
  flex: 1;
  
  @media (max-width: 768px) {
    text-align: center;
  }
`

const DocName = styled.p`
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #1a1c1c;
  font-size: 14px;
`

const DocSize = styled.p`
  font-size: 11px;
  color: #5f5e5e;
  margin: 0;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`

const InfoItem = styled.div`
  padding: 20px;
  background: #f8f8f8;
  border-radius: 12px;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`

const InfoLabel = styled.p`
  font-size: 11px;
  color: #5f5e5e;
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const InfoValue = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: #1a1c1c;
  margin: 0;
  word-break: break-word;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`

const HiddenInput = styled.input`
  display: none;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SettingsGroup = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
  }
`

const Divider = styled.div`
  height: 1px;
  background: #e2e2e2;
  margin: 24px 0 20px;
  
  @media (max-width: 768px) {
    margin: 20px 0 16px;
  }
`

// Confirmation Modal
const ConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const ConfirmModal = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px;
  width: 90%;
  max-width: 360px;
  text-align: center;
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
  
  @media (max-width: 480px) {
    padding: 24px 20px;
  }
`

const ConfirmTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 12px;
  font-family: 'Montserrat', sans-serif;
`

const ConfirmMessage = styled.p`
  font-size: 14px;
  color: #5f5e5e;
  margin-bottom: 24px;
  line-height: 1.5;
`

const ConfirmButtons = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`

const ConfirmCancel = styled.button`
  padding: 10px 24px;
  background: #f0f0f0;
  color: #666;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e0e0e0;
  }
`

const ConfirmAction = styled.button`
  padding: 10px 24px;
  background: ${props => props.$danger ? '#ba1a1a' : '#775a19'};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$danger ? '#dc2626' : '#5d4201'};
    transform: scale(1.02);
  }
`

const Profile = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('info')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  })
  const [saving, setSaving] = useState(false)
  const [licenceNo, setLicenceNo] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Confirmation modal states
  const [showDeleteLicenceConfirm, setShowDeleteLicenceConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      })
      setLoading(false)
    }
  }, [user])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await api.put('/auth/me', formData)
      toast.success('Profile updated successfully!')
      setEditMode(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLicenceUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!licenceNo) {
      toast.error('Please enter your licence number first')
      return
    }

    setUploading(true)

    try {
      const formDataObj = new FormData()
      formDataObj.append('licence', file)
      formDataObj.append('licence_no', licenceNo)

      await api.post('/auth/upload-licence', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Licence uploaded successfully! ✓')
      setLicenceNo('')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload licence')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteLicence = async () => {
    try {
      await api.delete('/auth/licence')
      toast.success('Licence deleted')
      setShowDeleteLicenceConfirm(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error('Failed to delete licence')
      setShowDeleteLicenceConfirm(false)
    }
  }

  const handleLogout = async () => {
    logout()
    toast.success('Logged out successfully')
    setShowLogoutConfirm(false)
  }

  if (loading) {
    return <ProfileSkeleton />
  }

  if (!user) {
    return <PageWrapper>Please log in to view your profile</PageWrapper>
  }

  return (
    <>
      <PageWrapper>
        <PageTitle>My Profile</PageTitle>

        <TabContainer>
          <Tab $active={activeTab === 'info'} onClick={() => setActiveTab('info')}>
            👤 Personal Info
          </Tab>
          <Tab $active={activeTab === 'documents'} onClick={() => setActiveTab('documents')}>
            📄 Documents
          </Tab>
          <Tab $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
            ⚙️ Settings
          </Tab>
        </TabContainer>

        {/* Personal Info Tab */}
        {activeTab === 'info' && (
          <Card>
            <SectionTitle>Personal Information</SectionTitle>

            <InfoGrid>
              <InfoItem>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{user.email}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Member Since</InfoLabel>
                <InfoValue>{new Date(user.created_at).toLocaleDateString()}</InfoValue>
              </InfoItem>
            </InfoGrid>

            {!editMode ? (
              <>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Full Name</InfoLabel>
                    <InfoValue>{user.name || 'Not provided'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Phone</InfoLabel>
                    <InfoValue>{user.phone || 'Not provided'}</InfoValue>
                  </InfoItem>
                </InfoGrid>
                <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
              </>
            ) : (
              <>
                <FormRow>
                  <FormGroup>
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </FormGroup>
                </FormRow>
                <ButtonGroup>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    style={{ background: '#5f5e5e' }}
                    onClick={() => {
                      setEditMode(false)
                      setFormData({ name: user.name || '', phone: user.phone || '' })
                    }}
                  >
                    Cancel
                  </Button>
                </ButtonGroup>
              </>
            )}
          </Card>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <Card>
            <SectionTitle>Driving Licence</SectionTitle>

            {user.licence_image ? (
              <DocumentPreview>
                <DocThumb src={user.licence_image} alt="Licence" />
                <DocInfo>
                  <DocName>Licence #{user.licence_no}</DocName>
                  <DocSize>✓ Verified</DocSize>
                </DocInfo>
                <DangerButton onClick={() => setShowDeleteLicenceConfirm(true)}>Delete</DangerButton>
              </DocumentPreview>
            ) : (
              <>
                <FormGroup>
                  <Label>Licence Number</Label>
                  <Input
                    type="text"
                    placeholder="e.g., GJ05 20190012345"
                    value={licenceNo}
                    onChange={e => setLicenceNo(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Upload Licence Image</Label>
                  <UploadBox
                    onClick={() => document.getElementById('licence-input').click()}
                  >
                    <UploadIcon>📸</UploadIcon>
                    <UploadText>Click to upload or drag and drop</UploadText>
                    <UploadHint>PNG, JPG up to 5MB</UploadHint>
                  </UploadBox>
                  <HiddenInput
                    id="licence-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLicenceUpload}
                  />
                </FormGroup>

                <Button onClick={() => document.getElementById('licence-input').click()} disabled={uploading || !licenceNo}>
                  {uploading ? 'Uploading...' : 'Upload Licence'}
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Card>
            <SectionTitle>Account Settings</SectionTitle>

            <SettingsGroup>
              <Label>Account Security</Label>
              <Button style={{ background: '#faad14' }}>Change Password</Button>
            </SettingsGroup>

            <SettingsGroup>
              <Label>Session</Label>
              <DangerButton onClick={() => setShowLogoutConfirm(true)}>Logout</DangerButton>
            </SettingsGroup>

            <Divider />

            <SettingsGroup>
              <Label style={{ color: '#5f5e5e', fontSize: '12px' }}>Account ID: {user.id}</Label>
              <Label style={{ color: '#5f5e5e', fontSize: '11px', marginTop: '4px' }}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Label>
            </SettingsGroup>
          </Card>
        )}
      </PageWrapper>

      {/* Delete Licence Confirmation Modal */}
      {showDeleteLicenceConfirm && (
        <ConfirmOverlay onClick={() => setShowDeleteLicenceConfirm(false)}>
          <ConfirmModal onClick={e => e.stopPropagation()}>
            <ConfirmTitle>Delete Licence?</ConfirmTitle>
            <ConfirmMessage>
              You won't be able to book cars without a valid licence. Are you sure?
            </ConfirmMessage>
            <ConfirmButtons>
              <ConfirmCancel onClick={() => setShowDeleteLicenceConfirm(false)}>
                Cancel
              </ConfirmCancel>
              <ConfirmAction $danger onClick={handleDeleteLicence}>
                Delete
              </ConfirmAction>
            </ConfirmButtons>
          </ConfirmModal>
        </ConfirmOverlay>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <ConfirmOverlay onClick={() => setShowLogoutConfirm(false)}>
          <ConfirmModal onClick={e => e.stopPropagation()}>
            <ConfirmTitle>Logout?</ConfirmTitle>
            <ConfirmMessage>
              Are you sure you want to logout from your account?
            </ConfirmMessage>
            <ConfirmButtons>
              <ConfirmCancel onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </ConfirmCancel>
              <ConfirmAction $danger onClick={handleLogout}>
                Logout
              </ConfirmAction>
            </ConfirmButtons>
          </ConfirmModal>
        </ConfirmOverlay>
      )}
    </>
  )
}

export default Profile