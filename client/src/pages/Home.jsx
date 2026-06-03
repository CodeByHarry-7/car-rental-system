import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { HomeSkeleton } from "../components/SkeletonLoaders";

// Styled Components - Complete Design System
const PageContainer = styled.div`
  --color-primary: #775a19;
  --color-primary-container: #c5a059;
  --color-on-primary-container: #4e3700;
  --color-secondary: #5f5e5e;
  --color-surface: #f9f9f9;
  --color-surface-dim: #dadada;
  --color-surface-container-low: #f3f3f3;
  --color-surface-container-highest: #e2e2e2;
  --color-on-surface: #1a1c1c;
  --color-on-surface-variant: #4e4639;
  --color-outline: #7f7667;
  --color-error: #ba1a1a;
  
  --font-montserrat: 'Montserrat', sans-serif;
  --font-inter: 'Inter', sans-serif;
  
  background-color: var(--color-surface);
  color: var(--color-on-surface);
  font-family: var(--font-inter);
  min-height: 100vh;
  padding-bottom: 80px;
`;

const HeroSection = styled.section`
  position: relative;
  height: 80vh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, #1a1c1c 0%, #2d2f2f 100%);
  margin-bottom: 64px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1600') center/cover;
    opacity: 0.4;
    z-index: 0;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  color: white;
  padding: 0 20px;
  max-width: 800px;
`;

const HeroTitle = styled.h1`
  font-family: var(--font-montserrat);
  font-size: 64px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 40px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  line-height: 28px;
  margin-bottom: 32px;
  opacity: 0.9;
`;

const CTAButton = styled(Link)`
  display: inline-block;
  padding: 16px 48px;
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  text-decoration: none;
  font-family: var(--font-montserrat);
  font-weight: 600;
  font-size: 16px;
  border-radius: 9999px;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  
  &:hover {
    transform: scale(1.05);
    background: var(--color-primary);
    color: white;
  }
`;

const Container = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 64px;
  
  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

const Section = styled.section`
  margin-bottom: 64px;
`;

const SectionTitle = styled.h2`
  font-family: var(--font-montserrat);
  font-size: 40px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 32px;
  color: var(--color-on-surface);
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

const ViewAllLink = styled(Link)`
  color: var(--color-primary);
  text-decoration: none;
  font-family: var(--font-inter);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.7;
  }
`;

const CarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 32px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CarCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(32px);
  border: 1px solid rgba(26, 28, 28, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.08);
  }
`;

const CarImage = styled.div`
  aspect-ratio: 16/9;
  width: 100%;
  overflow: hidden;
  position: relative;
  background: var(--color-surface-dim);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.7s ease;
  }
  
  ${CarCard}:hover & img {
    transform: scale(1.05);
  }
`;

const CarBadge = styled.span`
  position: absolute;
  top: 16px;
  right: 16px;
  background: ${props => props.isLuxury ? 'rgba(197, 160, 89, 0.2)' : 'rgba(255, 255, 255, 0.8)'};
  backdrop-filter: blur(8px);
  padding: 4px 12px;
  border-radius: 9999px;
  font-family: var(--font-inter);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${props => props.isLuxury ? 'var(--color-primary)' : 'var(--color-on-surface-variant)'};
  border: 1px solid ${props => props.isLuxury ? 'rgba(197, 160, 89, 0.3)' : 'rgba(26, 28, 28, 0.1)'};
`;

const CarContent = styled.div`
  padding: 32px;
`;

const CarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`;

const CarBrand = styled.p`
  font-family: var(--font-inter);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: 4px;
`;

const CarModel = styled.h3`
  font-family: var(--font-montserrat);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-on-surface);
`;

const CarPrice = styled.div`
  text-align: right;
`;

const PriceLabel = styled.p`
  font-family: var(--font-inter);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-secondary);
  margin-bottom: 4px;
`;

const PriceAmount = styled.p`
  font-family: var(--font-montserrat);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-on-surface);
`;

const CarSpecs = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
`;

const SpecItem = styled.div`
  background: var(--color-surface-container-low);
  padding: 16px;
  border-radius: 12px;
  text-align: center;
`;

const SpecLabel = styled.p`
  font-family: var(--font-inter);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-secondary);
  margin-bottom: 4px;
`;

const SpecValue = styled.p`
  font-family: var(--font-montserrat);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-on-surface);
`;

const BookButton = styled.button`
  width: 100%;
  padding: 16px;
  background: var(--color-primary-container);
  color: var(--color-on-primary-container);
  border: none;
  border-radius: 9999px;
  font-family: var(--font-montserrat);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(197, 160, 89, 0.2);
  
  &:hover {
    transform: scale(1.02);
    background: var(--color-primary);
    color: white;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const StatsSection = styled.section`
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%);
  border-radius: 24px;
  padding: 64px;
  margin: 64px 0;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 40px 20px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 48px;
  margin-top: 48px;
`;

const StatItem = styled.div`
  color: white;
`;

const StatNumber = styled.div`
  font-family: var(--font-montserrat);
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-family: var(--font-inter);
  font-size: 14px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.9;
`;

const FeaturesSection = styled.section`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  margin: 64px 0;
`;

const FeatureCard = styled.div`
  text-align: center;
  padding: 32px;
  background: var(--color-surface-container-low);
  border-radius: 16px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const FeatureTitle = styled.h3`
  font-family: var(--font-montserrat);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--color-on-surface);
`;

const FeatureDescription = styled.p`
  font-family: var(--font-inter);
  font-size: 14px;
  line-height: 20px;
  color: var(--color-on-surface-variant);
`;

// Main Component
const Home = () => {
  const [loading, setLoading] = useState(true);
  const [featuredCars, setFeaturedCars] = useState([]);

  const observerRef = useRef(null);

  useEffect(() => {
    // Simulate loading delay (remove this when you connect to real API)
    const timer = setTimeout(() => {
      setFeaturedCars([
        {
          id: 1,
          brand: "Porsche",
          model: "911 GT3 RS",
          dailyRate: 45000,
          category: "Luxury",
          seats: 2,
          fuel: "Petrol",
          transmission: "Auto",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu9tB-ou5lidtRXCAjXq6hxpDWXxqGYKsYZ-L4UblKOW9xWG91Whe-L8QA0Q9D66TF4nhzADjhN2ndr_wBbT_fx8XGGSYyo-Q2KnZFSqhyK-gxI9ryvF465qaqVsMKhm-TUlRNQs505HlkGTcbhHrEzawEsOb4iBJz-m8_hS0F7ppDatLwnZwHsYj8WbNaqkkgDwVKTaSK-1P9qwz2TrYAQ_Zsso_2RehxU3beEkZOt7Bke-dIIuJYVtkNKbz_s8OFfGGYXT2ezH4B"
        },
        {
          id: 2,
          brand: "Bentley",
          model: "Bentayga EWB",
          dailyRate: 55000,
          category: "SUV",
          seats: 5,
          fuel: "Diesel",
          transmission: "Auto",
          image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzazFoqTAU-jU68lRXN32sx-UGhu0jFnJqlIW9uRYf0Oi87jGBuUEtoeg3zC3p2AH9BDCTzYcBqTXGd3ipfO0XR7E0gVOI8JhlR_-kFvtr_0UrkNTvoWBh7z2YxQnIWQeL2SA5c846VfE9SssuH_erl4611HVLehR8ikJE_CTdyfDRxrQoUmnNfmFV8d2ZCn9c0o03a7TOBYc2YvJiwto92sbtp8feLcW3mwlQ59YBtGQdY5JlDBPs4s2PVODoSySlL0TW_EAdYyvf"
        },
        {
          id: 3,
          brand: "Lamborghini",
          model: "Urus Performante",
          dailyRate: 62000,
          category: "SUV",
          seats: 5,
          fuel: "Petrol",
          transmission: "Auto",
          image: null
        }
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      const observerOptions = { threshold: 0.1 };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, observerOptions);

      const cards = document.querySelectorAll('.fade-in-up');
      cards.forEach(card => observer.observe(card));

      return () => observer.disconnect();
    }
  }, [loading]);

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <PageContainer>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroTitle>Drive Beyond Limits</HeroTitle>
          <HeroSubtitle>
            Experience luxury and performance with our premium fleet of vehicles. 
            From sports cars to SUVs, find your perfect drive today.
          </HeroSubtitle>
          <CTAButton to="/cars">Explore Fleet</CTAButton>
        </HeroContent>
      </HeroSection>

      <Container>
        {/* Featured Cars */}
        <Section>
          <SectionHeader>
            <SectionTitle>Featured Vehicles</SectionTitle>
            <ViewAllLink to="/cars">View All →</ViewAllLink>
          </SectionHeader>
          <CarGrid>
            {featuredCars.map((car, index) => (
              <CarCard key={car.id} className="fade-in-up" style={{ 
                opacity: 0, 
                transform: 'translateY(20px)',
                transition: `opacity 0.7s ease-out ${index * 0.1}s, transform 0.7s ease-out ${index * 0.1}s`
              }}>
                <CarImage>
                  {car.image ? (
                    <img src={car.image} alt={car.model} />
                  ) : (
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: 'var(--color-surface-dim)'
                    }}>
                      <span style={{ fontSize: '48px', opacity: 0.3 }}>🚗</span>
                    </div>
                  )}
                  <CarBadge isLuxury={car.category === 'Luxury'}>{car.category}</CarBadge>
                </CarImage>
                <CarContent>
                  <CarHeader>
                    <div>
                      <CarBrand>{car.brand}</CarBrand>
                      <CarModel>{car.model}</CarModel>
                    </div>
                    <CarPrice>
                      <PriceLabel>Daily Rate</PriceLabel>
                      <PriceAmount>₹{car.dailyRate.toLocaleString()}</PriceAmount>
                    </CarPrice>
                  </CarHeader>
                  <CarSpecs>
                    <SpecItem>
                      <SpecLabel>Seats</SpecLabel>
                      <SpecValue>{car.seats}</SpecValue>
                    </SpecItem>
                    <SpecItem>
                      <SpecLabel>Fuel</SpecLabel>
                      <SpecValue>{car.fuel}</SpecValue>
                    </SpecItem>
                    <SpecItem>
                      <SpecLabel>Trans.</SpecLabel>
                      <SpecValue>{car.transmission}</SpecValue>
                    </SpecItem>
                  </CarSpecs>
                  <BookButton>Book Now</BookButton>
                </CarContent>
              </CarCard>
            ))}
          </CarGrid>
        </Section>

        {/* Stats Section */}
        <StatsSection>
          <SectionTitle style={{ color: 'white', marginBottom: '16px' }}>
            Why Choose DriveSphere?
          </SectionTitle>
          <StatsGrid>
            <StatItem>
              <StatNumber>500+</StatNumber>
              <StatLabel>Luxury Vehicles</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>98%</StatNumber>
              <StatLabel>Customer Satisfaction</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>24/7</StatNumber>
              <StatLabel>Roadside Support</StatLabel>
            </StatItem>
            <StatItem>
              <StatNumber>15+</StatNumber>
              <StatLabel>Years of Excellence</StatLabel>
            </StatItem>
          </StatsGrid>
        </StatsSection>

        {/* Features Section */}
        <FeaturesSection>
          <FeatureCard className="fade-in-up" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease-out 0.2s, transform 0.7s ease-out 0.2s' }}>
            <FeatureIcon>🔒</FeatureIcon>
            <FeatureTitle>Secure Booking</FeatureTitle>
            <FeatureDescription>
              Safe and encrypted booking process with instant confirmation
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard className="fade-in-up" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease-out 0.3s, transform 0.7s ease-out 0.3s' }}>
            <FeatureIcon>🛡️</FeatureIcon>
            <FeatureTitle>Full Insurance</FeatureTitle>
            <FeatureDescription>
              Comprehensive coverage for peace of mind on every journey
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard className="fade-in-up" style={{ opacity: 0, transform: 'translateY(20px)', transition: 'opacity 0.7s ease-out 0.4s, transform 0.7s ease-out 0.4s' }}>
            <FeatureIcon>🎯</FeatureIcon>
            <FeatureTitle>Best Price Guarantee</FeatureTitle>
            <FeatureDescription>
              Competitive rates with no hidden charges or fees
            </FeatureDescription>
          </FeatureCard>
        </FeaturesSection>

        {/* CTA Banner */}
        <Section style={{ 
          background: 'linear-gradient(135deg, var(--color-surface-container-low) 0%, var(--color-surface-dim) 100%)',
          borderRadius: '24px',
          padding: '64px',
          textAlign: 'center'
        }}>
          <SectionTitle>Ready to Experience Luxury?</SectionTitle>
          <p style={{ marginBottom: '32px', fontSize: '18px', color: 'var(--color-on-surface-variant)' }}>
            Join thousands of satisfied customers who trust DriveSphere for their premium car rental needs
          </p>
          <CTAButton to="/cars" style={{ background: 'var(--color-primary)', color: 'white' }}>
            Get Started
          </CTAButton>
        </Section>
      </Container>
    </PageContainer>
  );
};

export default Home;