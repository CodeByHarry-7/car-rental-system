import styled from 'styled-components'

const Overlay = styled.div`
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
  z-index: 2000;
  animation: fadeIn 0.2s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`

const Card = styled.div`
  background: white;
  border-radius: 20px;
  padding: 28px 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
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
    max-width: 340px;
  }
`

const Title = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 10px;
  font-family: 'Montserrat', sans-serif;
  
  @media (max-width: 480px) {
    font-size: 18px;
  }
`

const Message = styled.p`
  font-size: 14px;
  color: #5f5e5e;
  margin-bottom: 28px;
  line-height: 1.5;
  
  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 24px;
  }
`

const Buttons = styled.div`
  display: flex;
  gap: 12px;
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  color: #5f5e5e;
  border: 1px solid #e2e2e2;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e8e8e8;
    border-color: #c5a059;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
  }
`

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  background: #ba1a1a;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover {
    background: #dc2626;
    transform: scale(1.01);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    font-size: 13px;
  }
`

const ConfirmModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <Overlay onClick={onCancel}>
      <Card onClick={e => e.stopPropagation()}>
        <Title>{title || 'Confirm Action'}</Title>
        <Message>{message || 'Are you sure you want to proceed?'}</Message>
        <Buttons>
          <CancelButton onClick={onCancel}>Cancel</CancelButton>
          <ConfirmButton onClick={onConfirm}>Confirm</ConfirmButton>
        </Buttons>
      </Card>
    </Overlay>
  )
}

export default ConfirmModal