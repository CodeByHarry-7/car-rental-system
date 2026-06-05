import { useState, useEffect, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { api } from "../context/AuthContext";
import CarImages from "../components/CarImages";

// ── Design Tokens (Light Luxury) ──────────────────────────────────────────────

const T = {
  // Gold accent — brand colour, used for CTAs / focus / highlights only
  gold:        "#775A19",
  goldLight:   "#a07c2a",
  goldPale:    "#f5efe0",
  goldBorder:  "rgba(119,90,25,0.25)",
  goldGlow:    "rgba(119,90,25,0.12)",
  goldGlowFoc: "rgba(119,90,25,0.18)",

  // Page & surface
  pageBg:      "#f4f5f7",
  surface:     "#ffffff",
  surfaceAlt:  "#fafafa",
  surfaceHov:  "#f7f4ee",

  // Borders
  border:      "#e5e7eb",
  borderMid:   "#d1d5db",

  // Text
  text:        "#111827",
  textMid:     "#6b7280",
  textDim:     "#9ca3af",

  // States
  danger:      "#dc2626",
  dangerBg:    "rgba(220,38,38,0.07)",
  dangerBord:  "rgba(220,38,38,0.2)",
  green:       "#16a34a",
  greenBg:     "rgba(22,163,74,0.08)",
  greenBord:   "rgba(22,163,74,0.25)",
  amber:       "#d97706",
  amberBg:     "rgba(217,119,6,0.08)",

  // Radii
  r:    "14px",
  rSm:  "9px",
  rLg:  "20px",

  // Shadows
  shadow:    "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)",
  shadowMd:  "0 4px 24px rgba(0,0,0,0.10)",
  shadowLg:  "0 8px 48px rgba(0,0,0,0.14)",

  font:        "'DM Sans', 'Inter', sans-serif",
  fontDisplay: "'Playfair Display', Georgia, serif",
};

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn  = keyframes`from{opacity:0}to{opacity:1}`;
const slideUp = keyframes`from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}`;
const scaleIn = keyframes`from{opacity:0;transform:scale(0.97)}to{opacity:1;transform:scale(1)}`;
const spin    = keyframes`from{transform:rotate(0deg)}to{transform:rotate(360deg)}`;
const progAnim= keyframes`from{background-position:0 0}to{background-position:40px 0}`;

// ── Page ──────────────────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  background: ${T.pageBg};
  padding: 32px;
  font-family: ${T.font};
  @media(max-width:768px){ padding:20px 16px; }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
`;

const PageTitle = styled.h1`
  font-family: ${T.fontDisplay};
  font-size: 30px;
  font-weight: 600;
  color: ${T.text};
  margin: 0;
  letter-spacing: -0.02em;
  span { color: ${T.gold}; }
  @media(max-width:768px){ font-size:24px; }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  background: ${T.gold};
  color: #fff;
  border: none;
  border-radius: ${T.rSm};
  font-size: 14px;
  font-weight: 600;
  font-family: ${T.font};
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(119,90,25,0.25);

  &:hover {
    background: ${T.goldLight};
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(119,90,25,0.35);
  }
  &:active { transform: translateY(0); }
  svg { width:15px; height:15px; }
`;

// ── Table ─────────────────────────────────────────────────────────────────────

const TableWrapper = styled.div`
  background: ${T.surface};
  border-radius: ${T.r};
  border: 1px solid ${T.border};
  box-shadow: ${T.shadow};
  overflow: hidden;
`;

const TableTopBar = styled.div`
  padding: 18px 24px;
  border-bottom: 1px solid ${T.border};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TableLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: ${T.textDim};
`;

const CarCount = styled.span`
  background: ${T.goldPale};
  color: ${T.gold};
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 680px;
`;

const Th = styled.th`
  padding: 12px 20px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${T.textDim};
  background: ${T.surfaceAlt};
  border-bottom: 1px solid ${T.border};
`;

const Tr = styled.tr`
  transition: background 0.15s ease;
  &:hover td, &:hover .action-cell { background: ${T.surfaceHov}; }
  &:last-child td, &:last-child .action-cell { border-bottom: none; }
`;

const Td = styled.td`
  padding: 15px 20px;
  font-size: 14px;
  color: ${T.textMid};
  border-bottom: 1px solid ${T.border};
  transition: background 0.15s ease;
  vertical-align: middle;
`;

const CarName = styled.div`
  font-weight: 600;
  color: ${T.text};
  font-size: 14px;
`;
const CarMeta = styled.div`
  font-size: 12px;
  color: ${T.textDim};
  margin-top: 2px;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  &::before { content:''; width:5px; height:5px; border-radius:50%; background:currentColor; }
  ${p => {
    if (p.$s==='available')   return css`background:${T.greenBg};color:${T.green};`;
    if (p.$s==='on_rent')     return css`background:${T.amberBg};color:${T.amber};`;
    if (p.$s==='maintenance') return css`background:${T.dangerBg};color:${T.danger};`;
    return css`background:#f3f4f6;color:${T.textMid};`;
  }}
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 72px 32px;
  color: ${T.textDim};
  svg { width:44px; height:44px; stroke:${T.textDim}; margin-bottom:14px; opacity:0.4; }
  p { font-size:15px; color:${T.textMid}; margin:0 0 4px; }
  span { font-size:13px; }
`;

// ── Dropdown ──────────────────────────────────────────────────────────────────

const ActionCell = styled.td.attrs({ className: 'action-cell' })`
  padding: 10px 16px;
  border-bottom: 1px solid ${T.border};
  position: relative;
  transition: background 0.15s ease;
`;

const DotsBtn = styled.button`
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 7px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${T.textDim};
  transition: all 0.15s ease;
  &:hover { background: ${T.surfaceAlt}; border-color: ${T.border}; color: ${T.text}; }
  svg { width:17px; height:17px; }
`;

const DropMenu = styled.div`
  position: absolute;
  top: calc(100% - 4px);
  right: 12px;
  background: ${T.surface};
  border: 1px solid ${T.border};
  border-radius: ${T.r};
  box-shadow: ${T.shadowMd};
  z-index: 200;
  min-width: 175px;
  overflow: hidden;
  animation: ${scaleIn} 0.15s ease;
`;

const DropItem = styled.button`
  width: 100%;
  padding: 11px 15px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  font-size: 13px;
  font-family: ${T.font};
  color: ${T.textMid};
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.15s ease;
  svg { width:14px; height:14px; stroke:currentColor; flex-shrink:0; }
  &:hover { background: ${T.surfaceHov}; color: ${T.text}; }
  ${p => p.$danger && css`color:${T.danger}; &:hover{background:${T.dangerBg};color:${T.danger};}`}
`;

const DropDivider = styled.div`
  height: 1px;
  background: ${T.border};
  margin: 3px 0;
`;

// ── Modal Shell ────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15,15,20,0.55);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: ${fadeIn} 0.2s ease;
`;

const ModalCard = styled.div`
  background: ${T.surface};
  border: 1px solid ${T.border};
  border-radius: ${T.rLg};
  width: 100%;
  max-width: ${p => p.$wide ? '940px' : '560px'};
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${T.shadowLg};
  animation: ${slideUp} 0.28s ease;
`;

const ModalHead = styled.div`
  padding: 26px 30px 22px;
  border-bottom: 1px solid ${T.border};
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-shrink: 0;
  background: ${T.surface};
  @media(max-width:480px){ padding:20px; }
`;

const ModalTitle = styled.h2`
  font-family: ${T.fontDisplay};
  font-size: 22px;
  font-weight: 600;
  color: ${T.text};
  margin: 0 0 3px;
  letter-spacing: -0.02em;
`;

const ModalSubtitle = styled.p`
  font-size: 13px;
  color: ${T.textDim};
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: 1px solid ${T.border};
  border-radius: 8px;
  cursor: pointer;
  padding: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${T.textMid};
  transition: all 0.15s ease;
  flex-shrink: 0;
  &:hover { background: ${T.surfaceAlt}; border-color: ${T.borderMid}; color: ${T.text}; }
  svg { width:17px; height:17px; stroke:currentColor; }
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 28px 30px;
  background: ${T.surface};
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  @media(max-width:480px){ padding:20px; }
`;

const ModalFoot = styled.div`
  padding: 18px 30px;
  border-top: 1px solid ${T.border};
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
  background: ${T.surfaceAlt};
  @media(max-width:480px){ padding:14px 20px; }
`;

// ── Section structure ─────────────────────────────────────────────────────────

const SectionBlock = styled.div`
  margin-bottom: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid ${T.border};
  &:last-child { margin-bottom:0; padding-bottom:0; border-bottom:none; }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const SectionNum = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: ${T.goldPale};
  color: ${T.gold};
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const SectionTitle = styled.h3`
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${T.text};
  margin: 0;
  flex: 1;
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${T.border};
`;

// ── Form fields ───────────────────────────────────────────────────────────────

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media(max-width:480px){ grid-template-columns:1fr; }
`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  @media(max-width:600px){ grid-template-columns:1fr 1fr; }
  @media(max-width:400px){ grid-template-columns:1fr; }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 0;
`;

const Spacer = styled.div`
  margin-bottom: ${p => p.$h || '14px'};
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${T.textMid};
`;

const inputBase = css`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 13px;
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.rSm};
  font-size: 14px;
  font-family: ${T.font};
  color: ${T.text};
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &::placeholder { color: ${T.textDim}; }
  &:hover { border-color: ${T.borderMid}; }
  &:focus {
    border-color: ${T.gold};
    box-shadow: 0 0 0 3px ${T.goldGlowFoc};
  }
`;

const Input    = styled.input`${inputBase}`;
const Textarea = styled.textarea`${inputBase} resize:vertical; min-height:76px;`;
const Select   = styled.select`
  ${inputBase}
  cursor: pointer;
  option { background:${T.surface}; color:${T.text}; }
`;

// ── Buttons ────────────────────────────────────────────────────────────────────

const BtnPrimary = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 22px;
  background: ${T.gold};
  color: #fff;
  border: none;
  border-radius: ${T.rSm};
  font-size: 14px;
  font-weight: 600;
  font-family: ${T.font};
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(119,90,25,0.2);
  &:hover:not(:disabled) { background:${T.goldLight}; transform:translateY(-1px); box-shadow:0 4px 14px rgba(119,90,25,0.3); }
  &:active:not(:disabled) { transform:translateY(0); }
  &:disabled { opacity:0.55; cursor:not-allowed; }
  svg { width:14px; height:14px; flex-shrink:0; }
`;

const BtnSecondary = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 11px 18px;
  background: ${T.surface};
  color: ${T.textMid};
  border: 1.5px solid ${T.border};
  border-radius: ${T.rSm};
  font-size: 14px;
  font-family: ${T.font};
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { background:${T.surfaceAlt}; border-color:${T.borderMid}; color:${T.text}; }
`;

const BtnDanger = styled(BtnPrimary)`
  background: ${T.danger};
  box-shadow: 0 2px 8px rgba(220,38,38,0.18);
  &:hover:not(:disabled) { background:#b91c1c; box-shadow:0 4px 14px rgba(220,38,38,0.3); }
`;

// ── Image Upload (Add Car inline) ─────────────────────────────────────────────

const DropZone = styled.div`
  border: 2px dashed ${p => p.$active ? T.gold : T.border};
  border-radius: ${T.r};
  padding: 28px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${p => p.$active ? T.goldPale : T.surfaceAlt};
  &:hover { border-color:${T.gold}; background:${T.goldPale}; }
  svg { width:30px; height:30px; stroke:${p => p.$active ? T.gold : T.textDim}; margin-bottom:10px; transition:stroke 0.2s; }
  p { margin:0 0 3px; font-size:14px; color:${p => p.$active ? T.gold : T.textMid}; font-weight:500; transition:color 0.2s; }
  span { font-size:12px; color:${T.textDim}; }
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  margin-top: 14px;
`;

const ImageThumb = styled.div`
  position: relative;
  aspect-ratio: 4/3;
  border-radius: ${T.rSm};
  overflow: hidden;
  border: 2px solid ${p => p.$primary ? T.gold : T.border};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:hover .overlay { opacity:1; }
  ${p => p.$primary && css`box-shadow: 0 0 0 3px ${T.goldGlow};`}
  img { width:100%; height:100%; object-fit:cover; display:block; }
`;

const ImgOverlay = styled.div.attrs({ className: 'overlay' })`
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const ImgActionBtn = styled.button`
  padding: 4px 9px;
  border: none;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  font-family: ${T.font};
  cursor: pointer;
  transition: opacity 0.15s;
  &:hover { opacity:0.85; }
  background: ${p => p.$gold ? T.gold : T.danger};
  color: white;
`;

const PrimaryBadge = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  background: ${T.gold};
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 4px;
`;

// Upload progress bar
const ProgressWrap = styled.div`
  margin-top: 14px;
  background: ${T.surfaceAlt};
  border: 1px solid ${T.border};
  border-radius: ${T.rSm};
  padding: 14px 16px;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: ${T.textMid};
  margin-bottom: 8px;
  font-weight: 500;
`;

const ProgressTrack = styled.div`
  height: 6px;
  background: ${T.border};
  border-radius: 99px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, ${T.gold}, ${T.goldLight});
  width: ${p => p.$pct}%;
  transition: width 0.3s ease;
`;

const ImagesMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
`;

const ImgCountLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${T.gold};
  background: ${T.goldPale};
  padding: 3px 10px;
  border-radius: 20px;
`;

const ImgHint = styled.span`
  font-size: 12px;
  color: ${T.textDim};
`;

// ── Pricing (Add Car inline) ───────────────────────────────────────────────────

const PricingRow = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.2fr auto;
  gap: 10px;
  align-items: end;
  padding: 14px;
  background: ${T.surfaceAlt};
  border: 1.5px solid ${T.border};
  border-radius: ${T.rSm};
  margin-bottom: 8px;
  transition: border-color 0.2s;
  &:hover { border-color:${T.borderMid}; }
  @media(max-width:600px){ grid-template-columns:1fr; }
`;

const PricingAddRow = styled(PricingRow)`
  border-style: dashed;
  background: transparent;
  margin-bottom: 0;
`;

const SlabLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${T.textDim};
  margin-bottom: 5px;
`;

const SmInput = styled.input`
  ${inputBase}
  padding: 8px 11px;
  font-size: 13px;
`;

const SmSelect = styled.select`
  ${inputBase}
  padding: 8px 11px;
  font-size: 13px;
  cursor: pointer;
  option { background:${T.surface}; color:${T.text}; }
`;

const SlabVal = styled.div`
  padding: 8px 11px;
  background: ${T.surface};
  border: 1.5px solid ${T.border};
  border-radius: ${T.rSm};
  font-size: 13px;
  color: ${p => p.$gold ? T.gold : T.text};
  font-weight: ${p => p.$gold ? 600 : 400};
  text-transform: ${p => p.$cap ? 'capitalize' : 'none'};
`;

const DelSlabBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  background: ${T.dangerBg};
  border: 1.5px solid ${T.dangerBord};
  border-radius: ${T.rSm};
  color: ${T.danger};
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover { background: rgba(220,38,38,0.14); }
  svg { width:14px; height:14px; stroke:currentColor; }
`;

const AddSlabBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 14px;
  background: ${T.greenBg};
  border: 1.5px solid ${T.greenBord};
  border-radius: ${T.rSm};
  color: ${T.green};
  font-size: 12px;
  font-weight: 700;
  font-family: ${T.font};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
  &:hover { background:rgba(22,163,74,0.14); }
  &:disabled { opacity:0.4; cursor:not-allowed; }
  svg { width:13px; height:13px; stroke:currentColor; }
`;

const EditSlabBtn = styled(AddSlabBtn)`
  background: ${T.goldGlow};
  border-color: ${T.goldBorder};
  color: ${T.gold};
  &:hover { background:rgba(119,90,25,0.18); }
`;

// ── Manage Pricing modal (existing cars) ─────────────────────────────────────

const emptySlabForm = { type:'daily', duration_value:'', price:'' };

const PricingModalContent = ({ carId }) => {
  const [slabs,      setSlabs     ] = useState([]);
  const [form,       setForm      ] = useState(emptySlabForm);
  const [saving,     setSaving    ] = useState(false);
  const [editingId,  setEditingId ] = useState(null);
  const [editForm,   setEditForm  ] = useState({});

  useEffect(() => { fetchSlabs(); }, [carId]);

  const fetchSlabs = async () => {
    try { const r = await api.get(`/pricing/${carId}`); setSlabs(r.data); }
    catch(e) { console.error(e); }
  };

  const handleAdd = async () => {
    if (!form.duration_value || !form.price) return;
    setSaving(true);
    try {
      await api.post('/pricing', { car_id:carId, type:form.type, duration_value:parseInt(form.duration_value), price:parseFloat(form.price) });
      setForm(emptySlabForm); fetchSlabs();
    } catch(e) { alert(e.response?.data?.message || 'Failed to add pricing'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/pricing/${id}`); fetchSlabs(); }
    catch(e) { alert('Failed to delete'); }
  };

  const handleEditSave = async (id) => {
    try {
      await api.put(`/pricing/${id}`, { type:editForm.type, duration_value:parseInt(editForm.duration_value), price:parseFloat(editForm.price) });
      setEditingId(null); fetchSlabs();
    } catch(e) { alert('Failed to update'); }
  };

  const PRICE_TYPES = ['hourly','daily','weekly'];

  return (
    <div>
      {slabs.length === 0 && (
        <div style={{ padding:'20px', textAlign:'center', color:T.textDim, fontSize:14, background:T.surfaceAlt, borderRadius:T.rSm, border:`1.5px dashed ${T.border}`, marginBottom:14 }}>
          No pricing slabs yet. Add one below.
        </div>
      )}
      {slabs.map(slab => (
        <PricingRow key={slab.id}>
          {editingId === slab.id ? (
            <>
              <div><SlabLabel>Type</SlabLabel><SmSelect value={editForm.type} onChange={e=>setEditForm({...editForm,type:e.target.value})}>{PRICE_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</SmSelect></div>
              <div><SlabLabel>Duration</SlabLabel><SmInput type="number" value={editForm.duration_value} onChange={e=>setEditForm({...editForm,duration_value:e.target.value})} /></div>
              <div><SlabLabel>Price (₹)</SlabLabel><SmInput type="number" value={editForm.price} onChange={e=>setEditForm({...editForm,price:e.target.value})} /></div>
              <div style={{display:'flex',gap:6}}>
                <AddSlabBtn onClick={()=>handleEditSave(slab.id)}>
                  <svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" strokeWidth="2.5"/></svg>Save
                </AddSlabBtn>
                <DelSlabBtn onClick={()=>setEditingId(null)}>
                  <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/></svg>
                </DelSlabBtn>
              </div>
            </>
          ) : (
            <>
              <div><SlabLabel>Type</SlabLabel><SlabVal $cap>{slab.type}</SlabVal></div>
              <div><SlabLabel>Duration</SlabLabel><SlabVal>{slab.duration_value}</SlabVal></div>
              <div><SlabLabel>Price</SlabLabel><SlabVal $gold>₹{parseFloat(slab.price).toLocaleString('en-IN')}</SlabVal></div>
              <div style={{display:'flex',gap:6}}>
                <EditSlabBtn onClick={()=>{setEditingId(slab.id);setEditForm({type:slab.type,duration_value:slab.duration_value,price:slab.price});}}>
                  <svg viewBox="0 0 24 24" fill="none"><path d="M17 3l4 4-7 7H10v-4l7-7z" strokeWidth="1.5"/></svg>Edit
                </EditSlabBtn>
                <DelSlabBtn onClick={()=>handleDelete(slab.id)}>
                  <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" strokeWidth="1.5"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="1.5"/></svg>
                </DelSlabBtn>
              </div>
            </>
          )}
        </PricingRow>
      ))}
      <PricingAddRow>
        <div><SlabLabel>Type</SlabLabel><SmSelect value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{PRICE_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</SmSelect></div>
        <div><SlabLabel>Duration</SlabLabel><SmInput type="number" placeholder="e.g. 1" value={form.duration_value} onChange={e=>setForm({...form,duration_value:e.target.value})} /></div>
        <div><SlabLabel>Price (₹)</SlabLabel><SmInput type="number" placeholder="e.g. 1500" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
        <AddSlabBtn onClick={handleAdd} disabled={saving||!form.duration_value||!form.price}>
          <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5"/></svg>
          {saving ? 'Adding…' : 'Add'}
        </AddSlabBtn>
      </PricingAddRow>
    </div>
  );
};

// ── Inline Pricing (Add Car — local only, no API until Create) ────────────────

const InlinePricing = ({ slabs, setSlabs }) => {
  const [form, setForm] = useState(emptySlabForm);
  const PRICE_TYPES = ['hourly','daily','weekly'];

  const add = () => {
    if (!form.duration_value || !form.price) return;
    setSlabs(prev => [...prev, { ...form, id:`loc_${Date.now()}_${Math.random().toString(36).slice(2)}`, duration_value:parseInt(form.duration_value), price:parseFloat(form.price) }]);
    setForm(emptySlabForm);
  };

  const remove = (id) => setSlabs(prev => prev.filter(s => s.id !== id));

  return (
    <div>
      {slabs.map(s => (
        <PricingRow key={s.id}>
          <div><SlabLabel>Type</SlabLabel><SlabVal $cap>{s.type}</SlabVal></div>
          <div><SlabLabel>Duration</SlabLabel><SlabVal>{s.duration_value}</SlabVal></div>
          <div><SlabLabel>Price</SlabLabel><SlabVal $gold>₹{s.price.toLocaleString('en-IN')}</SlabVal></div>
          <DelSlabBtn onClick={()=>remove(s.id)}>
            <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" strokeWidth="1.5"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="1.5"/></svg>
          </DelSlabBtn>
        </PricingRow>
      ))}
      <PricingAddRow>
        <div><SlabLabel>Type</SlabLabel><SmSelect value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{PRICE_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</SmSelect></div>
        <div><SlabLabel>Duration</SlabLabel><SmInput type="number" placeholder="e.g. 1" value={form.duration_value} onChange={e=>setForm({...form,duration_value:e.target.value})} /></div>
        <div><SlabLabel>Price (₹)</SlabLabel><SmInput type="number" placeholder="e.g. 1500" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} /></div>
        <AddSlabBtn onClick={add} disabled={!form.duration_value||!form.price}>
          <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" strokeWidth="2.5"/><line x1="5" y1="12" x2="19" y2="12" strokeWidth="2.5"/></svg>Add
        </AddSlabBtn>
      </PricingAddRow>
    </div>
  );
};

// ── Inline Image Manager (Add Car) ────────────────────────────────────────────

const InlineImages = ({ images, setImages, uploadProgress }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const handleFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const newImgs = valid.map(f => ({
      id: `loc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      is_primary: false,
    }));
    setImages(prev => {
      const merged = [...prev, ...newImgs];
      // Auto-assign primary to first image if none set
      if (merged.length > 0 && !merged.some(i => i.is_primary)) {
        merged[0] = { ...merged[0], is_primary: true };
      }
      return merged;
    });
  };

  const remove = (id) => {
    setImages(prev => {
      const filtered = prev.filter(i => i.id !== id);
      if (filtered.length > 0 && !filtered.some(i => i.is_primary)) {
        filtered[0] = { ...filtered[0], is_primary: true };
      }
      return filtered;
    });
  };

  const setPrimary = (id) => {
    setImages(prev => prev.map(i => ({ ...i, is_primary: i.id === id })));
  };

  const isUploading = uploadProgress !== null;

  return (
    <div>
      <DropZone
        $active={dragActive}
        onClick={() => !isUploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); if (!isUploading) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => {
          e.preventDefault();
          setDragActive(false);
          if (!isUploading) handleFiles(e.dataTransfer.files);
        }}
        style={isUploading ? { pointerEvents:'none', opacity:0.6 } : {}}
      >
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="1.8" strokeLinecap="round"/>
          <polyline points="17 8 12 3 7 8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <line x1="12" y1="3" x2="12" y2="15" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <p>{dragActive ? 'Drop images here' : 'Drag & drop car images'}</p>
        <span>or click to browse · JPG, PNG, WEBP</span>
      </DropZone>
      <input ref={inputRef} type="file" multiple accept="image/*"
        style={{ display:'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value=''; }} />

      {/* Upload progress bar */}
      {isUploading && (
        <ProgressWrap>
          <ProgressLabel>
            <span>Uploading images…</span>
            <span>{Math.round(uploadProgress)}%</span>
          </ProgressLabel>
          <ProgressTrack><ProgressFill $pct={uploadProgress} /></ProgressTrack>
        </ProgressWrap>
      )}

      {images.length > 0 && (
        <>
          <ImagesMeta>
            <ImgCountLabel>{images.length} image{images.length !== 1 ? 's' : ''} selected</ImgCountLabel>
            <ImgHint>Hover to set primary or remove</ImgHint>
          </ImagesMeta>
          <ImageGrid>
            {images.map(img => (
              <ImageThumb key={img.id} $primary={img.is_primary}>
                <img src={img.previewUrl} alt="" />
                {img.is_primary && <PrimaryBadge>Primary</PrimaryBadge>}
                <ImgOverlay>
                  {!img.is_primary && (
                    <ImgActionBtn $gold onClick={() => setPrimary(img.id)}>★ Primary</ImgActionBtn>
                  )}
                  <ImgActionBtn onClick={() => remove(img.id)}>Remove</ImgActionBtn>
                </ImgOverlay>
              </ImageThumb>
            ))}
          </ImageGrid>
        </>
      )}
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────

const ToastWrap = styled.div`
  position: fixed;
  bottom: 28px;
  right: 28px;
  z-index: 9999;
  animation: ${slideUp} 0.3s ease;
`;

const ToastInner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: ${T.surface};
  border: 1px solid ${p => p.$err ? T.dangerBord : T.greenBord};
  border-radius: ${T.r};
  box-shadow: ${T.shadowMd};
  max-width: 340px;
  svg { width:18px; height:18px; stroke:${p => p.$err ? T.danger : T.green}; flex-shrink:0; }
  span { font-size:14px; color:${T.text}; font-weight:500; }
`;

// ── Delete confirm modal ───────────────────────────────────────────────────────

const WarnIcon = styled.div`
  width:60px; height:60px; border-radius:50%;
  background:${T.dangerBg}; border:1px solid ${T.dangerBord};
  display:flex; align-items:center; justify-content:center;
  margin:0 auto 18px;
  svg { width:28px; height:28px; stroke:${T.danger}; }
`;

const ConfirmTitle = styled.h3`
  font-family:${T.fontDisplay}; font-size:20px; font-weight:600;
  color:${T.text}; margin:0 0 6px; text-align:center;
`;
const ConfirmText = styled.p`
  font-size:13px; color:${T.textDim}; text-align:center;
  margin:0; line-height:1.65;
`;
const ConfirmCarBox = styled.div`
  display:flex; align-items:center; gap:10px;
  background:${T.surfaceAlt}; border:1px solid ${T.border};
  border-radius:${T.rSm}; padding:12px 15px; margin:16px 0;
  svg { width:17px; height:17px; stroke:${T.gold}; flex-shrink:0; }
`;
const ConfirmCarName = styled.div` font-weight:600; color:${T.text}; font-size:14px; `;
const ConfirmCarMeta = styled.div` font-size:12px; color:${T.textDim}; `;

// ── Spinner ───────────────────────────────────────────────────────────────────

const Spinner = styled.div`
  width:14px; height:14px;
  border:2px solid rgba(255,255,255,0.35);
  border-top-color:currentColor;
  border-radius:50%;
  animation:${spin} 0.65s linear infinite;
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES    = ['SUV','Sedan','Hatchback','Luxury','Sports','Electric'];
const TRANSMISSIONS = ['Manual','Automatic'];
const FUEL_TYPES    = ['Petrol','Diesel','Electric','Hybrid','CNG'];
const STATUSES      = ['available','on_rent','maintenance'];
const STATUS_LABELS = { available:'Available', on_rent:'On Rent', maintenance:'Maintenance' };

const emptyForm = {
  location_id:'', make:'', model:'', year:'', category:'',
  transmission:'', fuel_type:'', seats:'', status:'available', description:'',
};

// ── Main Component ─────────────────────────────────────────────────────────────

const ManageCars = () => {
  const [cars,         setCars        ] = useState([]);
  const [locations,    setLocations   ] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [toast,        setToast       ] = useState(null); // { msg, err }

  // Modal: 'add' | 'edit' | 'images' | 'pricing' | 'delete'
  const [modal,    setModal   ] = useState(null);
  const [activeCar,setActiveCar] = useState(null);

  // Add/Edit car form
  const [form,    setForm   ] = useState(emptyForm);
  const [saving,  setSaving ] = useState(false);

  // Add car – images & pricing (pending, local only until Create)
  const [pendingImages, setPendingImages] = useState([]);
  const [pendingSlabs,  setPendingSlabs ] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // null = not uploading, 0-100 = uploading

  useEffect(() => { fetchCars(); fetchLocations(); }, []);

  useEffect(() => {
    const h = () => setOpenDropdown(null);
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  // ✅ FIXED: fetchCars with deduplication to prevent duplicate key errors
 const fetchCars = async () => { 
  try { 
    const r = await api.get("/cars", { params: { limit: 1000, page: 1 } }); 
    let carsData = Array.isArray(r.data) ? r.data : r.data.cars || [];
    
    // Remove duplicates by ID (keeping first occurrence)
    const uniqueCars = [];
    const seenIds = new Set();
    
    for (const car of carsData) {
      if (!seenIds.has(car.id)) {
        seenIds.add(car.id);
        uniqueCars.push(car);
      }
    }
    
    console.log(`✅ Loaded ${uniqueCars.length} unique cars (removed ${carsData.length - uniqueCars.length} duplicate(s))`);
    setCars(uniqueCars); 
  } catch(e) { 
    console.error("Error fetching cars:", e); 
  } 
};
  
  const fetchLocations = async () => { 
    try { 
      const r = await api.get("/locations"); 
      setLocations(Array.isArray(r.data) ? r.data : r.data.locations || []); 
    } catch(e) { 
      console.error(e); 
    } 
  };

  const showToast = (msg, err=false) => { setToast({ msg, err }); setTimeout(() => setToast(null), 3800); };

  const openAdd = () => { setActiveCar(null); setForm(emptyForm); setPendingImages([]); setPendingSlabs([]); setUploadProgress(null); setModal('add'); };

  const openEdit = (car) => {
    setActiveCar(car);
    setForm({ location_id:car.location_id, make:car.make, model:car.model, year:car.year,
      category:car.category, transmission:car.transmission, fuel_type:car.fuel_type,
      seats:car.seats, status:car.status||'available', description:car.description||'' });
    setModal('edit');
    setOpenDropdown(null);
  };

  const closeModal = () => {
    if (uploadProgress !== null) return; // block close during upload
    setModal(null); setActiveCar(null); setSaving(false); setUploadProgress(null);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ── Add Car: create + upload images + save pricing ─────────────────────────
  const handleAddCar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(null);

    let newCarId = null;

    try {
      // Step 1: Create car
      const res = await api.post("/cars", form);
      newCarId = res.data?.id ?? res.data?.car?.id ?? res.data?.data?.id;

      if (!newCarId) throw new Error("Server did not return a car ID");

      // Step 2: Upload images sequentially — mirrors CarImages upload exactly
      if (pendingImages.length > 0) {
        setUploadProgress(0);
        for (let i = 0; i < pendingImages.length; i++) {
          const img = pendingImages[i];
          const fd = new FormData();
          fd.append("images", img.file);
          fd.append("is_primary", img.is_primary ? "true" : "false");

          await api.post(`/car-images/${newCarId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          // Update progress after each image
          setUploadProgress(Math.round(((i + 1) / pendingImages.length) * 100));
        }
      }

      // Step 3: Save pricing slabs
      for (const slab of pendingSlabs) {
        await api.post("/pricing", {
          car_id:         newCarId,
          type:           slab.type,
          duration_value: slab.duration_value,
          price:          slab.price,
        });
      }

      // Done
      setUploadProgress(null);
      setModal(null);
      setActiveCar(null);
      setForm(emptyForm);
      setPendingImages([]);
      setPendingSlabs([]);
      fetchCars();
      showToast(`${form.make} ${form.model} created successfully`);

    } catch (err) {
      setUploadProgress(null);
      // If car was created but images failed, still close modal and report partial success
      if (newCarId) {
        setModal(null);
        fetchCars();
        showToast("Car created, but some images failed to upload", true);
      } else {
        showToast(err.response?.data?.message || err.message || "Error creating car", true);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Edit Car ───────────────────────────────────────────────────────────────
  const handleEditCar = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/cars/${activeCar.id}`, form);
      closeModal();
      fetchCars();
      showToast(`${form.make} ${form.model} updated`);
    } catch (err) {
      showToast(err.response?.data?.message || "Error updating car", true);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Car ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await api.delete(`/cars/${activeCar.id}`);
      const name = `${activeCar.make} ${activeCar.model}`;
      setModal(null); setActiveCar(null);
      fetchCars();
      showToast(`${name} deleted`);
    } catch (err) {
      showToast("Error deleting car", true);
    }
  };

  const isUploading = uploadProgress !== null;
  const carLabel    = activeCar ? `${activeCar.make} ${activeCar.model}` : '';

  const SectionHead = ({ num, title }) => (
    <SectionHeader>
      <SectionNum>{num}</SectionNum>
      <SectionTitle>{title}</SectionTitle>
      <SectionLine />
    </SectionHeader>
  );

  return (
    <PageWrapper>
      <TopBar>
        <PageTitle>Manage <span>Cars</span></PageTitle>
        <AddButton onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Car
        </AddButton>
      </TopBar>

      {/* ── Fleet Table ──────────────────────────────────────────────────── */}
      <TableWrapper>
        <TableTopBar>
          <TableLabel>Fleet</TableLabel>
          <CarCount>{cars.length} vehicle{cars.length!==1?'s':''}</CarCount>
        </TableTopBar>

        {cars.length === 0 ? (
          <EmptyState>
            <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5"/></svg>
            <p>No vehicles yet</p>
            <span>Click "Add Car" to create your first listing</span>
          </EmptyState>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <StyledTable>
              <thead>
                <tr>
                  <Th>Vehicle</Th><Th>Category</Th><Th>Transmission</Th>
                  <Th>Fuel</Th><Th>Seats</Th><Th>Status</Th>
                  <Th style={{width:52}}></Th>
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <Tr key={car.id}>
                    <Td><CarName>{car.make} {car.model}</CarName><CarMeta>{car.year}</CarMeta></Td>
                    <Td>{car.category}</Td>
                    <Td>{car.transmission}</Td>
                    <Td>{car.fuel_type}</Td>
                    <Td>{car.seats}</Td>
                    <Td><StatusBadge $s={car.status}>{STATUS_LABELS[car.status]||car.status}</StatusBadge></Td>
                    <ActionCell>
                      <DotsBtn onClick={e=>{ e.stopPropagation(); setOpenDropdown(openDropdown===car.id?null:car.id); }}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
                        </svg>
                      </DotsBtn>
                      {openDropdown===car.id && (
                        <DropMenu>
                          <DropItem onClick={()=>openEdit(car)}>
                            <svg viewBox="0 0 24 24" fill="none"><path d="M17 3l4 4-7 7H10v-4l7-7z" strokeWidth="1.5"/><path d="M4 20h16" strokeWidth="1.5"/></svg>Edit Car
                          </DropItem>
                          <DropItem onClick={()=>{ setActiveCar(car); setModal('images'); setOpenDropdown(null); }}>
                            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.5"/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth="1.5"/><polyline points="21 15 16 10 5 21" strokeWidth="1.5"/></svg>Manage Images
                          </DropItem>
                          <DropItem onClick={()=>{ setActiveCar(car); setModal('pricing'); setOpenDropdown(null); }}>
                            <svg viewBox="0 0 24 24" fill="none"><line x1="12" y1="1" x2="12" y2="23" strokeWidth="1.5"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeWidth="1.5"/></svg>Manage Pricing
                          </DropItem>
                          <DropDivider/>
                          <DropItem $danger onClick={()=>{ setActiveCar(car); setModal('delete'); setOpenDropdown(null); }}>
                            <svg viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" strokeWidth="1.5"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeWidth="1.5"/><path d="M10 11v6M14 11v6M9 3h6" strokeWidth="1.5"/></svg>Delete Car
                          </DropItem>
                        </DropMenu>
                      )}
                    </ActionCell>
                  </Tr>
                ))}
              </tbody>
            </StyledTable>
          </div>
        )}
      </TableWrapper>

      {/* ── ADD CAR MODAL ─────────────────────────────────────────────────── */}
      {modal==='add' && (
        <Overlay onClick={closeModal}>
          <ModalCard $wide onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <div>
                <ModalTitle>Add New Vehicle</ModalTitle>
                <ModalSubtitle>Fill in details, upload images, and set pricing — all in one step</ModalSubtitle>
              </div>
              <CloseBtn onClick={closeModal} disabled={isUploading}>
                <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </CloseBtn>
            </ModalHead>

            <ModalBody>
              <form id="add-car-form" onSubmit={handleAddCar}>

                {/* § 1 · Vehicle Information */}
                <SectionBlock>
                  <SectionHead num="1" title="Vehicle Information" />

                  <FormGroup><Label>Location</Label>
                    <Select name="location_id" value={form.location_id} onChange={handleChange} required>
                      <option value="">Select location…</option>
                      {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                    </Select>
                  </FormGroup>

                  <Spacer />

                  <Grid2>
                    <FormGroup><Label>Make</Label><Input name="make" placeholder="e.g. Toyota" value={form.make} onChange={handleChange} required /></FormGroup>
                    <FormGroup><Label>Model</Label><Input name="model" placeholder="e.g. Fortuner" value={form.model} onChange={handleChange} required /></FormGroup>
                  </Grid2>

                  <Spacer />

                  <Grid2>
                    <FormGroup><Label>Year</Label><Input type="number" name="year" placeholder="e.g. 2024" value={form.year} onChange={handleChange} required /></FormGroup>
                    <FormGroup><Label>Seats</Label><Input type="number" name="seats" placeholder="e.g. 7" value={form.seats} onChange={handleChange} required /></FormGroup>
                  </Grid2>

                  <Spacer />

                  <Grid3>
                    <FormGroup><Label>Category</Label>
                      <Select name="category" value={form.category} onChange={handleChange} required>
                        <option value="">Select…</option>
                        {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </Select>
                    </FormGroup>
                    <FormGroup><Label>Transmission</Label>
                      <Select name="transmission" value={form.transmission} onChange={handleChange} required>
                        <option value="">Select…</option>
                        {TRANSMISSIONS.map(t=><option key={t} value={t}>{t}</option>)}
                      </Select>
                    </FormGroup>
                    <FormGroup><Label>Fuel Type</Label>
                      <Select name="fuel_type" value={form.fuel_type} onChange={handleChange} required>
                        <option value="">Select…</option>
                        {FUEL_TYPES.map(f=><option key={f} value={f}>{f}</option>)}
                      </Select>
                    </FormGroup>
                  </Grid3>

                  <Spacer />

                  <Grid2>
                    <FormGroup><Label>Status</Label>
                      <Select name="status" value={form.status} onChange={handleChange} required>
                        {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </Select>
                    </FormGroup>
                  </Grid2>

                  <Spacer />

                  <FormGroup><Label>Description</Label>
                    <Textarea name="description" placeholder="Brief description of the vehicle…" value={form.description} onChange={handleChange} />
                  </FormGroup>
                </SectionBlock>

                {/* § 2 · Car Images */}
                <SectionBlock>
                  <SectionHead num="2" title="Car Images" />
                  <InlineImages
                    images={pendingImages}
                    setImages={setPendingImages}
                    uploadProgress={uploadProgress}
                  />
                </SectionBlock>

                {/* § 3 · Pricing Slabs */}
                <SectionBlock>
                  <SectionHead num="3" title="Pricing Slabs" />
                  <InlinePricing slabs={pendingSlabs} setSlabs={setPendingSlabs} />
                </SectionBlock>

              </form>
            </ModalBody>

            <ModalFoot>
              <BtnSecondary type="button" onClick={closeModal} disabled={isUploading||saving}>Cancel</BtnSecondary>
              <BtnPrimary type="submit" form="add-car-form" disabled={saving||isUploading}>
                {isUploading
                  ? <><Spinner /> Uploading images… {Math.round(uploadProgress)}%</>
                  : saving
                  ? <><Spinner /> Creating…</>
                  : <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Create Vehicle
                    </>
                }
              </BtnPrimary>
            </ModalFoot>
          </ModalCard>
        </Overlay>
      )}

      {/* ── EDIT CAR MODAL ─────────────────────────────────────────────────── */}
      {modal==='edit' && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <div><ModalTitle>Edit Vehicle</ModalTitle><ModalSubtitle>{carLabel}</ModalSubtitle></div>
              <CloseBtn onClick={closeModal}><svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></CloseBtn>
            </ModalHead>
            <ModalBody>
              <form id="edit-car-form" onSubmit={handleEditCar}>
                <FormGroup><Label>Location</Label>
                  <Select name="location_id" value={form.location_id} onChange={handleChange} required>
                    <option value="">Select location…</option>
                    {locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
                  </Select>
                </FormGroup><Spacer />
                <Grid2>
                  <FormGroup><Label>Make</Label><Input name="make" value={form.make} onChange={handleChange} required /></FormGroup>
                  <FormGroup><Label>Model</Label><Input name="model" value={form.model} onChange={handleChange} required /></FormGroup>
                </Grid2><Spacer />
                <Grid2>
                  <FormGroup><Label>Year</Label><Input type="number" name="year" value={form.year} onChange={handleChange} required /></FormGroup>
                  <FormGroup><Label>Seats</Label><Input type="number" name="seats" value={form.seats} onChange={handleChange} required /></FormGroup>
                </Grid2><Spacer />
                <Grid3>
                  <FormGroup><Label>Category</Label>
                    <Select name="category" value={form.category} onChange={handleChange} required>
                      <option value="">Select…</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup><Label>Transmission</Label>
                    <Select name="transmission" value={form.transmission} onChange={handleChange} required>
                      <option value="">Select…</option>{TRANSMISSIONS.map(t=><option key={t} value={t}>{t}</option>)}
                    </Select>
                  </FormGroup>
                  <FormGroup><Label>Fuel Type</Label>
                    <Select name="fuel_type" value={form.fuel_type} onChange={handleChange} required>
                      <option value="">Select…</option>{FUEL_TYPES.map(f=><option key={f} value={f}>{f}</option>)}
                    </Select>
                  </FormGroup>
                </Grid3><Spacer />
                <Grid2>
                  <FormGroup><Label>Status</Label>
                    <Select name="status" value={form.status} onChange={handleChange}>
                      {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </Select>
                  </FormGroup>
                </Grid2><Spacer />
                <FormGroup><Label>Description</Label>
                  <Textarea name="description" value={form.description} onChange={handleChange} />
                </FormGroup>
              </form>
            </ModalBody>
            <ModalFoot>
              <BtnSecondary onClick={closeModal}>Cancel</BtnSecondary>
              <BtnPrimary type="submit" form="edit-car-form" disabled={saving}>
                {saving ? <><Spinner />Saving…</> : 'Save Changes'}
              </BtnPrimary>
            </ModalFoot>
          </ModalCard>
        </Overlay>
      )}

      {/* ── IMAGES MODAL ─────────────────────────────────────────────────── */}
      {modal==='images' && activeCar && (
        <Overlay onClick={closeModal}>
          <ModalCard $wide onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <div><ModalTitle>Vehicle Images</ModalTitle><ModalSubtitle>{carLabel}</ModalSubtitle></div>
              <CloseBtn onClick={closeModal}><svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></CloseBtn>
            </ModalHead>
            <ModalBody><CarImages carId={activeCar.id} /></ModalBody>
            <ModalFoot><BtnPrimary onClick={closeModal}>Done</BtnPrimary></ModalFoot>
          </ModalCard>
        </Overlay>
      )}

      {/* ── PRICING MODAL ────────────────────────────────────────────────── */}
      {modal==='pricing' && activeCar && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e=>e.stopPropagation()}>
            <ModalHead>
              <div><ModalTitle>Pricing Slabs</ModalTitle><ModalSubtitle>{carLabel}</ModalSubtitle></div>
              <CloseBtn onClick={closeModal}><svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></CloseBtn>
            </ModalHead>
            <ModalBody><PricingModalContent carId={activeCar.id} /></ModalBody>
            <ModalFoot><BtnPrimary onClick={closeModal}>Done</BtnPrimary></ModalFoot>
          </ModalCard>
        </Overlay>
      )}

      {/* ── DELETE MODAL ─────────────────────────────────────────────────── */}
      {modal==='delete' && activeCar && (
        <Overlay onClick={closeModal}>
          <ModalCard onClick={e=>e.stopPropagation()} style={{maxWidth:420}}>
            <ModalBody style={{textAlign:'center', padding:'40px 32px'}}>
              <WarnIcon>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeWidth="1.5"/>
                  <line x1="12" y1="9" x2="12" y2="13" strokeWidth="1.5"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2"/>
                </svg>
              </WarnIcon>
              <ConfirmTitle>Delete {activeCar.make} {activeCar.model}?</ConfirmTitle>
              <ConfirmText>This action cannot be undone. All associated images and pricing will be permanently removed.</ConfirmText>
              <ConfirmCarBox>
                <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" strokeWidth="1.5"/></svg>
                <div>
                  <ConfirmCarName>{activeCar.make} {activeCar.model}</ConfirmCarName>
                  <ConfirmCarMeta>{activeCar.year} · {activeCar.category} · {activeCar.fuel_type}</ConfirmCarMeta>
                </div>
              </ConfirmCarBox>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <BtnSecondary style={{flex:1,justifyContent:'center'}} onClick={closeModal}>Cancel</BtnSecondary>
                <BtnDanger style={{flex:1,justifyContent:'center'}} onClick={handleDelete}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  Delete Car
                </BtnDanger>
              </div>
            </ModalBody>
          </ModalCard>
        </Overlay>
      )}

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <ToastWrap>
          <ToastInner $err={toast.err}>
            {toast.err
              ? <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/></svg>
              : <svg viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeWidth="1.5"/><polyline points="22 4 12 14.01 9 11.01" strokeWidth="2"/></svg>
            }
            <span>{toast.msg}</span>
          </ToastInner>
        </ToastWrap>
      )}
    </PageWrapper>
  );
};

export default ManageCars;