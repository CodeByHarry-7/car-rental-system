import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { api } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import useRecentlyViewed from "../hooks/useRecentlyViewed";
import useWishlist from "../hooks/useWishlist";
import SimilarCars from "../components/SimilarCars";
import BookingModal from "../components/BookingModal";
import AuthModal from "../components/AuthModal";
import toast from "react-hot-toast";
import { CarDetailSkeleton } from "../components/SkeletonLoaders";
import { useSearchParams } from "react-router-dom";

const PageWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  text-align: left;
`;

const TwoColumnLayout = styled.div`
  display: flex;
  gap: 32px;
  align-items: flex-start;
  @media (max-width: 768px) { flex-direction: column; }
`;

const LeftColumn = styled.div`flex: 1; min-width: 0;`;

const RightColumn = styled.div`
  width: 360px;
  flex-shrink: 0;
  position: sticky;
  top: 88px;
  align-self: flex-start;
  @media (max-width: 768px) { width: 100%; position: static; }
`;

const GallerySection = styled.div`margin-bottom: 32px;`;

const MainImage = styled.img`
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  @media (max-width: 768px) { height: 240px; }
`;

const Thumbnails = styled.div`display: flex; gap: 8px; flex-wrap: wrap;`;

const Thumbnail = styled.img`
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  border: 2.5px solid ${p => p.$active ? "#775a19" : "transparent"};
  opacity: ${p => p.$active ? 1 : 0.65};
  transition: opacity 0.2s, border-color 0.2s, transform 0.15s;
  &:hover { opacity: 1; transform: scale(1.04); }
`;

const NoImage = styled.div`
  width: 100%;
  height: 400px;
  background: #f3f3f3;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5f5e5e;
  font-size: 14px;
  margin-bottom: 16px;
`;

const CarHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 4px;
`;

const CarTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1a1c1c;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
  @media (max-width: 768px) { font-size: 22px; }
`;

const WishlistButton = styled.button`
  background: white;
  border: 1px solid #e2e2e2;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover {
    transform: scale(1.12);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
  svg {
    width: 22px;
    height: 22px;
    fill: ${p => p.$active ? "#ff4d4f" : "none"};
    stroke: ${p => p.$active ? "#ff4d4f" : "#5f5e5e"};
    stroke-width: 2;
    transition: fill 0.2s, stroke 0.2s;
  }
`;

const LocationText = styled.p`
  font-size: 13px;
  color: #5f5e5e;
  margin-top: 8px;
  margin-bottom: 28px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SpecsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 28px;
`;

const SpecItem = styled.div`
  background: #f8f8f8;
  border: 1px solid #eeeeee;
  padding: 14px 16px;
  border-radius: 10px;
  transition: background 0.2s;
  &:hover { background: #fff8ee; border-color: #e8d5a3; }
`;

const SpecLabel = styled.p`
  font-size: 11px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
`;

const SpecValue = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: #1a1c1c;
  text-transform: capitalize;
`;

const FeaturesSection = styled.div`margin-bottom: 28px;`;

const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
`;

const FeaturesList = styled.div`display: flex; flex-wrap: wrap; gap: 8px;`;

const FeatureBadge = styled.span`
  padding: 6px 14px;
  background: #f3f3f3;
  border: 1px solid #e2e2e2;
  border-radius: 20px;
  font-size: 13px;
  color: #1a1c1c;
  transition: background 0.15s;
  &:hover { background: #fff8ee; border-color: #c5a059; color: #775a19; }
`;

const DescriptionSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 28px 32px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  border: 1px solid #eeeeee;
  margin-bottom: 28px;
`;

const DescriptionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  font-family: 'Montserrat', sans-serif;
  color: #1a1c1c;
`;

const DescriptionText = styled.p`
  font-size: 14px;
  color: #5f5e5e;
  line-height: 1.8;
`;

/* ── Booking panel ── */
const BookingPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid #e2e2e2;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
`;

const PanelPrice = styled.span`
  font-size: 30px;
  font-weight: 700;
  color: #775a19;
  font-family: 'Montserrat', sans-serif;
`;

const PanelUnit = styled.span`font-size: 13px; color: #5f5e5e;`;

const DurationTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: #f3f3f3;
  border-radius: 12px;
  padding: 4px;
`;

const DurationTab = styled.button`
  flex: 1;
  padding: 9px 4px;
  border: none;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Inter', sans-serif;
  background: ${p => p.$active ? '#775a19' : 'transparent'};
  color: ${p => p.$active ? 'white' : '#5f5e5e'};
  box-shadow: ${p => p.$active ? '0 2px 8px rgba(119,90,25,0.18)' : 'none'};
  &:hover { background: ${p => p.$active ? '#775a19' : '#e2e2e2'}; }
`;

const PricingList = styled.div`margin-bottom: 20px;`;

const PricingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f3f3f3;
  &:last-child { border-bottom: none; }
`;

const PricingType = styled.span`
  font-size: 13px;
  color: #5f5e5e;
  text-transform: capitalize;
`;

const PricingAmount = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.$highlight ? '#775a19' : '#1a1c1c'};
  background: ${p => p.$highlight ? 'rgba(119,90,25,0.08)' : 'transparent'};
  padding: ${p => p.$highlight ? '3px 10px' : '0'};
  border-radius: 6px;
  transition: all 0.2s;
`;

const BookButton = styled.button`
  width: 100%;
  padding: 14px 16px;
  background: ${p => p.disabled ? "#c0bcb7" : "linear-gradient(135deg, #c5a059 0%, #775a19 100%)"};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  cursor: ${p => p.disabled ? "not-allowed" : "pointer"};
  transition: opacity 0.2s, transform 0.1s;
  margin-bottom: 12px;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 0.02em;
  box-shadow: ${p => p.disabled ? 'none' : '0 4px 12px rgba(119,90,25,0.25)'};
  &:hover:not(:disabled) { opacity: 0.92; }
  &:active:not(:disabled) { transform: scale(0.98); }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 20px;
  background: ${p =>
    p.$status === "available" ? "rgba(82,196,26,0.1)"
    : p.$status === "on_rent" ? "rgba(250,173,20,0.1)"
    : "rgba(255,77,79,0.1)"};
  color: ${p =>
    p.$status === "available" ? "#52c41a"
    : p.$status === "on_rent" ? "#faad14"
    : "#ff4d4f"};
`;

const LoginNote = styled.p`
  font-size: 11px;
  color: #faad14;
  text-align: center;
  margin-bottom: 8px;
  font-weight: 500;
`;

const PanelNote = styled.p`
  font-size: 11px;
  color: #aaa;
  text-align: center;
  margin-top: 4px;
`;

/* ── Reviews ── */
const ReviewsSection = styled.div`margin-top: 32px;`;

const ReviewsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  @media (max-width: 480px) { flex-direction: column; align-items: flex-start; gap: 8px; }
`;

const ReviewsTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1c1c;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
`;

const RatingSummary = styled.div`display: flex; align-items: center; gap: 8px;`;
const AverageRating = styled.span`font-size: 28px; font-weight: 700; color: #1a1c1c;`;
const TotalReviews  = styled.span`font-size: 13px; color: #5f5e5e;`;
const StarRow       = styled.div`display: flex; gap: 2px;`;

const Star = styled.span`
  font-size: ${p => p.$size || "18px"};
  color: ${p => p.$filled ? "#faad14" : "#e2e2e2"};
  cursor: ${p => p.$clickable ? "pointer" : "default"};
  transition: color 0.15s, transform 0.1s;
  &:hover { ${p => p.$clickable ? "transform: scale(1.2);" : ""} }
`;

const ReviewCard = styled.div`
  background: white;
  border: 1px solid #eeeeee;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
  &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
`;

const ReviewMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
`;

const ReviewerName = styled.span`font-weight: 600; font-size: 14px; color: #1a1c1c;`;
const ReviewDate   = styled.span`font-size: 11px; color: #aaa;`;
const ReviewComment = styled.p`font-size: 13px; color: #5f5e5e; line-height: 1.6; margin: 8px 0 0;`;
const NoReviews    = styled.p`color: #aaa; font-size: 13px; padding: 24px 0;`;

const ReviewFormBox = styled.div`
  background: #fafafa;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 28px;
  border: 1px solid #e2e2e2;
`;

const ReviewFormTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1a1c1c;
  font-family: 'Montserrat', sans-serif;
`;

const StarPicker = styled.div`display: flex; gap: 6px; margin-bottom: 16px;`;

const ReviewTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  padding: 14px 16px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 13px;
  color: #1a1c1c;
  background: white;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  margin-bottom: 14px;
  transition: border-color 0.2s;
  &:focus { outline: none; border-color: #775a19; box-shadow: 0 0 0 3px rgba(119,90,25,0.08); }
`;

const SubmitReviewBtn = styled.button`
  padding: 10px 28px;
  background: #775a19;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  &:hover:not(:disabled) { background: #5d4201; }
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { background: #c0bcb7; cursor: not-allowed; }
`;

const ReviewFormSelect = styled.select`
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #e2e2e2;
  border-radius: 8px;
  font-size: 13px;
  color: #1a1c1c;
  background: white;
  margin-bottom: 16px;
  box-sizing: border-box;
  &:focus { outline: none; border-color: #775a19; }
`;

const FormMessage = styled.p`
  font-size: 13px;
  color: ${p => p.$error ? "#ff4d4f" : "#52c41a"};
  margin-top: 8px;
  font-weight: 500;
`;

// duration → suffix + label
const DURATION_CONFIG = {
  hourly: { suffix: '/hr',   label: 'Hourly' },
  daily:  { suffix: '/day',  label: 'Daily'  },
  weekly: { suffix: '/week', label: 'Weekly' },
}

const Stars = ({ rating, size, clickable, onPick }) => (
  <StarRow>
    {[1, 2, 3, 4, 5].map(n => (
      <Star key={n} $filled={n <= rating} $size={size} $clickable={clickable}
        onClick={() => clickable && onPick && onPick(n)}>★</Star>
    ))}
  </StarRow>
);

const formatDate = iso =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

const CarDetail = () => {
  const { id }             = useParams();
  const { user }           = useAuth();
  const [searchParams]     = useSearchParams();

  const [selectedDuration, setSelectedDuration] = useState(
    searchParams.get('duration_type') || 'daily'
  );

  const [car, setCar]               = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showAuth, setShowAuth]     = useState(false);
  const { addCar }                  = useRecentlyViewed();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const [reviews, setReviews]                     = useState([]);
  const [averageRating, setAverageRating]           = useState(null);
  const [totalReviews, setTotalReviews]             = useState(0);
  const [reviewableBookings, setReviewableBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId]   = useState("");
  const [reviewRating, setReviewRating]             = useState(0);
  const [reviewComment, setReviewComment]           = useState("");
  const [reviewSubmitting, setReviewSubmitting]     = useState(false);
  const [reviewMessage, setReviewMessage]           = useState(null);

useEffect(() => { fetchCar(); fetchReviews(); }, [id]);
useEffect(() => {
  if (user) fetchReviewableBookings();
  else setReviewableBookings([]);
}, [user, id]);

// ✅ ADD THIS NEW useEffect FOR SCROLL TO TOP
useEffect(() => {
  // Always scroll to top when car detail page loads
  window.scrollTo(0, 0)
  
  // Check if we came from a car card click and ensure top position
  if (sessionStorage.getItem('scrollToTop')) {
    sessionStorage.removeItem('scrollToTop')
    window.scrollTo(0, 0)
  }
}, [id]) // Re-run when car id changes

  const fetchCar = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cars/${id}`);
      setCar(res.data);
      // ✅ FIX: pass the full car object so RecentlyViewed can display image,
      //         brand, model and price without any extra API call.
      addCar(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/${id}`);
      setReviews(res.data.reviews);
      setAverageRating(res.data.average_rating);
      setTotalReviews(res.data.total_reviews);
    } catch (err) { console.error(err); }
  };

  const fetchReviewableBookings = async () => {
    try {
      const res        = await api.get("/bookings/my");
      const completed  = res.data.filter(
        b => b.car_id === parseInt(id) && b.status === "completed"
      );
      const reviewsRes  = await api.get(`/reviews/${id}`);
      const reviewedIds = new Set(
        reviewsRes.data.reviews.map(r => r.booking_id).filter(Boolean)
      );
      const pending = completed.filter(b => !reviewedIds.has(b.id));
      setReviewableBookings(pending);
      if (pending.length > 0) setSelectedBookingId(String(pending[0].id));
    } catch (err) { console.error(err); }
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) {
      setReviewMessage({ text: "Please select a star rating.", error: true });
      return;
    }
    if (!selectedBookingId) {
      setReviewMessage({ text: "No eligible booking selected.", error: true });
      return;
    }
    setReviewSubmitting(true);
    setReviewMessage(null);
    try {
      await api.post(`/reviews/${id}`, {
        rating: reviewRating,
        comment: reviewComment,
        booking_id: parseInt(selectedBookingId),
      });
      setReviewMessage({ text: "Review submitted! Thank you.", error: false });
      setReviewRating(0);
      setReviewComment("");
      fetchReviews();
      fetchReviewableBookings();
    } catch (err) {
      setReviewMessage({
        text: err.response?.data?.message || "Failed to submit review.",
        error: true,
      });
    } finally { setReviewSubmitting(false); }
  };

  if (loading) return <CarDetailSkeleton />;
  if (!car)    return <PageWrapper>Car not found</PageWrapper>;

  const wishlisted = isWishlisted(car.id);

  const getPriceForDuration = duration => {
    if (!car.pricing || car.pricing.length === 0) return null;
    const slab = car.pricing.find(p => p.type === duration);
    return slab ? parseFloat(slab.price) : null;
  };

  const activePrice  = getPriceForDuration(selectedDuration);
  const activeSuffix = DURATION_CONFIG[selectedDuration].suffix;

const handleWishlistToggle = () => {
  // ✅ Check if user is logged in
  if (!user) {
    setShowAuth(true);
    return;
  }
  
  if (wishlisted) {
    removeFromWishlist(car.id);
    toast.custom(
      <div style={{ background: "white", padding: "16px 24px", borderRadius: "10px",marginTop: '50px',
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "20px" }}>💔</span>
        <span style={{ color: "#ef4444", fontWeight: "500" }}>
          {car.make} {car.model} removed from wishlist
        </span>
      </div>,
      { duration: 1500 }
    );
  } else {
    addToWishlist(car);
    toast.custom(
      <div style={{ background: "white", padding: "16px 24px", borderRadius: "10px",marginTop: '50px',
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "20px" }}>❤️</span>
        <span style={{ color: "#775a19", fontWeight: "500" }}>
          {car.make} {car.model} added to wishlist!
        </span>
      </div>,
      { duration: 1500 }
    );
  }
};

  const handleBookClick = () => {
    if (!user) {
      setShowAuth(true);
    } else if (!user.licence_image) {
      toast.error("Please upload your driving licence first to book a car", {
        duration: 4000, icon: "📄",
      });
    } else {
      setShowBooking(true);
    }
  };

  return (
    <PageWrapper>
      <TwoColumnLayout>
        <LeftColumn>

          {/* ── Gallery ── */}
          <GallerySection>
            {car.images && car.images.length > 0 ? (
              <>
                <MainImage
                  src={car.images[activeImage]?.image_url}
                  alt={`${car.make} ${car.model}`}
                />
                <Thumbnails>
                  {car.images.map((img, index) => (
                    <Thumbnail key={img.id} src={img.image_url}
                      $active={activeImage === index}
                      onClick={() => setActiveImage(index)} />
                  ))}
                </Thumbnails>
              </>
            ) : (
              <NoImage>No images available</NoImage>
            )}
          </GallerySection>

          {/* ── Header ── */}
          <CarHeader>
            <div>
              <CarTitle>{car.make} {car.model} ({car.year})</CarTitle>
              {totalReviews > 0 && (
                <RatingSummary style={{ marginTop: 6 }}>
                  <Stars rating={Math.round(averageRating)} size="16px" />
                  <AverageRating style={{ fontSize: "15px" }}>{averageRating}</AverageRating>
                  <TotalReviews>
                    ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                  </TotalReviews>
                </RatingSummary>
              )}
            </div>
            <WishlistButton $active={wishlisted} onClick={handleWishlistToggle}
              aria-label="Toggle Wishlist">
              <svg viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </WishlistButton>
          </CarHeader>
          <LocationText>📍 {car.location_name}{car.address ? ` — ${car.address}` : ''}</LocationText>

          {/* ── Specs ── */}
          <SpecsGrid>
            <SpecItem><SpecLabel>Category</SpecLabel><SpecValue>{car.category}</SpecValue></SpecItem>
            <SpecItem><SpecLabel>Transmission</SpecLabel><SpecValue>{car.transmission}</SpecValue></SpecItem>
            <SpecItem><SpecLabel>Fuel Type</SpecLabel><SpecValue>{car.fuel_type}</SpecValue></SpecItem>
            <SpecItem><SpecLabel>Seats</SpecLabel><SpecValue>{car.seats}</SpecValue></SpecItem>
          </SpecsGrid>

          {/* ── Features ── */}
          {car.features && car.features.length > 0 && (
            <FeaturesSection>
              <SectionTitle>Features</SectionTitle>
              <FeaturesList>
                {car.features.map((f, i) => (
                  <FeatureBadge key={i}>{f.feature_name}</FeatureBadge>
                ))}
              </FeaturesList>
            </FeaturesSection>
          )}

          {/* ── Description ── */}
          {car.description && (
            <DescriptionSection>
              <DescriptionTitle>About this car</DescriptionTitle>
              <DescriptionText>{car.description}</DescriptionText>
            </DescriptionSection>
          )}

          {/* ── Reviews ── */}
          <ReviewsSection>
            <ReviewsHeader>
              <ReviewsTitle>Reviews</ReviewsTitle>
              {totalReviews > 0 && (
                <RatingSummary>
                  <Stars rating={Math.round(averageRating)} size="20px" />
                  <AverageRating>{averageRating}</AverageRating>
                  <TotalReviews>/ 5 · {totalReviews} {totalReviews === 1 ? "review" : "reviews"}</TotalReviews>
                </RatingSummary>
              )}
            </ReviewsHeader>

            {user && reviewableBookings.length > 0 && (
              <ReviewFormBox>
                <ReviewFormTitle>Leave a Review</ReviewFormTitle>
                {reviewableBookings.length > 1 && (
                  <ReviewFormSelect value={selectedBookingId}
                    onChange={e => setSelectedBookingId(e.target.value)}>
                    {reviewableBookings.map(b => (
                      <option key={b.id} value={b.id}>
                        Booking #{b.id} — {formatDate(b.start_date)} to {formatDate(b.end_date)}
                      </option>
                    ))}
                  </ReviewFormSelect>
                )}
                <StarPicker>
                  {[1,2,3,4,5].map(n => (
                    <Star key={n} $filled={n <= reviewRating} $size="32px" $clickable
                      onClick={() => setReviewRating(n)}>★</Star>
                  ))}
                </StarPicker>
                <ReviewTextarea
                  placeholder="Share your experience with this car... (optional)"
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)} />
                <SubmitReviewBtn onClick={handleSubmitReview} disabled={reviewSubmitting}>
                  {reviewSubmitting ? "Submitting..." : "Submit Review"}
                </SubmitReviewBtn>
                {reviewMessage && (
                  <FormMessage $error={reviewMessage.error}>{reviewMessage.text}</FormMessage>
                )}
              </ReviewFormBox>
            )}

            {reviews.length === 0 ? (
              <NoReviews>No reviews yet. Be the first to review this car!</NoReviews>
            ) : (
              reviews.map(review => (
                <ReviewCard key={review.id}>
                  <ReviewMeta>
                    <ReviewerName>{review.user_name}</ReviewerName>
                    <ReviewDate>{formatDate(review.created_at)}</ReviewDate>
                  </ReviewMeta>
                  <Stars rating={review.rating} size="16px" />
                  {review.comment && <ReviewComment>{review.comment}</ReviewComment>}
                </ReviewCard>
              ))
            )}
          </ReviewsSection>

          <SimilarCars carId={id} duration={selectedDuration} />
        </LeftColumn>

        {/* ── Booking Panel ── */}
        <RightColumn>
          <BookingPanel>

            <DurationTabs>
              {['hourly', 'daily', 'weekly'].map(d => (
                <DurationTab key={d} $active={selectedDuration === d}
                  onClick={() => setSelectedDuration(d)}>
                  {d === 'hourly' ? '⏱ Hourly' : d === 'daily' ? '📅 Daily' : '🗓 Weekly'}
                </DurationTab>
              ))}
            </DurationTabs>

            <PanelHeader>
              {activePrice !== null ? (
                <>
                  <PanelPrice>₹{activePrice.toLocaleString('en-IN')}</PanelPrice>
                  <PanelUnit>{activeSuffix}</PanelUnit>
                </>
              ) : (
                <PanelPrice style={{ fontSize: "17px" }}>Contact for pricing</PanelPrice>
              )}
            </PanelHeader>

            <StatusBadge $status={car.status}>
              {car.status === "available" ? "✓ Available Now"
                : car.status === "on_rent" ? "⏳ Currently Rented"
                : "🔧 In Maintenance"}
            </StatusBadge>

            {car.pricing && car.pricing.length > 0 && (
              <PricingList>
                {car.pricing.map(p => (
                  <PricingRow key={p.id}>
                    <PricingType>{p.type}</PricingType>
                    <PricingAmount $highlight={p.type === selectedDuration}>
                      ₹{parseFloat(p.price).toLocaleString('en-IN')} /
                      {p.type === "hourly" ? "hr" : p.type === "daily" ? "day" : "week"}
                    </PricingAmount>
                  </PricingRow>
                ))}
              </PricingList>
            )}

            {!user && car.status === "available" && (
              <LoginNote>⚠️ Please login to book this car</LoginNote>
            )}

            <BookButton disabled={car.status !== "available"} onClick={handleBookClick}>
              {car.status !== "available" ? "Currently Unavailable"
                : user ? "Book This Car"
                : "Login to Book"}
            </BookButton>

            <PanelNote>Free cancellation up to 24 hours before pickup</PanelNote>
          </BookingPanel>
        </RightColumn>
      </TwoColumnLayout>

      {showBooking && (
        <BookingModal car={car} duration={selectedDuration} onClose={() => setShowBooking(false)} />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </PageWrapper>
  );
};

export default CarDetail;