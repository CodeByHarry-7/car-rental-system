import { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import CarCard from "../components/CarCard";
import useFilters from "../hooks/useFilters";
import RecentlyViewed from "../components/RecentlyViewed";
import {
  GridSkeleton,
  CarCardSkeleton,
  SkeletonImage,
  SkeletonLine,
  SkeletonButton,
} from "../components/SkeletonLoaders";

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: #f9f9f9;
`;

const Main = styled.main`
  padding-top: 1rem;
  max-width: 1440px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
  @media (min-width: 768px) {
    padding-left: 64px;
    padding-right: 64px;
  }
`;

const Header = styled.header`
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-family: "Montserrat", sans-serif;
  font-size: 32px;
  font-weight: 600;
  color: #1a1c1c;
  @media (min-width: 768px) {
    font-size: 40px;
  }
`;

const ResultCount = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 18px;
  color: #5f5e5e;
  margin-top: 4px;
`;

const FilterSection = styled.section`
  margin-bottom: 40px;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 12px;
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  @media (min-width: 768px) {
    flex-wrap: wrap;
    overflow-x: visible;
  }
`;

const FilterChip = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const FilterSelect = styled.select`
  appearance: none;
  background-color: ${(p) => (p.$active ? "#fff8ee" : "white")};
  padding: 12px 36px 12px 20px;
  border-radius: 40px;
  border: ${(p) => (p.$active ? "1.5px solid #775a19" : "1px solid #e2e2e2")};
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${(p) => (p.$active ? "#775a19" : "#1a1c1c")};
  &:hover {
    border-color: #c5a059;
    box-shadow: 0 2px 8px rgba(197, 160, 89, 0.15);
  }
  &:focus {
    outline: none;
    border-color: #775a19;
  }
`;

const DurationSelect = styled.select`
  appearance: none;
  background-color: #775a19;
  color: white;
  border: 1px solid #775a19;
  font-weight: 600;
  padding: 12px 36px 12px 20px;
  border-radius: 40px;
  font-family: "Inter", sans-serif;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background-color: #5e4614;
    border-color: #5e4614;
  }
  option {
    background-color: white;
    color: #1a1c1c;
  }
`;

const SelectIcon = styled.span`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
  color: ${(p) => (p.$active ? "#775a19" : "#999")};
`;

const DurationIcon = styled.span`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 12px;
  color: white;
`;

const ActiveBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -4px;
  background: #775a19;
  color: white;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Inter", sans-serif;
`;

const ClearButton = styled.button`
  flex-shrink: 0;
  padding: 12px 24px;
  background: #fff0f0;
  border: 1px solid #ffcccc;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  color: #cc4444;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: #ffe0e0;
    border-color: #cc4444;
  }
`;

const ActiveFiltersBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const ActiveTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff8ee;
  border: 1px solid #c5a059;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #775a19;
  font-family: "Inter", sans-serif;
`;

const RemoveTag = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #775a19;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  &:hover {
    color: #cc4444;
  }
`;

const CarsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  margin-bottom: 64px;
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 0;
`;
const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;
const EmptyTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #1a1c1c;
  margin-bottom: 8px;
`;
const EmptyText = styled.p`
  color: #5f5e5e;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 48px;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s;
  background-color: ${(p) => (p.$active ? "#775a19" : "#eeeeee")};
  color: ${(p) => (p.$active ? "white" : "inherit")};
  opacity: ${(p) => (p.disabled ? 0.5 : 1)};
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  &:hover {
    background-color: ${(p) => (p.$active ? "#775a19" : "#e2e2e2")};
  }
`;

// ─── Constants ───────────────────────────────────────────────────────────────

const PRICE_RANGES = {
  hourly: [
    { label: "Under ₹300", value: "0-300", min: "0", max: "300" },
    { label: "₹300 – ₹600", value: "300-600", min: "300", max: "600" },
    { label: "₹600 – ₹1,000", value: "600-1000", min: "600", max: "1000" },
    { label: "₹1,000+", value: "1000-", min: "1000", max: "" },
  ],
  daily: [
    { label: "Under ₹1,000", value: "0-1000", min: "0", max: "1000" },
    { label: "₹1,000 – ₹3,000", value: "1000-3000", min: "1000", max: "3000" },
    { label: "₹3,000 – ₹5,000", value: "3000-5000", min: "3000", max: "5000" },
    { label: "₹5,000+", value: "5000-", min: "5000", max: "" },
  ],
  weekly: [
    { label: "Under ₹5,000", value: "0-5000", min: "0", max: "5000" },
    {
      label: "₹5,000 – ₹15,000",
      value: "5000-15000",
      min: "5000",
      max: "15000",
    },
    {
      label: "₹15,000 – ₹30,000",
      value: "15000-30000",
      min: "15000",
      max: "30000",
    },
    { label: "₹30,000+", value: "30000-", min: "30000", max: "" },
  ],
};

const DURATION_LABELS = {
  hourly: "⏱ Hourly",
  daily: "📅 Daily",
  weekly: "🗓 Weekly",
};

const categories = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Luxury",
  "Sports",
  "Electric",
];
const transmissions = ["Manual", "Automatic"];
const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
const seatOptions = [2, 4, 5, 7, 8];

// Keys that must NEVER be merged from useFilters into our API params
// because we manage them in local state to keep full control.
const LOCAL_STATE_KEYS = new Set(["duration_type", "min_price", "max_price"]);

// ─── Component ───────────────────────────────────────────────────────────────

const CarListing = () => {
  const [cars, setCars] = useState([]);
  const [locations, setLocations] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Duration and price live in local state — never in useFilters — so they
  // always reflect what the user chose with zero round-trip uncertainty.
  const [currentDuration, setCurrentDuration] = useState("daily");
  const [priceValue, setPriceValue] = useState(""); // e.g. "300-600"
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { filters, setFilter, setPage, clearFilters } = useFilters();

  useEffect(() => {
    fetchLocations();
  }, []);

  // Re-fetch whenever other filters, duration, or price change.
  useEffect(() => {
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), currentDuration, minPrice, maxPrice]);

  const fetchLocations = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/locations");
      setLocations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      // Start with duration_type — this must always be present and correct.
      const params = { duration_type: currentDuration };

      // Merge filters from useFilters, but SKIP any key we own locally so
      // a stale value in the hook can never overwrite our local state.
      Object.entries(filters).forEach(([key, value]) => {
        if (LOCAL_STATE_KEYS.has(key)) return; // ← key guard
        if (value !== "" && value !== undefined && value !== null) {
          params[key] = value;
        }
      });

      // Attach price params from local state (already validated on selection)
      if (minPrice !== "") params.min_price = minPrice;
      if (maxPrice !== "") params.max_price = maxPrice;

      const res = await axios.get("http://localhost:5000/api/cars", { params });
      console.log("First car image debug:", {
        primary_image: res.data.cars[0]?.primary_image,
        image_url: res.data.cars[0]?.image_url,
        full_car: res.data.cars[0],
      });
      setCars(res.data.cars);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleDurationChange = (value) => {
    setCurrentDuration(value);
    // Clear price selection — price ranges differ per duration
    setPriceValue("");
    setMinPrice("");
    setMaxPrice("");
  };

  const handlePriceChange = (e) => {
    const val = e.target.value;
    const options = PRICE_RANGES[currentDuration] || PRICE_RANGES.daily;
    const selected = options.find((r) => r.value === val);

    setPriceValue(val);
    if (!selected || val === "") {
      setMinPrice("");
      setMaxPrice("");
    } else {
      setMinPrice(selected.min);
      setMaxPrice(selected.max);
    }
  };

  const handleClearAll = () => {
    clearFilters();
    setCurrentDuration("daily");
    setPriceValue("");
    setMinPrice("");
    setMaxPrice("");
  };

  // ── Derived UI state ───────────────────────────────────────────────────────

  const activePriceRange = (
    PRICE_RANGES[currentDuration] || PRICE_RANGES.daily
  ).find((r) => r.value === priceValue);

  const activeTags = [
    filters.location_id && {
      key: "location_id",
      label: `📍 ${locations.find((l) => String(l.id) === String(filters.location_id))?.name || "Location"}`,
    },
    filters.category && { key: "category", label: `🚗 ${filters.category}` },
    filters.transmission && {
      key: "transmission",
      label: `⚙️ ${filters.transmission}`,
    },
    filters.fuel_type && { key: "fuel_type", label: `⛽ ${filters.fuel_type}` },
    filters.seats && { key: "seats", label: `👥 ${filters.seats} Seats` },
    activePriceRange && {
      key: "price",
      label: `💰 ${activePriceRange.label} (${DURATION_LABELS[currentDuration]})`,
    },
  ].filter(Boolean);

  const removeTag = (key) => {
    if (key === "price") {
      setPriceValue("");
      setMinPrice("");
      setMaxPrice("");
    } else {
      setFilter(key, "");
    }
  };

  const activeFilterCount = activeTags.length;
  const hasActiveFilters = activeFilterCount > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <Main>
        <Header>
          <Title>Available Cars</Title>
          <ResultCount>
            {total} {total === 1 ? "car" : "cars"} found
          </ResultCount>
        </Header>

        <FilterSection>
          <FilterRow>
            {/* ── Duration ── */}
            <FilterChip>
              <DurationSelect
                value={currentDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
              >
                <option value="hourly">⏱ Hourly</option>
                <option value="daily">📅 Daily</option>
                <option value="weekly">🗓 Weekly</option>
              </DurationSelect>
              <DurationIcon>▼</DurationIcon>
            </FilterChip>

            {/* ── Location ── */}
            <FilterChip>
              <FilterSelect
                $active={!!filters.location_id}
                value={filters.location_id || ""}
                onChange={(e) => setFilter("location_id", e.target.value)}
              >
                <option value="">📍 All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    📍 {loc.name}
                  </option>
                ))}
              </FilterSelect>
              <SelectIcon $active={!!filters.location_id}>▼</SelectIcon>
              {filters.location_id && <ActiveBadge>✓</ActiveBadge>}
            </FilterChip>

            {/* ── Category ── */}
            <FilterChip>
              <FilterSelect
                $active={!!filters.category}
                value={filters.category || ""}
                onChange={(e) => setFilter("category", e.target.value)}
              >
                <option value="">🚗 All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    🚗 {cat}
                  </option>
                ))}
              </FilterSelect>
              <SelectIcon $active={!!filters.category}>▼</SelectIcon>
              {filters.category && <ActiveBadge>✓</ActiveBadge>}
            </FilterChip>

            {/* ── Transmission ── */}
            <FilterChip>
              <FilterSelect
                $active={!!filters.transmission}
                value={filters.transmission || ""}
                onChange={(e) => setFilter("transmission", e.target.value)}
              >
                <option value="">⚙️ Transmission</option>
                {transmissions.map((t) => (
                  <option key={t} value={t}>
                    ⚙️ {t}
                  </option>
                ))}
              </FilterSelect>
              <SelectIcon $active={!!filters.transmission}>▼</SelectIcon>
              {filters.transmission && <ActiveBadge>✓</ActiveBadge>}
            </FilterChip>

            {/* ── Fuel Type ── */}
            <FilterChip>
              <FilterSelect
                $active={!!filters.fuel_type}
                value={filters.fuel_type || ""}
                onChange={(e) => setFilter("fuel_type", e.target.value)}
              >
                <option value="">⛽ Fuel Type</option>
                {fuelTypes.map((f) => (
                  <option key={f} value={f}>
                    ⛽ {f}
                  </option>
                ))}
              </FilterSelect>
              <SelectIcon $active={!!filters.fuel_type}>▼</SelectIcon>
              {filters.fuel_type && <ActiveBadge>✓</ActiveBadge>}
            </FilterChip>

            {/* ── Seats ── */}
            <FilterChip>
              <FilterSelect
                $active={!!filters.seats}
                value={filters.seats || ""}
                onChange={(e) => setFilter("seats", e.target.value)}
              >
                <option value="">👥 Seats</option>
                {seatOptions.map((s) => (
                  <option key={s} value={s}>
                    👥 {s} Seats
                  </option>
                ))}
              </FilterSelect>
              <SelectIcon $active={!!filters.seats}>▼</SelectIcon>
              {filters.seats && <ActiveBadge>✓</ActiveBadge>}
            </FilterChip>

            {/* ── Price Range ──
                key={currentDuration} forces a full re-mount when duration
                changes so the <select> visually resets to the placeholder. */}
            <FilterChip>
              <FilterSelect
                key={currentDuration}
                $active={!!activePriceRange}
                value={priceValue}
                onChange={handlePriceChange}
              >
                <option value="">
                  💰 Price Range ({DURATION_LABELS[currentDuration]})
                </option>
                {(PRICE_RANGES[currentDuration] || PRICE_RANGES.daily).map(
                  (r) => (
                    <option key={r.value} value={r.value}>
                      💰 {r.label}
                    </option>
                  ),
                )}
              </FilterSelect>
              <SelectIcon $active={!!activePriceRange}>▼</SelectIcon>
              {activePriceRange && <ActiveBadge>✓</ActiveBadge>}
            </FilterChip>

            {hasActiveFilters && (
              <ClearButton onClick={handleClearAll}>
                Clear All ({activeFilterCount})
              </ClearButton>
            )}
          </FilterRow>

          {activeTags.length > 0 && (
            <ActiveFiltersBar>
              {activeTags.map((tag) => (
                <ActiveTag key={tag.key}>
                  {tag.label}
                  <RemoveTag onClick={() => removeTag(tag.key)}>×</RemoveTag>
                </ActiveTag>
              ))}
            </ActiveFiltersBar>
          )}
        </FilterSection>

        {loading ? (
          <GridSkeleton>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CarCardSkeleton key={i}>
                <SkeletonImage />
                <div style={{ padding: "24px" }}>
                  <SkeletonLine $width="70%" $marginBottom="12px" />
                  <SkeletonLine $width="40%" $marginBottom="12px" />
                  <SkeletonLine $width="90%" $marginBottom="16px" />
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginBottom: "16px",
                    }}
                  >
                    <SkeletonLine $width="30%" $height="14px" />
                    <SkeletonLine $width="30%" $height="14px" />
                    <SkeletonLine $width="30%" $height="14px" />
                  </div>
                  <SkeletonButton />
                </div>
              </CarCardSkeleton>
            ))}
          </GridSkeleton>
        ) : cars.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyTitle>No cars found</EmptyTitle>
            <EmptyText>
              Try adjusting your filters to see more results
            </EmptyText>
          </EmptyState>
        ) : (
          <>
            <CarsGrid>
              {cars.map((car) => (
                <CarCard key={car.id} car={car} duration={currentDuration} />
              ))}
            </CarsGrid>

            {totalPages > 1 && (
              <PaginationContainer>
                <PageButton
                  onClick={() =>
                    setPage(Math.max(1, parseInt(filters.page) - 1))
                  }
                  disabled={parseInt(filters.page) === 1}
                >
                  ← Previous
                </PageButton>

                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <PageButton
                      key={pageNum}
                      $active={parseInt(filters.page) === pageNum}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </PageButton>
                  );
                })}

                {totalPages > 5 && <span style={{ padding: "8px" }}>...</span>}
                {totalPages > 5 && (
                  <PageButton onClick={() => setPage(totalPages)}>
                    {totalPages}
                  </PageButton>
                )}

                <PageButton
                  onClick={() =>
                    setPage(Math.min(totalPages, parseInt(filters.page) + 1))
                  }
                  disabled={parseInt(filters.page) === totalPages}
                >
                  Next →
                </PageButton>
              </PaginationContainer>
            )}
          </>
        )}

        <RecentlyViewed />
      </Main>
    </PageContainer>
  );
};

export default CarListing;
