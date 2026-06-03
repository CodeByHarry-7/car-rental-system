import styled from 'styled-components'

const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-2xl);
`

const PageButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-md);
  border: 1px solid ${props => props.$active ? 'var(--color-primary)' : 'var(--color-border)'};
  background: ${props => props.$active ? 'var(--color-primary)' : 'var(--color-white)'};
  color: ${props => props.$active ? 'white' : 'var(--color-text)'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  font-size: var(--font-size-sm);
  font-weight: ${props => props.$active ? '500' : '400'};
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: ${props => props.$active ? 'white' : 'var(--color-primary)'};
  }
`

const NavButton = styled.button`
  padding: 8px var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-white);
  color: var(--color-text);
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  font-size: var(--font-size-sm);
  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`

const Pagination = ({ page, totalPages, setPage }) => {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const handlePageClick = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <PaginationWrapper>
      <NavButton
        disabled={page === 1}
        onClick={() => handlePageClick(page - 1)}
      >
        Previous
      </NavButton>

      {pages.map(p => (
        <PageButton
          key={p}
          $active={p === page}
          onClick={() => handlePageClick(p)}
        >
          {p}
        </PageButton>
      ))}

      <NavButton
        disabled={page === totalPages}
        onClick={() => handlePageClick(page + 1)}
      >
        Next
      </NavButton>
    </PaginationWrapper>
  )
}

export default Pagination