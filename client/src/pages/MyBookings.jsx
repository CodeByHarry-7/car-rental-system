import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import toast from "react-hot-toast";
import { api } from "../context/AuthContext";
import { BookingsSkeleton } from "../components/SkeletonLoaders";

/* ─────────────────────────────────────────────
   TOKENS
───────────────────────────────────────────── */
const gold = "#775a19";
const goldMid = "#c5a059";
const goldLight = "rgba(197,160,89,0.08)";
const border = "#e8e8e8";
const textDark = "#1a1c1c";
const textMid = "#5f5e5e";
const textLight = "#9e9d9b";
const surface = "#ffffff";
const bg = "#f7f6f3";

/* ─────────────────────────────────────────────
   PAGE
───────────────────────────────────────────── */
const PageWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 36px 24px 64px;
  background: ${bg};
  min-height: 100vh;
`;

const PageHeader = styled.div`
  margin-bottom: 32px;
`;

const PageTitle = styled.h1`
  font-size: 26px;
  font-weight: 700;
  color: ${textDark};
  font-family: "Montserrat", sans-serif;
  margin: 0 0 4px;
`;

const PageSub = styled.p`
  font-size: 13px;
  color: ${textMid};
  margin: 0;
`;

/* ─────────────────────────────────────────────
   CARD
───────────────────────────────────────────── */
const BookingCard = styled.div`
  background: ${surface};
  border-radius: 16px;
  border: 1px solid ${border};
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s;
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
`;

const CardMain = styled.div`
  display: flex;
  gap: 0;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const CarImageBox = styled.div`
  width: 200px;
  flex-shrink: 0;
  position: relative;
  @media (max-width: 768px) {
    width: 100%;
    height: 180px;
  }
`;

const CarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 160px;
`;

const NoImg = styled.div`
  width: 100%;
  height: 100%;
  min-height: 160px;
  background: #f0ede8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  opacity: 0.4;
`;

const CardBody = styled.div`
  flex: 1;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  @media (max-width: 480px) {
    padding: 16px;
  }
`;

/* ─────────────────────────────────────────────
   CARD TOP ROW
───────────────────────────────────────────── */
const CardTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
`;

const CarName = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: ${textDark};
  margin: 0 0 3px;
  font-family: "Montserrat", sans-serif;
`;

const BookingMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const BookingIdTag = styled.span`
  font-size: 11px;
  color: ${textLight};
  font-weight: 500;
`;

const StatusPill = styled.span`
  padding: 3px 11px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${(p) =>
    p.$s === "confirmed" || p.$s === "active"
      ? "rgba(82,196,26,0.1)"
      : p.$s === "pending"
        ? "rgba(250,173,20,0.1)"
        : p.$s === "cancelled"
          ? "rgba(255,77,79,0.1)"
          : "rgba(0,0,0,0.05)"};
  color: ${(p) =>
    p.$s === "confirmed" || p.$s === "active"
      ? "#52c41a"
      : p.$s === "pending"
        ? "#faad14"
        : p.$s === "cancelled"
          ? "#ff4d4f"
          : textMid};
  &::before {
    content: "";
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }
`;

/* ─────────────────────────────────────────────
   INFO GRID
───────────────────────────────────────────── */
const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
`;

const InfoCell = styled.div`
  background: ${bg};
  border-radius: 8px;
  padding: 8px 12px;
`;

const InfoLbl = styled.p`
  font-size: 10px;
  color: ${textLight};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 3px;
  font-weight: 600;
`;

const InfoVal = styled.p`
  font-size: 12px;
  font-weight: 600;
  color: ${textDark};
  margin: 0;
  line-height: 1.4;
`;

/* ─────────────────────────────────────────────
   PRICE BREAKDOWN (collapsible)
───────────────────────────────────────────── */
const BreakdownToggle = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: ${gold};
  padding: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: opacity 0.15s;
  &:hover {
    opacity: 0.7;
  }
`;

const BreakdownBox = styled.div`
  background: ${goldLight};
  border: 1px solid rgba(197, 160, 89, 0.2);
  border-radius: 10px;
  padding: 14px 16px;
  margin-top: 2px;
`;

const BRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 12px;
  color: ${textMid};
  border-bottom: 1px solid rgba(197, 160, 89, 0.15);
  &:last-child {
    border-bottom: none;
  }
`;

const BLabel = styled.span`
  font-weight: 400;
`;

const BValue = styled.span`
  font-weight: 600;
  color: ${(p) => (p.$discount ? "#16a34a" : p.$total ? textDark : textMid)};
  font-size: ${(p) => (p.$total ? "14px" : "12px")};
`;

const AddonsList = styled.div`
  padding: 6px 0 2px;
`;

const AddonLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: ${textMid};
  padding: 3px 0 3px 12px;
  position: relative;
  &::before {
    content: "•";
    position: absolute;
    left: 2px;
    color: ${goldMid};
  }
`;

/* ─────────────────────────────────────────────
   CARD FOOTER
───────────────────────────────────────────── */
const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px 16px;
  border-top: 1px solid ${border};
  gap: 12px;
  flex-wrap: wrap;
  @media (max-width: 480px) {
    padding: 12px 16px;
  }
`;

const PriceBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
`;

const FinalPrice = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: ${gold};
  font-family: "Montserrat", sans-serif;
`;

const PayBadge = styled.span`
  font-size: 11px;
  color: ${textMid};
  background: ${bg};
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 500;
`;

const BtnGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const CancelBtn = styled.button`
  padding: 8px 16px;
  background: none;
  border: 1px solid #ff4d4f;
  color: #ff4d4f;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #ff4d4f;
    color: white;
  }
`;

const ViewBtn = styled(Link)`
  padding: 8px 16px;
  background: ${gold};
  color: white;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  &:hover {
    background: #5d4201;
  }
`;

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
const EmptyWrap = styled.div`
  text-align: center;
  padding: 64px 24px;
  background: ${surface};
  border-radius: 16px;
  border: 1px solid ${border};
  max-width: 480px;
  margin: 40px auto;
`;

const EmptyIcon = styled.div`
  font-size: 56px;
  margin-bottom: 16px;
`;
const EmptyTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${textDark};
  margin: 0 0 8px;
`;
const EmptyText = styled.p`
  font-size: 14px;
  color: ${textMid};
  margin: 0 0 24px;
`;

const ExploreLink = styled(Link)`
  display: inline-block;
  padding: 12px 28px;
  background: ${gold};
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  &:hover {
    background: #5d4201;
  }
`;

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmtDate = (dt) =>
  new Date(dt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtINR = (n) => Number(n || 0).toLocaleString("en-IN");

/* ─────────────────────────────────────────────
   BOOKING CARD ROW — separate component to
   avoid duplicate-key issues & keep state local
───────────────────────────────────────────── */
const BookingRow = ({ booking, onCancel }) => {
  const [showBreakdown, setShowBreakdown] = useState(false)

  const baseRent   = parseFloat(booking.base_rent_amount  || booking.total_price || 0)
  const addonTotal = parseFloat(booking.addon_total        || 0)
  const discount   = parseFloat(booking.promo_discount     || 0)
  const finalAmt   = parseFloat(booking.final_paid_amount || booking.total_price || 0)
  const addons     = Array.isArray(booking.addons) ? booking.addons : []

  // ✅ Only show breakdown if there's meaningful data
  const hasBreakdown = baseRent > 0 || addonTotal > 0 || discount > 0

  // ✅ Only show add-ons that were actually paid for (check both price and price_at_time)
  const paidAddons = addons.filter(a => {
    const addonPrice = a.price_at_time || a.price || 0
    return addonPrice > 0
  })

  // Debug log to see what addons look like
  console.log('Booking addons:', addons)
  console.log('Paid addons:', paidAddons)

  return (
    <BookingCard>
      <CardMain>
        <CarImageBox>
          {booking.primary_image
            ? <CarImg src={booking.primary_image} alt={`${booking.make} ${booking.model}`} />
            : <NoImg>🚗</NoImg>}
        </CarImageBox>

        <CardBody>
          {/* Top row */}
          <CardTopRow>
            <div>
              <CarName>{booking.make} {booking.model} ({booking.year})</CarName>
              <BookingMeta>
                <BookingIdTag>#{booking.id}</BookingIdTag>
                <StatusPill $s={booking.status}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </StatusPill>
              </BookingMeta>
            </div>
          </CardTopRow>

          {/* Info grid */}
          <InfoGrid>
            <InfoCell>
              <InfoLbl>Pickup</InfoLbl>
              <InfoVal>{fmtDate(booking.pickup_datetime)}</InfoVal>
            </InfoCell>
            <InfoCell>
              <InfoLbl>Dropoff</InfoLbl>
              <InfoVal>{fmtDate(booking.dropoff_datetime)}</InfoVal>
            </InfoCell>
            <InfoCell>
              <InfoLbl>Duration</InfoLbl>
              <InfoVal style={{ textTransform: 'capitalize' }}>{booking.duration_type}</InfoVal>
            </InfoCell>
            <InfoCell>
              <InfoLbl>Location</InfoLbl>
              <InfoVal>{booking.pickup_location_name || '—'}</InfoVal>
            </InfoCell>
          </InfoGrid>

          {/* Breakdown toggle */}
          {hasBreakdown && (
            <div>
              <BreakdownToggle onClick={() => setShowBreakdown(s => !s)}>
                {showBreakdown ? '▲' : '▼'} {showBreakdown ? 'Hide' : 'Show'} price breakdown
              </BreakdownToggle>

              {showBreakdown && (
                <BreakdownBox>
                  <BRow>
                    <BLabel>Base Rent</BLabel>
                    <BValue>₹{fmtINR(baseRent)}</BValue>
                  </BRow>

                  {/* ✅ Only show add-ons section if there are paid add-ons */}
                  {paidAddons.length > 0 && (
                    <>
                      <BRow style={{ alignItems: 'flex-start' }}>
                        <BLabel>Add-ons</BLabel>
                        <BValue>₹{fmtINR(addonTotal)}</BValue>
                      </BRow>
                      <AddonsList>
                        {paidAddons.map((a, i) => (
                          <AddonLine key={`${booking.id}-addon-${a.addon_id ?? i}`}>
                            <span>{a.addon_name || a.name || `Add-on #${a.addon_id}`}</span>
                            <span>₹{fmtINR(a.price_at_time || a.price)}</span>
                          </AddonLine>
                        ))}
                      </AddonsList>
                    </>
                  )}

                  {discount > 0 && (
                    <BRow>
                      <BLabel>
                        Promo Discount
                        {booking.promo_code_used
                          ? <span style={{ fontSize: 10, marginLeft: 6, color: goldMid,
                              background: goldLight, padding: '1px 6px', borderRadius: 4 }}>
                              {booking.promo_code_used}
                            </span>
                          : null}
                      </BLabel>
                      <BValue $discount>−₹{fmtINR(discount)}</BValue>
                    </BRow>
                  )}

                  <BRow style={{ marginTop: 4 }}>
                    <BLabel style={{ fontWeight: 700, color: textDark }}>Total Paid</BLabel>
                    <BValue $total>₹{fmtINR(finalAmt)}</BValue>
                  </BRow>
                </BreakdownBox>
              )}
            </div>
          )}
        </CardBody>
      </CardMain>

      {/* Footer */}
      <CardFooter>
        <PriceBlock>
          <FinalPrice>₹{fmtINR(finalAmt)}</FinalPrice>
          <PayBadge>
            {booking.payment_method === 'cash' ? '💵 Cash on pickup' : '💳 Online'}
            {booking.payment_status ? ` · ${booking.payment_status}` : ''}
          </PayBadge>
        </PriceBlock>

        <BtnGroup>
          {booking.status === 'pending' && (
            <CancelBtn onClick={() => onCancel(booking.id)}>Cancel</CancelBtn>
          )}
          <ViewBtn to={`/cars/${booking.car_id}`}>View Car</ViewBtn>
        </BtnGroup>
      </CardFooter>
    </BookingCard>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/bookings/my")
      .then((res) => {
        // Deduplicate by booking id in case backend returns duplicates
        const seen = new Set();
        const unique = res.data.filter((b) => {
          if (seen.has(b.id)) return false;
          seen.add(b.id);
          return true;
        });
        setBookings(unique);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load bookings");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = (id) => {
    toast(
      (t) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Cancel this booking?</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await api.patch(`/bookings/${id}/cancel`);
                  setBookings((prev) =>
                    prev.map((b) =>
                      b.id === id ? { ...b, status: "cancelled" } : b,
                    ),
                  );
                  toast.success("Booking cancelled");
                } catch (err) {
                  toast.error(
                    err.response?.data?.message || "Failed to cancel booking",
                  );
                }
              }}
              style={{
                padding: "6px 14px",
                background: "#ff4d4f",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: "6px 14px",
                background: "#f0f0f0",
                color: "#333",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              Keep
            </button>
          </div>
        </div>
      ),
      { duration: 5000 },
    );
  };

  if (loading) return <BookingsSkeleton />;

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>My Bookings</PageTitle>
        <PageSub>
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""} found
        </PageSub>
      </PageHeader>

      {bookings.length === 0 ? (
        <EmptyWrap>
          <EmptyIcon>🚗</EmptyIcon>
          <EmptyTitle>No bookings yet</EmptyTitle>
          <EmptyText>
            You haven't booked any cars yet. Start exploring!
          </EmptyText>
          <ExploreLink to="/cars">Explore Cars</ExploreLink>
        </EmptyWrap>
      ) : (
        bookings.map((booking) => (
          <BookingRow
            key={`booking-${booking.id}`}
            booking={booking}
            onCancel={handleCancel}
          />
        ))
      )}
    </PageWrapper>
  );
};

export default MyBookings;
