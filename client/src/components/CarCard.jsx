import { useState } from "react";
import styled from "styled-components";
import toast from "react-hot-toast";
import { useWishlistContext } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import BookingModal from "./BookingModal";

// Add this helper at the top of CarCard.jsx
const fixCloudinaryUrl = (url) => {
  if (!url) return null
  if (url.includes('/upload/') && !url.includes('/upload/v')) {
    return url.replace('/upload/', '/upload/v')
  }
  return url
}

// Then update getImageUrl:
const getImageUrl = () => fixCloudinaryUrl(car.primary_image || car.image_url || null)
const CardContainer = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(26, 28, 28, 0.1);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
  }
`;

const ImageContainer = styled.div`
  aspect-ratio: 16/9;
  width: 100%;
  overflow: hidden;
  position: relative;
  background-color: #dadada;
`;

const CarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s ease;
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const CategoryBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(226, 226, 226, 0.8);
  backdrop-filter: blur(8px);
  padding: 4px 12px;
  border-radius: 9999px;
  border: 1px solid rgba(127, 118, 103, 0.1);
  span {
    font-family: "Inter", sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #4e4639;
  }
`;

const WishlistButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  &:hover {
    transform: scale(1.1);
  }
  &:active {
    transform: scale(0.95);
  }
  span {
    font-size: 1.25rem;
  }
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const Brand = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #775a19;
  margin-bottom: 4px;
`;

const Model = styled.h3`
  font-family: "Montserrat", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1a1c1c;
`;

const PriceContainer = styled.div`
  text-align: right;
`;

const PriceLabel = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #5f5e5e;
  margin-bottom: 4px;
`;

const Price = styled.p`
  font-family: "Montserrat", sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: #1a1c1c;
`;

const PriceSuffix = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #5f5e5e;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const FeatureItem = styled.div`
  background-color: #f3f3f3;
  padding: 0.75rem;
  border-radius: 0.75rem;
  text-align: center;
`;

const FeatureLabel = styled.p`
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #5f5e5e;
  margin-bottom: 4px;
`;

const FeatureValue = styled.p`
  font-family: "Montserrat", sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1a1c1c;
  text-transform: capitalize;
`;

const BookButton = styled.button`
  width: 100%;
  background-color: #c5a059;
  color: #4e3700;
  font-family: "Montserrat", sans-serif;
  font-size: 16px;
  font-weight: 600;
  padding: 1rem;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(197, 160, 89, 0.2);
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 24px rgba(197, 160, 89, 0.3);
  }
  &:active {
    transform: scale(0.98);
  }
`;

const DURATION_CONFIG = {
  hourly: { suffix: "/hr", slabType: "hourly" },
  daily: { suffix: "/day", slabType: "daily" },
  weekly: { suffix: "/week", slabType: "weekly" },
};

const CarCard = ({ car, duration = "daily" }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  // ✅ Also pull `user` directly — isAuthenticated may be a derived value
  // that's undefined during loading. Checking user directly is more reliable.
  const { isAuthenticated, user } = useAuth();
  const { addToWishlist, removeFromWishlist, isWishlisted } =
    useWishlistContext();

  const wishlisted = isWishlisted(car.id);

  // ✅ True if either isAuthenticated is truthy OR user object exists
  const loggedIn = !!(isAuthenticated || user);

  const handleWishlistClick = (e) => {
    e.stopPropagation();
     if (!loggedIn) {
    window.dispatchEvent(new CustomEvent('openAuthModal'))
    return
  }
    const carName = `${car.brand || car.make} ${car.model}`;
    if (wishlisted) {
      removeFromWishlist(car.id);
      toast.custom(
        <div
          style={{
             marginTop: '50px',
            background: "white",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          
          }}
        >
          <span style={{ fontSize: "18px" }}>💔</span>
          <span style={{ color: "#ef4444", fontWeight: "500" }}>
            {carName} removed from wishlist
          </span>
        </div>,
        { duration: 1000 },
      );
    } else {
      addToWishlist(car);
      toast.custom(
        <div
          style={{
            marginTop: '50px',
            background: "white",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "18px" }}>❤️</span>
          <span style={{ color: "#775a19", fontWeight: "500" }}>
            {carName} added to wishlist!
          </span>
        </div>,
        { duration: 1000 },
      );
    }
  };

  const handleBookNow = (e) => {
    e.stopPropagation();
    // ✅ Use loggedIn which checks both isAuthenticated and user object
    if (!loggedIn) {
      window.dispatchEvent(new CustomEvent("openAuthModal"));
      return;
    }
    setShowBookingModal(true);
  };

  const handleCardClick = () => {
    // Store scroll position before navigation
    sessionStorage.setItem("returnToTop", "true");
    window.location.href = `/cars/${car.id}?duration_type=${duration}`;
  };

  // ✅ FIX: check primary_image first, then image_url
  const getImageUrl = () => car.primary_image || car.image_url || null;

  const getPrice = () => {
    const config = DURATION_CONFIG[duration] || DURATION_CONFIG.daily;
    if (car.display_price != null && car.display_price !== "")
      return car.display_price;
    if (Array.isArray(car.pricing) && car.pricing.length > 0) {
      const slab = car.pricing.find(
        (p) => p.type?.toLowerCase() === config.slabType,
      );
      if (slab?.price != null) return slab.price;
    }
    const legacyMap = {
      hourly: car.hourly_price,
      daily: car.daily_price || car.price_per_day,
      weekly: car.weekly_price,
    };
    if (legacyMap[duration] != null) return legacyMap[duration];
    return car.min_price || car.price || 0;
  };

  const getDurationSuffix = () =>
    (DURATION_CONFIG[duration] || DURATION_CONFIG.daily).suffix;

  const imageUrl = getImageUrl();
  const price = getPrice();
  const suffix = getDurationSuffix();
  // Add this helper component inside CarCard.jsx (before the return statement)
  const CarImageWithFallback = ({ src, alt }) => {
    const [imgError, setImgError] = useState(false);

    if (imgError || !src) {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0f0f0",
          }}
        >
          <span style={{ fontSize: "3rem", color: "#7f7667", opacity: 0.3 }}>
            🚗
          </span>
        </div>
      );
    }

    return <CarImage src={src} alt={alt} onError={() => setImgError(true)} />;
  };
  return (
    <>
      <CardContainer onClick={handleCardClick}>
        <ImageContainer>
          <CarImageWithFallback
            src={imageUrl}
            alt={`${car.brand || car.make} ${car.model}`}
          />
          {imageUrl ? (
            <CarImage
              src={imageUrl}
              alt={`${car.brand || car.make} ${car.model}`}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f0f0f0",
              }}
            >
              <span
                style={{ fontSize: "3rem", color: "#7f7667", opacity: 0.3 }}
              >
                🚗
              </span>
            </div>
          )}
          <CategoryBadge>
            <span>{car.category || "Car"}</span>
          </CategoryBadge>
          <WishlistButton onClick={handleWishlistClick}>
            <span
              className="material-symbols-outlined"
              style={{ color: wishlisted ? "#ef4444" : "#1a1c1c" }}
            >
              {wishlisted ? "favorite" : "favorite_border"}
            </span>
          </WishlistButton>
        </ImageContainer>

        <Content>
          <Header>
            <div>
              <Brand>{car.brand || car.make}</Brand>
              <Model>{car.model}</Model>
            </div>
            <PriceContainer>
              <PriceLabel>Starting at</PriceLabel>
              <Price>
                ₹{Number(price).toLocaleString("en-IN")}
                <PriceSuffix>{suffix}</PriceSuffix>
              </Price>
            </PriceContainer>
          </Header>

          <FeaturesGrid>
            <FeatureItem>
              <FeatureLabel>Seats</FeatureLabel>
              <FeatureValue>{car.seats || 4}</FeatureValue>
            </FeatureItem>
            <FeatureItem>
              <FeatureLabel>Fuel</FeatureLabel>
              <FeatureValue>{car.fuel_type || "Petrol"}</FeatureValue>
            </FeatureItem>
            <FeatureItem>
              <FeatureLabel>Trans.</FeatureLabel>
              <FeatureValue>
                {car.transmission?.toLowerCase() === "automatic"
                  ? "Auto"
                  : car.transmission || "Manual"}
              </FeatureValue>
            </FeatureItem>
          </FeaturesGrid>

          <BookButton onClick={handleBookNow}>Book Now →</BookButton>
        </Content>
      </CardContainer>

      {showBookingModal && (
        <BookingModal
          car={car}
          duration={duration}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </>
  );
};

export default CarCard;
