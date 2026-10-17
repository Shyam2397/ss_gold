import {
  FiHome,
  FiPrinter,
  FiSliders,
  FiInfo,
  FiPhone,
  FiMail,
  FiGlobe,
  FiHash,
  FiUsers,
  FiDroplet,
} from "react-icons/fi";

export const PAPER_SIZES_TOKEN = [
  { value: "80mm", label: "80mm Thermal (Receipt)" },
  { value: "58mm", label: "58mm Thermal (Receipt)" },
];

export const PAPER_SIZES_A4 = [
  { value: "A4", label: "A4 (210 × 297 mm)" },
  { value: "A5", label: "A5 (148 × 210 mm)" },
  { value: "Letter", label: "Letter (8.5 × 11 in)" },
  { value: "Legal", label: "Legal (8.5 × 14 in)" },
];

export const ORIENTATIONS = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

export const COLOR_OPTIONS = [
  { value: "monochrome", label: "Monochrome (Black & White)" },
  { value: "color", label: "Color" },
];

export const PAPER_TYPES = [
  { value: "", label: "Auto / Default" },
  { value: "plain", label: "Plain paper" },
  { value: "epson-photo-quality-ink-jet", label: "Epson Photo Quality Ink Jet" },
  { value: "epson-matte", label: "Epson Matte" },
  { value: "epson-ultra-glossy", label: "Epson Ultra Glossy" },
  { value: "epson-premium-glossy", label: "Epson Premium Glossy" },
  { value: "epson-premium-semigloss", label: "Epson Premium Semigloss" },
  { value: "photo-paper-glossy", label: "Photo Paper Glossy" },
  { value: "envelope", label: "Envelope" },
];

export const DEFAULT_TOKEN_SETTINGS = {
  printerName: "",
  documentSize: "80mm",
  orientation: "portrait",
  paperType: "thermal",
  quality: "high",
  color: "monochrome",
  copies: 1,
  silentMode: true,
};

export const DEFAULT_SKIN_TEST_SETTINGS = {
  printerName: "",
  documentSize: "A4",
  orientation: "portrait",
  paperType: "plain",
  quality: "high",
  color: "color",
  copies: 1,
  silentMode: true,
};

export const DEFAULT_COMPANY_DETAILS = {
  name: "",
  tagline: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  alternatePhone: "",
  email: "",
  website: "",
  gstin: "",
  logo: "",
};

export const COMPANY_FIELDS = [
  { key: "name", label: "Company name", placeholder: "SS GOLD", icon: FiHome, type: "text" },
  { key: "tagline", label: "Tagline", placeholder: "Computer X-ray Testing", icon: FiInfo, type: "text" },
  { key: "gstin", label: "GSTIN / Tax ID", placeholder: "33AABCS1234F1Z5", icon: FiHash, type: "text" },
  { key: "phone", label: "Phone number", placeholder: "8903225544", icon: FiPhone, type: "tel" },
  { key: "alternatePhone", label: "Alternate phone", placeholder: "Optional", icon: FiPhone, type: "tel" },
  { key: "email", label: "Email address", placeholder: "company@example.com", icon: FiMail, type: "email" },
  { key: "website", label: "Website", placeholder: "www.ssgold.in", icon: FiGlobe, type: "text" },
];

export const SETTINGS_TABS = [
  { id: "company", label: "Company", description: "Business details", icon: FiHome },
  { id: "printer", label: "Printer", description: "Print profiles", icon: FiPrinter },
  { id: "preferences", label: "Preferences", description: "App behaviour", icon: FiSliders },
  { id: "appearance", label: "Appearance", description: "Colours & layout", icon: FiDroplet },
  { id: "users", label: "Users", description: "Accounts & access", icon: FiUsers, adminOnly: true },
  { id: "about", label: "About", description: "Info & notes", icon: FiInfo },
];
