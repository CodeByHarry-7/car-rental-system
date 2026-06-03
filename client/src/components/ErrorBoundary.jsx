import React from 'react'
import styled from 'styled-components'

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: var(--spacing-lg);
`

const ErrorCard = styled.div`
  background: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-2xl);
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  text-align: center;
`

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
`

const ErrorTitle = styled.h1`
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: var(--spacing-sm);
`

const ErrorMessage = styled.p`
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
  line-height: 1.6;
`

const ErrorDetails = styled.div`
  background: var(--color-bg);
  border-left: 4px solid var(--color-error);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  text-align: left;
  max-height: 200px;
  overflow-y: auto;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-family: monospace;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
`

const Button = styled.button`
  padding: 12px 32px;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`

const PrimaryButton = styled(Button)`
  background: var(--color-primary);
  color: white;

  &:hover {
    background: var(--color-primary-dark);
  }
`

const SecondaryButton = styled(Button)`
  background: var(--color-border);
  color: var(--color-text);

  &:hover {
    background: var(--color-text-muted);
    color: white;
  }
`

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorTitle>Oops! Something went wrong</ErrorTitle>
            <ErrorMessage>
              We're sorry for the inconvenience. An unexpected error occurred and we've been notified.
              <br />
              Please try again or go back home.
            </ErrorMessage>

            {this.state.error && (
              <ErrorDetails>
                <strong>Error:</strong> {this.state.error.toString()}
                {this.state.errorInfo && (
                  <>
                    <br />
                    <br />
                    <strong>Stack Trace:</strong>
                    <br />
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </ErrorDetails>
            )}

            <ButtonGroup>
              <PrimaryButton onClick={this.handleReset}>
                Go Home
              </PrimaryButton>
              <SecondaryButton onClick={this.handleReload}>
                Try Again
              </SecondaryButton>
            </ButtonGroup>
          </ErrorCard>
        </ErrorContainer>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary