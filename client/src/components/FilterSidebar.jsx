import styled from 'styled-components'

const SidebarWrapper = styled.aside`
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-radius: 20px;
  padding: 24px;
  height: fit-content;
  position: sticky;
  top: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(26, 28, 28, 0.05);
  
  @media (max-width: 968px) {
    width: 100%;
    position: static;
    margin-bottom: 24px;
  }
`

const FilterTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.01em;
`

const FilterGroup = styled.div`
  margin-bottom: 24px;
  
  &:last-of-type {
    margin-bottom: 0;
  }
`

const FilterLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #4e4639;
  margin-bottom: 10px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`

const SelectInput = styled.select`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #1a1c1c;
  
  &:hover {
    border-color: #c5a059;
  }
  
  &:focus {
    outline: none;
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
`

const PriceRange = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

const PriceInput = styled.input`
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #c5a059;
  }
  
  &:focus {
    outline: none;
    border-color: #775a19;
    box-shadow: 0 0 0 3px rgba(119, 90, 25, 0.1);
  }
  
  &::placeholder {
    color: #aaa;
  }
`

const ClearButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-top: 24px;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
  
  &:hover {
    background: #e8e8e8;
    color: #775a19;
  }
  
  &:active {
    transform: scale(0.98);
  }
`

const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, #e2e2e2, transparent);
  margin: 20px 0;
`

const FilterSidebar = ({ filters = {}, setFilter, clearFilters, locations = [] }) => {
  // These match your backend expected values
  const categories = ['SUV', 'Sedan', 'Hatchback', 'Luxury', 'Sports', 'Electric']
  const transmissions = ['Manual', 'Automatic']
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']

  const handleSetFilter = (key, value) => {
    if (setFilter) {
      setFilter(key, value)
    }
  }

  const handleClearFilters = () => {
    if (clearFilters) {
      clearFilters()
    }
  }

  // Extract location name or return the value if it's a string
  const getLocationValue = (location) => {
    if (typeof location === 'object' && location !== null) {
      return location.id || location.name || location.address || location.city
    }
    return location
  }

  const getLocationDisplay = (location) => {
    if (typeof location === 'object' && location !== null) {
      return location.name || location.address || `${location.city || ''} ${location.state || ''}`.trim() || 'Unknown Location'
    }
    return location
  }

  const hasActiveFilters = filters.location_id || filters.min_price || filters.max_price || 
    filters.category || filters.transmission || filters.fuel_type || filters.seats

  return (
    <SidebarWrapper>
      <FilterTitle>Filters</FilterTitle>

      <FilterGroup>
        <FilterLabel>📍 Location</FilterLabel>
        <SelectInput
          value={filters.location_id || ''}
          onChange={(e) => handleSetFilter('location_id', e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((loc, index) => {
            const locationValue = getLocationValue(loc)
            const locationDisplay = getLocationDisplay(loc)
            return (
              <option key={index} value={locationValue}>
                {locationDisplay}
              </option>
            )
          })}
        </SelectInput>
      </FilterGroup>

      <Divider />

      <FilterGroup>
        <FilterLabel>💰 Price Range (per day)</FilterLabel>
        <PriceRange>
          <PriceInput
            type="number"
            placeholder="Min ₹"
            value={filters.min_price || ''}
            onChange={(e) => handleSetFilter('min_price', e.target.value)}
          />
          <PriceInput
            type="number"
            placeholder="Max ₹"
            value={filters.max_price || ''}
            onChange={(e) => handleSetFilter('max_price', e.target.value)}
          />
        </PriceRange>
      </FilterGroup>

      <Divider />

      <FilterGroup>
        <FilterLabel>🚗 Category</FilterLabel>
        <SelectInput
          value={filters.category || ''}
          onChange={(e) => handleSetFilter('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </SelectInput>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>⚙️ Transmission</FilterLabel>
        <SelectInput
          value={filters.transmission || ''}
          onChange={(e) => handleSetFilter('transmission', e.target.value)}
        >
          <option value="">Any</option>
          {transmissions.map(trans => (
            <option key={trans} value={trans}>{trans}</option>
          ))}
        </SelectInput>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>⛽ Fuel Type</FilterLabel>
        <SelectInput
          value={filters.fuel_type || ''}
          onChange={(e) => handleSetFilter('fuel_type', e.target.value)}
        >
          <option value="">Any</option>
          {fuelTypes.map(fuel => (
            <option key={fuel} value={fuel}>{fuel}</option>
          ))}
        </SelectInput>
      </FilterGroup>

      <FilterGroup>
        <FilterLabel>👥 Seats</FilterLabel>
        <SelectInput
          value={filters.seats || ''}
          onChange={(e) => handleSetFilter('seats', e.target.value)}
        >
          <option value="">Any</option>
          <option value="2">2 Seats</option>
          <option value="4">4 Seats</option>
          <option value="5">5 Seats</option>
          <option value="7">7 Seats</option>
          <option value="8">8 Seats</option>
        </SelectInput>
      </FilterGroup>

      {hasActiveFilters && (
        <ClearButton onClick={handleClearFilters}>
          Clear All Filters
        </ClearButton>
      )}
    </SidebarWrapper>
  )
}

export default FilterSidebar