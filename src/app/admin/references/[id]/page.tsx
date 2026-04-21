'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { useTheme } from '@/app/context/ThemeContext';
import api from '@/app/lib/axios';
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('@/app/components/rtextrich/RichTextEditor'),
  {
    ssr: false,
    loading: () => <div className="rich-editor-loading">Chargement de l’éditeur…</div>,
  }
);

const LocationPicker = dynamic(
  () => import('../../../components/LocationPicker'),
  {
    ssr: false,
    loading: () => <div className="map-loading">Chargement de la carte…</div>,
  }
);

type ReferenceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type MediaTab = 'upload' | 'library';

type MediaItem = {
  id: string;
  url: string;
  name: string;
};

type CountryOption = {
  code: string;
  name: string;
  lat: number;
  lng: number;
};

type ReferenceResponse = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  details: string;
  image: string;
  date: string;
  client: string;
  country: string;
  code: string;
  lat: number;
  lng: number;
  category: string;
  tags: string[];
  impact: string | null;
  technologies: string[];
  team: string | null;
  duration: string | null;
  budget: string | null;
  status: ReferenceStatus;
};

const CATEGORIES = [
  'Transformation digitale',
  'IA & Data Science',
  'Smart Building',
  'Industrie 4.0',
  'Cybersécurité',
  'HealthTech & IA',
  'Smart City',
  'Luxe & Digital',
  'Fintech',
  'Robotique',
  'Supply Chain',
  'Logistique',
  'Énergie',
  'Fintech inclusive',
  'Cloud & DevOps',
];

const ORANGE = '#EF9F27';
const ORANGE_DARK = '#C97D15';

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'AF', name: 'Afghanistan', lat: 33.9391, lng: 67.71 },
  { code: 'ZA', name: 'Afrique du Sud', lat: -30.5595, lng: 22.9375 },
  { code: 'AL', name: 'Albanie', lat: 41.1533, lng: 20.1683 },
  { code: 'DZ', name: 'Algérie', lat: 28.0339, lng: 1.6596 },
  { code: 'DE', name: 'Allemagne', lat: 51.1657, lng: 10.4515 },
  { code: 'AD', name: 'Andorre', lat: 42.5063, lng: 1.5218 },
  { code: 'AO', name: 'Angola', lat: -11.2027, lng: 17.8739 },
  { code: 'AG', name: 'Antigua-et-Barbuda', lat: 17.0608, lng: -61.7964 },
  { code: 'SA', name: 'Arabie saoudite', lat: 23.8859, lng: 45.0792 },
  { code: 'AR', name: 'Argentine', lat: -38.4161, lng: -63.6167 },
  { code: 'AM', name: 'Arménie', lat: 40.0691, lng: 45.0382 },
  { code: 'AU', name: 'Australie', lat: -25.2744, lng: 133.7751 },
  { code: 'AT', name: 'Autriche', lat: 47.5162, lng: 14.5501 },
  { code: 'AZ', name: 'Azerbaïdjan', lat: 40.1431, lng: 47.5769 },
  { code: 'BS', name: 'Bahamas', lat: 25.0259, lng: -78.0359 },
  { code: 'BH', name: 'Bahreïn', lat: 26.0667, lng: 50.5577 },
  { code: 'BD', name: 'Bangladesh', lat: 23.685, lng: 90.3563 },
  { code: 'BB', name: 'Barbade', lat: 13.1939, lng: -59.5432 },
  { code: 'BE', name: 'Belgique', lat: 50.5039, lng: 4.4699 },
  { code: 'BZ', name: 'Belize', lat: 17.1899, lng: -88.4976 },
  { code: 'BJ', name: 'Bénin', lat: 9.3077, lng: 2.3158 },
  { code: 'BT', name: 'Bhoutan', lat: 27.5142, lng: 90.4336 },
  { code: 'BY', name: 'Biélorussie', lat: 53.7098, lng: 27.9534 },
  { code: 'MM', name: 'Birmanie', lat: 21.9162, lng: 95.956 },
  { code: 'BO', name: 'Bolivie', lat: -16.2902, lng: -63.5887 },
  { code: 'BA', name: 'Bosnie-Herzégovine', lat: 43.9159, lng: 17.6791 },
  { code: 'BW', name: 'Botswana', lat: -22.3285, lng: 24.6849 },
  { code: 'BR', name: 'Brésil', lat: -14.235, lng: -51.9253 },
  { code: 'BN', name: 'Brunei', lat: 4.5353, lng: 114.7277 },
  { code: 'BG', name: 'Bulgarie', lat: 42.7339, lng: 25.4858 },
  { code: 'BF', name: 'Burkina Faso', lat: 12.2383, lng: -1.5616 },
  { code: 'BI', name: 'Burundi', lat: -3.3731, lng: 29.9189 },
  { code: 'CV', name: 'Cap-Vert', lat: 16.5388, lng: -23.0418 },
  { code: 'KH', name: 'Cambodge', lat: 12.5657, lng: 104.991 },
  { code: 'CM', name: 'Cameroun', lat: 7.3697, lng: 12.3547 },
  { code: 'CA', name: 'Canada', lat: 56.1304, lng: -106.3468 },
  { code: 'CL', name: 'Chili', lat: -35.6751, lng: -71.543 },
  { code: 'CN', name: 'Chine', lat: 35.8617, lng: 104.1954 },
  { code: 'CY', name: 'Chypre', lat: 35.1264, lng: 33.4299 },
  { code: 'CO', name: 'Colombie', lat: 4.5709, lng: -74.2973 },
  { code: 'KM', name: 'Comores', lat: -11.875, lng: 43.8722 },
  { code: 'CG', name: 'Congo', lat: -0.228, lng: 15.8277 },
  { code: 'KP', name: 'Corée du Nord', lat: 40.3399, lng: 127.5101 },
  { code: 'KR', name: 'Corée du Sud', lat: 35.9078, lng: 127.7669 },
  { code: 'CR', name: 'Costa Rica', lat: 9.7489, lng: -83.7534 },
  { code: 'CI', name: "Côte d’Ivoire", lat: 7.54, lng: -5.5471 },
  { code: 'HR', name: 'Croatie', lat: 45.1, lng: 15.2 },
  { code: 'CU', name: 'Cuba', lat: 21.5218, lng: -77.7812 },
  { code: 'DK', name: 'Danemark', lat: 56.2639, lng: 9.5018 },
  { code: 'DJ', name: 'Djibouti', lat: 11.8251, lng: 42.5903 },
  { code: 'DM', name: 'Dominique', lat: 15.415, lng: -61.371 },
  { code: 'EG', name: 'Égypte', lat: 26.8206, lng: 30.8025 },
  { code: 'AE', name: 'Émirats arabes unis', lat: 23.4241, lng: 53.8478 },
  { code: 'EC', name: 'Équateur', lat: -1.8312, lng: -78.1834 },
  { code: 'ER', name: 'Érythrée', lat: 15.1794, lng: 39.7823 },
  { code: 'ES', name: 'Espagne', lat: 40.4637, lng: -3.7492 },
  { code: 'EE', name: 'Estonie', lat: 58.5953, lng: 25.0136 },
  { code: 'SZ', name: 'Eswatini', lat: -26.5225, lng: 31.4659 },
  { code: 'US', name: 'États-Unis', lat: 37.0902, lng: -95.7129 },
  { code: 'ET', name: 'Éthiopie', lat: 9.145, lng: 40.4897 },
  { code: 'FJ', name: 'Fidji', lat: -16.5782, lng: 179.4144 },
  { code: 'FI', name: 'Finlande', lat: 61.9241, lng: 25.7482 },
  { code: 'FR', name: 'France', lat: 46.2276, lng: 2.2137 },
  { code: 'GA', name: 'Gabon', lat: -0.8037, lng: 11.6094 },
  { code: 'GM', name: 'Gambie', lat: 13.4432, lng: -15.3101 },
  { code: 'GE', name: 'Géorgie', lat: 42.3154, lng: 43.3569 },
  { code: 'GH', name: 'Ghana', lat: 7.9465, lng: -1.0232 },
  { code: 'GR', name: 'Grèce', lat: 39.0742, lng: 21.8243 },
  { code: 'GD', name: 'Grenade', lat: 12.1165, lng: -61.679 },
  { code: 'GT', name: 'Guatemala', lat: 15.7835, lng: -90.2308 },
  { code: 'GN', name: 'Guinée', lat: 9.9456, lng: -9.6966 },
  { code: 'GQ', name: 'Guinée équatoriale', lat: 1.6508, lng: 10.2679 },
  { code: 'GW', name: 'Guinée-Bissau', lat: 11.8037, lng: -15.1804 },
  { code: 'GY', name: 'Guyana', lat: 4.8604, lng: -58.9302 },
  { code: 'HT', name: 'Haïti', lat: 18.9712, lng: -72.2852 },
  { code: 'HN', name: 'Honduras', lat: 15.2, lng: -86.2419 },
  { code: 'HU', name: 'Hongrie', lat: 47.1625, lng: 19.5033 },
  { code: 'IN', name: 'Inde', lat: 20.5937, lng: 78.9629 },
  { code: 'ID', name: 'Indonésie', lat: -0.7893, lng: 113.9213 },
  { code: 'IQ', name: 'Irak', lat: 33.2232, lng: 43.6793 },
  { code: 'IR', name: 'Iran', lat: 32.4279, lng: 53.688 },
  { code: 'IE', name: 'Irlande', lat: 53.1424, lng: -7.6921 },
  { code: 'IS', name: 'Islande', lat: 64.9631, lng: -19.0208 },
  { code: 'IL', name: 'Israël', lat: 31.0461, lng: 34.8516 },
  { code: 'IT', name: 'Italie', lat: 41.8719, lng: 12.5674 },
  { code: 'JM', name: 'Jamaïque', lat: 18.1096, lng: -77.2975 },
  { code: 'JP', name: 'Japon', lat: 36.2048, lng: 138.2529 },
  { code: 'JO', name: 'Jordanie', lat: 30.5852, lng: 36.2384 },
  { code: 'KZ', name: 'Kazakhstan', lat: 48.0196, lng: 66.9237 },
  { code: 'KE', name: 'Kenya', lat: -0.0236, lng: 37.9062 },
  { code: 'KG', name: 'Kirghizistan', lat: 41.2044, lng: 74.7661 },
  { code: 'KI', name: 'Kiribati', lat: -3.3704, lng: -168.734 },
  { code: 'KW', name: 'Koweït', lat: 29.3117, lng: 47.4818 },
  { code: 'LA', name: 'Laos', lat: 19.8563, lng: 102.4955 },
  { code: 'LS', name: 'Lesotho', lat: -29.61, lng: 28.2336 },
  { code: 'LV', name: 'Lettonie', lat: 56.8796, lng: 24.6032 },
  { code: 'LB', name: 'Liban', lat: 33.8547, lng: 35.8623 },
  { code: 'LR', name: 'Liberia', lat: 6.4281, lng: -9.4295 },
  { code: 'LY', name: 'Libye', lat: 26.3351, lng: 17.2283 },
  { code: 'LI', name: 'Liechtenstein', lat: 47.166, lng: 9.5554 },
  { code: 'LT', name: 'Lituanie', lat: 55.1694, lng: 23.8813 },
  { code: 'LU', name: 'Luxembourg', lat: 49.8153, lng: 6.1296 },
  { code: 'MK', name: 'Macédoine du Nord', lat: 41.6086, lng: 21.7453 },
  { code: 'MG', name: 'Madagascar', lat: -18.7669, lng: 46.8691 },
  { code: 'MY', name: 'Malaisie', lat: 4.2105, lng: 101.9758 },
  { code: 'MW', name: 'Malawi', lat: -13.2543, lng: 34.3015 },
  { code: 'MV', name: 'Maldives', lat: 3.2028, lng: 73.2207 },
  { code: 'ML', name: 'Mali', lat: 17.5707, lng: -3.9962 },
  { code: 'MT', name: 'Malte', lat: 35.9375, lng: 14.3754 },
  { code: 'MA', name: 'Maroc', lat: 31.7917, lng: -7.0926 },
  { code: 'MH', name: 'Marshall', lat: 7.1315, lng: 171.1845 },
  { code: 'MU', name: 'Maurice', lat: -20.3484, lng: 57.5522 },
  { code: 'MR', name: 'Mauritanie', lat: 21.0079, lng: -10.9408 },
  { code: 'MX', name: 'Mexique', lat: 23.6345, lng: -102.5528 },
  { code: 'FM', name: 'Micronésie', lat: 7.4256, lng: 150.5508 },
  { code: 'MD', name: 'Moldavie', lat: 47.4116, lng: 28.3699 },
  { code: 'MC', name: 'Monaco', lat: 43.7384, lng: 7.4246 },
  { code: 'MN', name: 'Mongolie', lat: 46.8625, lng: 103.8467 },
  { code: 'ME', name: 'Monténégro', lat: 42.7087, lng: 19.3744 },
  { code: 'MZ', name: 'Mozambique', lat: -18.6657, lng: 35.5296 },
  { code: 'NA', name: 'Namibie', lat: -22.9576, lng: 18.4904 },
  { code: 'NR', name: 'Nauru', lat: -0.5228, lng: 166.9315 },
  { code: 'NP', name: 'Népal', lat: 28.3949, lng: 84.124 },
  { code: 'NI', name: 'Nicaragua', lat: 12.8654, lng: -85.2072 },
  { code: 'NE', name: 'Niger', lat: 17.6078, lng: 8.0817 },
  { code: 'NG', name: 'Nigeria', lat: 9.082, lng: 8.6753 },
  { code: 'NO', name: 'Norvège', lat: 60.472, lng: 8.4689 },
  { code: 'NZ', name: 'Nouvelle-Zélande', lat: -40.9006, lng: 174.886 },
  { code: 'OM', name: 'Oman', lat: 21.4735, lng: 55.9754 },
  { code: 'UG', name: 'Ouganda', lat: 1.3733, lng: 32.2903 },
  { code: 'UZ', name: 'Ouzbékistan', lat: 41.3775, lng: 64.5853 },
  { code: 'PK', name: 'Pakistan', lat: 30.3753, lng: 69.3451 },
  { code: 'PW', name: 'Palaos', lat: 7.515, lng: 134.5825 },
  { code: 'PA', name: 'Panama', lat: 8.538, lng: -80.7821 },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', lat: -6.3149, lng: 143.9555 },
  { code: 'PY', name: 'Paraguay', lat: -23.4425, lng: -58.4438 },
  { code: 'NL', name: 'Pays-Bas', lat: 52.1326, lng: 5.2913 },
  { code: 'PE', name: 'Pérou', lat: -9.19, lng: -75.0152 },
  { code: 'PH', name: 'Philippines', lat: 12.8797, lng: 121.774 },
  { code: 'PL', name: 'Pologne', lat: 51.9194, lng: 19.1451 },
  { code: 'PT', name: 'Portugal', lat: 39.3999, lng: -8.2245 },
  { code: 'QA', name: 'Qatar', lat: 25.3548, lng: 51.1839 },
  { code: 'CF', name: 'République centrafricaine', lat: 6.6111, lng: 20.9394 },
  { code: 'DO', name: 'République dominicaine', lat: 18.7357, lng: -70.1627 },
  { code: 'CD', name: 'République démocratique du Congo', lat: -4.0383, lng: 21.7587 },
  { code: 'CZ', name: 'République tchèque', lat: 49.8175, lng: 15.473 },
  { code: 'RO', name: 'Roumanie', lat: 45.9432, lng: 24.9668 },
  { code: 'GB', name: 'Royaume-Uni', lat: 55.3781, lng: -3.436 },
  { code: 'RU', name: 'Russie', lat: 61.524, lng: 105.3188 },
  { code: 'RW', name: 'Rwanda', lat: -1.9403, lng: 29.8739 },
  { code: 'KN', name: 'Saint-Christophe-et-Niévès', lat: 17.3578, lng: -62.783 },
  { code: 'SM', name: 'Saint-Marin', lat: 43.9424, lng: 12.4578 },
  { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', lat: 12.9843, lng: -61.2872 },
  { code: 'LC', name: 'Sainte-Lucie', lat: 13.9094, lng: -60.9789 },
  { code: 'SV', name: 'Salvador', lat: 13.7942, lng: -88.8965 },
  { code: 'WS', name: 'Samoa', lat: -13.759, lng: -172.1046 },
  { code: 'ST', name: 'Sao Tomé-et-Principe', lat: 0.1864, lng: 6.6131 },
  { code: 'SN', name: 'Sénégal', lat: 14.4974, lng: -14.4524 },
  { code: 'RS', name: 'Serbie', lat: 44.0165, lng: 21.0059 },
  { code: 'SC', name: 'Seychelles', lat: -4.6796, lng: 55.492 },
  { code: 'SL', name: 'Sierra Leone', lat: 8.4606, lng: -11.7799 },
  { code: 'SG', name: 'Singapour', lat: 1.3521, lng: 103.8198 },
  { code: 'SK', name: 'Slovaquie', lat: 48.669, lng: 19.699 },
  { code: 'SI', name: 'Slovénie', lat: 46.1512, lng: 14.9955 },
  { code: 'SO', name: 'Somalie', lat: 5.1521, lng: 46.1996 },
  { code: 'SD', name: 'Soudan', lat: 12.8628, lng: 30.2176 },
  { code: 'SS', name: 'Soudan du Sud', lat: 6.877, lng: 31.307 },
  { code: 'LK', name: 'Sri Lanka', lat: 7.8731, lng: 80.7718 },
  { code: 'SE', name: 'Suède', lat: 60.1282, lng: 18.6435 },
  { code: 'CH', name: 'Suisse', lat: 46.8182, lng: 8.2275 },
  { code: 'SR', name: 'Suriname', lat: 3.9193, lng: -56.0278 },
  { code: 'SY', name: 'Syrie', lat: 34.8021, lng: 38.9968 },
  { code: 'TJ', name: 'Tadjikistan', lat: 38.861, lng: 71.2761 },
  { code: 'TZ', name: 'Tanzanie', lat: -6.369, lng: 34.8888 },
  { code: 'TD', name: 'Tchad', lat: 15.4542, lng: 18.7322 },
  { code: 'TH', name: 'Thaïlande', lat: 15.87, lng: 100.9925 },
  { code: 'TL', name: 'Timor oriental', lat: -8.8742, lng: 125.7275 },
  { code: 'TG', name: 'Togo', lat: 8.6195, lng: 0.8248 },
  { code: 'TO', name: 'Tonga', lat: -21.179, lng: -175.1982 },
  { code: 'TT', name: 'Trinité-et-Tobago', lat: 10.6918, lng: -61.2225 },
  { code: 'TN', name: 'Tunisie', lat: 33.8869, lng: 9.5375 },
  { code: 'TM', name: 'Turkménistan', lat: 38.9697, lng: 59.5563 },
  { code: 'TR', name: 'Turquie', lat: 38.9637, lng: 35.2433 },
  { code: 'TV', name: 'Tuvalu', lat: -7.1095, lng: 177.6493 },
  { code: 'UA', name: 'Ukraine', lat: 48.3794, lng: 31.1656 },
  { code: 'UY', name: 'Uruguay', lat: -32.5228, lng: -55.7658 },
  { code: 'VU', name: 'Vanuatu', lat: -15.3767, lng: 166.9592 },
  { code: 'VA', name: 'Vatican', lat: 41.9029, lng: 12.4534 },
  { code: 'VE', name: 'Venezuela', lat: 6.4238, lng: -66.5897 },
  { code: 'VN', name: 'Viêt Nam', lat: 14.0583, lng: 108.2772 },
  { code: 'YE', name: 'Yémen', lat: 15.5527, lng: 48.5164 },
  { code: 'ZM', name: 'Zambie', lat: -13.1339, lng: 27.8493 },
  { code: 'ZW', name: 'Zimbabwe', lat: -19.0154, lng: 29.1549 },
];

const COUNTRY_BY_NAME = Object.fromEntries(
  COUNTRY_OPTIONS.map((country) => [country.name, country])
) as Record<string, CountryOption>;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitCommaValues(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getUploadedUrl(payload: any): string {
  return (
    payload?.url ||
    payload?.path ||
    payload?.src ||
    payload?.data?.url ||
    payload?.data?.path ||
    payload?.data?.src ||
    ''
  );
}

function normalizeLibraryItems(payload: any): MediaItem[] {
  const raw =
    payload?.data?.items ||
    payload?.data?.files ||
    payload?.data?.data ||
    payload?.data ||
    payload?.items ||
    payload?.files ||
    [];

  if (!Array.isArray(raw)) return [];

  return raw
    .map((item: any, index: number) => {
      const url = item?.url || item?.path || item?.src || item?.fileUrl || '';
      const id = item?.id || item?._id || url || `media-${index}`;
      const name =
        item?.name || item?.filename || item?.originalName || `image-${index + 1}`;

      return { id, url, name };
    })
    .filter((item) => Boolean(item.url));
}

function MediaPicker({
  open,
  onSelect,
  onClose,
}: {
  open: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const { dark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<MediaTab>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState('');
  const [search, setSearch] = useState('');

  const tokens = {
    bg: dark ? '#0D1016' : '#FFFFFF',
    panel: dark ? '#121722' : '#FFFFFF',
    soft: dark ? '#0F141D' : '#F7F8FA',
    border: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    text: dark ? '#F6F7FB' : '#111827',
    textSoft: dark ? 'rgba(255,255,255,.58)' : 'rgba(17,24,39,.56)',
    overlay: 'rgba(5,10,18,.58)',
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || tab !== 'library') return;

    let active = true;

    const fetchLibrary = async () => {
      setLibraryLoading(true);
      setLibraryError('');

      try {
        const res = await api.get('/api/uploads', {
          params: { limit: 120 },
        });

        if (!active) return;
        setLibraryItems(normalizeLibraryItems(res.data));
      } catch (error: any) {
        if (!active) return;
        setLibraryError(
          error?.response?.data?.error ||
            'Impossible de charger la médiathèque.'
        );
      } finally {
        if (active) setLibraryLoading(false);
      }
    };

    fetchLibrary();

    return () => {
      active = false;
    };
  }, [open, tab]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return libraryItems;
    const q = search.toLowerCase();
    return libraryItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [libraryItems, search]);

  const resetUploadState = () => {
    setFile(null);
    setUploadError('');
    setUploading(false);
    setDragActive(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (incomingFile?: File | null) => {
    if (!incomingFile) return;

    if (!incomingFile.type.startsWith('image/')) {
      setUploadError('Seuls les fichiers image sont acceptés.');
      return;
    }

    setUploadError('');
    setFile(incomingFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = getUploadedUrl(res.data);

      if (!url) {
        throw new Error("L'API n'a pas renvoyé d'URL d'image.");
      }

      onSelect(url);
      resetUploadState();
      onClose();
    } catch (error: any) {
      setUploadError(
        error?.response?.data?.error ||
          error?.message ||
          "Échec de l'upload."
      );
    } finally {
      setUploading(false);
    }
  };

  if (!open || !mounted) return null;

  return createPortal(
    <>
      <div className="media-overlay" onClick={onClose} />
      <div className="media-shell" role="dialog" aria-modal="true">
        <div className="media-modal" onClick={(e) => e.stopPropagation()}>
          <div className="media-header">
            <div>
              <h2>Choisir une image</h2>
              <p>Upload ou sélection depuis la médiathèque</p>
            </div>
            <button type="button" className="icon-btn" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="media-tabs">
            <button
              type="button"
              className={`media-tab ${tab === 'upload' ? 'active' : ''}`}
              onClick={() => setTab('upload')}
            >
              Ajouter
            </button>
            <button
              type="button"
              className={`media-tab ${tab === 'library' ? 'active' : ''}`}
              onClick={() => setTab('library')}
            >
              Médiathèque
            </button>
          </div>

          {tab === 'upload' && (
            <div className="media-body">
              <div
                className={`dropzone ${dragActive ? 'drag-active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFileChange(e.dataTransfer.files?.[0] || null);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                />
                <div className="dropzone-icon">🖼️</div>
                <strong>Dépose une image ici</strong>
                <span>ou clique pour parcourir tes fichiers</span>
                <small>JPG, PNG, WEBP, GIF</small>
              </div>

              {file && (
                <div className="selected-file">
                  <div>
                    <strong>{file.name}</strong>
                    <span>{Math.round(file.size / 1024)} Ko</span>
                  </div>
                  <button type="button" className="ghost-btn" onClick={resetUploadState}>
                    Retirer
                  </button>
                </div>
              )}

              {uploadError && <div className="inline-error">{uploadError}</div>}

              <div className="media-actions">
                <button type="button" className="ghost-btn" onClick={onClose}>
                  Fermer
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? 'Upload…' : 'Uploader'}
                </button>
              </div>
            </div>
          )}

          {tab === 'library' && (
            <div className="media-body">
              <input
                type="text"
                className="search-input"
                placeholder="Rechercher une image…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {libraryLoading && (
                <div className="media-empty">Chargement de la médiathèque…</div>
              )}

              {!libraryLoading && libraryError && (
                <div className="inline-error">{libraryError}</div>
              )}

              {!libraryLoading && !libraryError && filteredItems.length === 0 && (
                <div className="media-empty">
                  {libraryItems.length === 0
                    ? 'Aucune image trouvée dans la médiathèque.'
                    : 'Aucun résultat pour cette recherche.'}
                </div>
              )}

              {!libraryLoading && !libraryError && filteredItems.length > 0 && (
                <div className="library-grid">
                  {filteredItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="library-card"
                      onClick={() => {
                        onSelect(item.url);
                        onClose();
                      }}
                    >
                      <img src={item.url} alt={item.name} />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .media-overlay {
          position: fixed;
          inset: 0;
          background: ${tokens.overlay};
          backdrop-filter: blur(8px);
          z-index: 9998;
        }

        .media-shell {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 24px;
        }

        .media-modal {
          width: 100%;
          max-width: 760px;
          max-height: min(86vh, 820px);
          overflow: hidden;
          border-radius: 24px;
          background: ${tokens.bg};
          border: 1px solid ${tokens.border};
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
        }

        .media-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 14px;
          border-bottom: 1px solid ${tokens.border};
        }

        .media-header h2 {
          margin: 0 0 4px;
          font-size: 20px;
        }

        .media-header p {
          margin: 0;
          font-size: 13px;
          color: ${tokens.textSoft};
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          border: 1px solid ${tokens.border};
          border-radius: 12px;
          background: ${tokens.soft};
          color: ${tokens.textSoft};
          cursor: pointer;
        }

        .media-tabs {
          display: flex;
          gap: 10px;
          padding: 14px 22px 0;
        }

        .media-tab {
          height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid ${tokens.border};
          background: transparent;
          color: ${tokens.textSoft};
          cursor: pointer;
          font-weight: 600;
        }

        .media-tab.active {
          background: rgba(239, 159, 39, 0.12);
          border-color: rgba(239, 159, 39, 0.28);
          color: ${ORANGE};
        }

        .media-body {
          padding: 22px;
          overflow: auto;
        }

        .dropzone {
          min-height: 240px;
          border: 1.5px dashed rgba(239, 159, 39, 0.22);
          background: ${tokens.soft};
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-align: center;
          padding: 24px;
          cursor: pointer;
        }

        .dropzone.drag-active,
        .dropzone:hover {
          border-color: rgba(239, 159, 39, 0.62);
          background: rgba(239, 159, 39, 0.05);
        }

        .dropzone-icon {
          font-size: 34px;
          margin-bottom: 4px;
        }

        .selected-file {
          margin-top: 16px;
          background: ${tokens.soft};
          border: 1px solid ${tokens.border};
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .selected-file strong {
          display: block;
          margin-bottom: 4px;
        }

        .selected-file span {
          color: ${tokens.textSoft};
          font-size: 12px;
        }

        .media-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        .search-input {
          width: 100%;
          height: 44px;
          border-radius: 14px;
          border: 1px solid ${tokens.border};
          background: ${tokens.soft};
          color: ${tokens.text};
          padding: 0 14px;
          outline: none;
          margin-bottom: 16px;
        }

        .library-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .library-card {
          border: 1px solid ${tokens.border};
          border-radius: 16px;
          background: ${tokens.soft};
          padding: 0;
          overflow: hidden;
          text-align: left;
          cursor: pointer;
        }

        .library-card img {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          display: block;
        }

        .library-card span {
          display: block;
          padding: 10px 12px 12px;
          font-size: 12px;
          color: ${tokens.textSoft};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-empty {
          min-height: 180px;
          display: grid;
          place-items: center;
          color: ${tokens.textSoft};
          font-size: 14px;
          border: 1px dashed ${tokens.border};
          border-radius: 18px;
          background: ${tokens.soft};
        }

        .inline-error {
          margin-top: 14px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.16);
          color: #ef4444;
          border-radius: 14px;
          padding: 12px 14px;
          font-size: 13px;
        }

        .ghost-btn,
        .primary-btn {
          height: 42px;
          padding: 0 16px;
          border-radius: 12px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        .ghost-btn {
          background: ${tokens.soft};
          border: 1px solid ${tokens.border};
          color: ${tokens.textSoft};
        }

        .primary-btn {
          background: ${ORANGE};
          color: white;
        }

        .primary-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 720px) {
          .media-shell {
            padding: 14px;
          }

          .library-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>
    </>,
    document.body
  );
}

export default function EditReferencePage() {
  const router = useRouter();
  const params = useParams();
  const { dark } = useTheme();

  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    details: '',
    image: 'https://picsum.photos/id/20/1200/800',
    date: new Date().getFullYear().toString(),
    client: '',
    country: 'France',
    code: 'fr',
    lat: 46.2276,
    lng: 2.2137,
    category: CATEGORIES[0],
    tags: '',
    impact: '',
    technologies: '',
    team: '',
    duration: '',
    budget: '',
    status: 'PUBLISHED' as ReferenceStatus,
  });

  const tokens = {
    pageBg: dark ? '#0A0E14' : '#F5F7FB',
    panel: dark ? '#111722' : '#FFFFFF',
    panelSoft: dark ? '#0E141E' : '#FAFBFC',
    border: dark ? 'rgba(255,255,255,.08)' : 'rgba(15,23,42,.08)',
    text: dark ? '#F5F7FA' : '#111827',
    textSoft: dark ? 'rgba(255,255,255,.58)' : 'rgba(17,24,39,.58)',
    textMute: dark ? 'rgba(255,255,255,.40)' : 'rgba(17,24,39,.40)',
    inputBg: dark ? '#0D131D' : '#FFFFFF',
  };

  useEffect(() => {
    const fetchReference = async () => {
      try {
        const res = await api.get<ReferenceResponse>(`/api/references/${id}`);
        const ref = res.data;

        setForm({
          title: ref.title || '',
          slug: ref.slug || '',
          excerpt: ref.excerpt || '',
          details: ref.details || '',
          image: ref.image || 'https://picsum.photos/id/20/1200/800',
          date: ref.date || new Date().getFullYear().toString(),
          client: ref.client || '',
          country: ref.country || 'France',
          code: (ref.code || 'fr').toLowerCase(),
          lat: Number(ref.lat ?? 0),
          lng: Number(ref.lng ?? 0),
          category: ref.category || CATEGORIES[0],
          tags: Array.isArray(ref.tags) ? ref.tags.join(', ') : '',
          impact: ref.impact || '',
          technologies: Array.isArray(ref.technologies) ? ref.technologies.join(', ') : '',
          team: ref.team || '',
          duration: ref.duration || '',
          budget: ref.budget || '',
          status: ref.status || 'PUBLISHED',
        });
      } catch (error) {
        console.error(error);
        router.push('/admin/references');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReference();
  }, [id, router]);

  const imagePreview = useMemo(() => {
    if (!form.image?.trim()) return 'https://picsum.photos/id/20/1200/800';
    return form.image;
  }, [form.image]);

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      return { ...prev, [key]: '' };
    });
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: slugify(value),
    }));
    setErrors((prev) => ({
      ...prev,
      title: '',
      slug: '',
    }));
  };

  const handleCountryChange = (countryName: string) => {
    const country = COUNTRY_BY_NAME[countryName];
    if (!country) return;

    setForm((prev) => ({
      ...prev,
      country: country.name,
      code: country.code.toLowerCase(),
      lat: country.lat,
      lng: country.lng,
    }));

    setPendingLocation(null);
    setErrors((prev) => ({
      ...prev,
      country: '',
      code: '',
      lat: '',
      lng: '',
    }));
  };

  const confirmPickedLocation = () => {
    if (!pendingLocation) return;

    setForm((prev) => ({
      ...prev,
      lat: Number(pendingLocation.lat.toFixed(6)),
      lng: Number(pendingLocation.lng.toFixed(6)),
    }));

    setPendingLocation(null);
    setErrors((prev) => ({
      ...prev,
      lat: '',
      lng: '',
    }));
  };

  const resetLocationToCountry = () => {
    const country = COUNTRY_BY_NAME[form.country];
    if (!country) return;

    setForm((prev) => ({
      ...prev,
      lat: country.lat,
      lng: country.lng,
    }));

    setPendingLocation(null);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.title.trim()) nextErrors.title = 'Le titre est requis';
    if (!form.slug.trim()) nextErrors.slug = 'Le slug est requis';
    if (!form.client.trim()) nextErrors.client = 'Le client est requis';
    if (!form.country.trim()) nextErrors.country = 'Le pays est requis';
    if (!form.category.trim()) nextErrors.category = 'La catégorie est requise';
    if (!form.excerpt.trim()) nextErrors.excerpt = "L'extrait est requis";
    if (!form.details.trim()) nextErrors.details = 'Le détail complet est requis';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        tags: splitCommaValues(form.tags),
        technologies: splitCommaValues(form.technologies),
        lat: Number(form.lat),
        lng: Number(form.lng),
      };

      await api.patch(`/api/references/${id}`, payload);
      router.push('/admin/references');
    } catch (error: any) {
      const data = error?.response?.data;

      if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
        setErrors(data.fieldErrors);
      } else {
        setErrors({
          general:
            data?.error ||
            data?.message ||
            'Erreur lors de la mise à jour de la référence.',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <style jsx>{`
          .loading-page {
            min-height: 60vh;
            display: grid;
            place-items: center;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid rgba(239, 159, 39, 0.18);
            border-top-color: ${ORANGE};
            animation: spin 0.75s linear infinite;
          }
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="back-btn"
            onClick={() => router.push('/admin/references')}
          >
            ← Retour
          </button>

          <div className="title-wrap">
            <h1>Modifier la référence</h1>
            <p>{form.title || 'Mettre à jour la fiche projet existante'}</p>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => router.push('/admin/references')}
          >
            Annuler
          </button>

          <button
            type="button"
            className="primary-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="main-column">
          <div className="section-card">
            <div className="section-head">
              <h2>Informations principales</h2>
              <p>Les éléments visibles en priorité dans la fiche</p>
            </div>

            <div className="field-grid">
              <div className="field full">
                <label>Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex. Transformation digitale Groupe La Poste"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="field full">
                <label>Slug *</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    updateField(
                      'slug',
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    )
                  }
                  placeholder="transformation-digitale-groupe-la-poste"
                  className={errors.slug ? 'error' : ''}
                />
                {errors.slug && <span className="error-text">{errors.slug}</span>}
              </div>

              <div className="field">
                <label>Client *</label>
                <input
                  type="text"
                  value={form.client}
                  onChange={(e) => updateField('client', e.target.value)}
                  placeholder="Groupe La Poste"
                  className={errors.client ? 'error' : ''}
                />
                {errors.client && <span className="error-text">{errors.client}</span>}
              </div>

              <div className="field">
                <label>Pays *</label>
                <select
                  value={form.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={errors.country ? 'error' : ''}
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country.code} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && <span className="error-text">{errors.country}</span>}
              </div>

              <div className="field">
                <label>Code ISO</label>
                <input
                  type="text"
                  value={form.code.toUpperCase()}
                  readOnly
                  placeholder="FR"
                />
              </div>

              <div className="field">
                <label>Année</label>
                <input
                  type="number"
                  min="2000"
                  max="2035"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>

              <div className="field full">
                <label>Catégorie *</label>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={errors.category ? 'error' : ''}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <h2>Contenu éditorial</h2>
              <p>Résumé et détails de la référence</p>
            </div>

            <div className="field-stack">
              <div className="field">
                <label>Extrait *</label>
                <RichTextEditor
                  value={form.excerpt}
                  onChange={(val) => updateField('excerpt', val)}
                  placeholder="Un court extrait de la référence..."
                  minHeight={180}
                />
                {errors.excerpt && <span className="error-text">{errors.excerpt}</span>}
              </div>

              <div className="field">
                <label>Détails complets *</label>
                <RichTextEditor
                  value={form.details}
                  onChange={(val) => updateField('details', val)}
                  placeholder="Description complète de la référence..."
                  minHeight={260}
                />
                {errors.details && <span className="error-text">{errors.details}</span>}
              </div>
            </div>
          </div>
        </section>

        <aside className="side-column">
          <div className="section-card">
            <div className="section-head">
              <h2>Image</h2>
              <p>Couverture affichée sur la carte et la fiche détail</p>
            </div>

            <div className="cover-preview">
              <img src={imagePreview} alt="Prévisualisation de couverture" />
            </div>

            <div className="cover-actions">
              <button
                type="button"
                className="secondary-btn w-full"
                onClick={() => setShowMediaPicker(true)}
              >
                Ajouter ou choisir une image
              </button>
            </div>

            <div className="field">
              <label>URL de l’image</label>
              <input
                type="text"
                value={form.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="https://…"
              />
              {errors.image && <span className="error-text">{errors.image}</span>}
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <h2>Métadonnées</h2>
              <p>Informations complémentaires du projet</p>
            </div>

            <div className="field-grid">
              <div className="field full">
                <label>Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => updateField('tags', e.target.value)}
                  placeholder="UX/UI, Microservices, IA…"
                />
              </div>

              <div className="field full">
                <label>Technologies</label>
                <input
                  type="text"
                  value={form.technologies}
                  onChange={(e) => updateField('technologies', e.target.value)}
                  placeholder="React, Node.js, PostgreSQL…"
                />
              </div>

              <div className="field">
                <label>Impact</label>
                <input
                  type="text"
                  value={form.impact}
                  onChange={(e) => updateField('impact', e.target.value)}
                  placeholder="+42% satisfaction"
                />
              </div>

              <div className="field">
                <label>Équipe</label>
                <input
                  type="text"
                  value={form.team}
                  onChange={(e) => updateField('team', e.target.value)}
                  placeholder="12 consultants"
                />
              </div>

              <div className="field">
                <label>Durée</label>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(e) => updateField('duration', e.target.value)}
                  placeholder="18 mois"
                />
              </div>

              <div className="field">
                <label>Budget</label>
                <input
                  type="text"
                  value={form.budget}
                  onChange={(e) => updateField('budget', e.target.value)}
                  placeholder="2.4M€"
                />
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <h2>Localisation</h2>
              <p>
                Choisis un pays pour préremplir les coordonnées, puis ajuste le point sur
                la carte si besoin.
              </p>
            </div>

            <div className="location-help">
              <span>1. Le pays remplit automatiquement le centre du pays</span>
              <span>2. Clique sur la carte pour proposer un nouveau point</span>
              <span>3. Clique sur “Utiliser ce point” pour le valider</span>
            </div>

            <div className="location-summary">
              <div className="location-box current">
                <small>Coordonnées actuelles</small>
                <strong>
                  {Number(form.lat).toFixed(6)}, {Number(form.lng).toFixed(6)}
                </strong>
              </div>

              <div className={`location-box pending ${pendingLocation ? 'visible' : ''}`}>
                <small>Nouveau point détecté</small>
                <strong>
                  {pendingLocation
                    ? `${pendingLocation.lat.toFixed(6)}, ${pendingLocation.lng.toFixed(6)}`
                    : 'Clique sur la carte'}
                </strong>
              </div>
            </div>

            <div className="field-stack">
              <div className="coords-row">
                <div className="field">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lat}
                    onChange={(e) => updateField('lat', Number(e.target.value))}
                  />
                  {errors.lat && <span className="error-text">{errors.lat}</span>}
                </div>

                <div className="field">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lng}
                    onChange={(e) => updateField('lng', Number(e.target.value))}
                  />
                  {errors.lng && <span className="error-text">{errors.lng}</span>}
                </div>
              </div>

              <LocationPicker
                lat={pendingLocation?.lat ?? form.lat}
                lng={pendingLocation?.lng ?? form.lng}
                onLocationChange={(lat, lng) =>
                  setPendingLocation({
                    lat: Number(lat.toFixed(6)),
                    lng: Number(lng.toFixed(6)),
                  })
                }
              />

              <div className="map-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={resetLocationToCountry}
                >
                  Recentrer sur le pays
                </button>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={confirmPickedLocation}
                  disabled={!pendingLocation}
                >
                  Utiliser ce point
                </button>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-head">
              <h2>Statut</h2>
              <p>Choisir l’état de publication de la référence</p>
            </div>

            <div className="status-row">
              {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`status-chip ${form.status === status ? 'active' : ''}`}
                  onClick={() => updateField('status', status)}
                >
                  {status === 'DRAFT' && 'Brouillon'}
                  {status === 'PUBLISHED' && 'Publié'}
                  {status === 'ARCHIVED' && 'Archivé'}
                </button>
              ))}
            </div>
            {errors.status && <span className="error-text">{errors.status}</span>}
          </div>

          {errors.general && <div className="global-error">{errors.general}</div>}
        </aside>
      </main>

      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => updateField('image', url)}
      />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: ${tokens.pageBg};
          color: ${tokens.text};
          font-family: 'DM Sans', sans-serif;
        }

        .topbar {
          position: sticky;
          top: 0;
          z-index: 30;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 24px;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid ${tokens.border};
        }

        :global(.dark) .topbar {
          background: rgba(10, 14, 20, 0.72);
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        .title-wrap h1 {
          margin: 0;
          font-size: 22px;
          line-height: 1.1;
        }

        .title-wrap p {
          margin: 4px 0 0;
          color: ${tokens.textSoft};
          font-size: 13px;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .layout {
          max-width: 1320px;
          margin: 0 auto;
          padding: 28px 24px 40px;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
          gap: 24px;
          align-items: start;
        }

        .main-column,
        .side-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }

        .section-card {
          background: ${tokens.panel};
          border: 1px solid ${tokens.border};
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.04);
        }

        .section-head {
          margin-bottom: 18px;
        }

        .section-head h2 {
          margin: 0 0 4px;
          font-size: 17px;
          line-height: 1.2;
        }

        .section-head p {
          margin: 0;
          font-size: 13px;
          color: ${tokens.textSoft};
        }

        .field-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field-stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .field {
          min-width: 0;
        }

        .field.full {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: ${tokens.textMute};
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          min-width: 0;
          height: 46px;
          border-radius: 14px;
          border: 1px solid ${tokens.border};
          background: ${tokens.inputBg};
          color: ${tokens.text};
          padding: 0 14px;
          outline: none;
          transition: all 0.18s ease;
        }

        .field textarea {
          min-height: 120px;
          padding: 12px 14px;
          resize: vertical;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: rgba(239, 159, 39, 0.48);
          box-shadow: 0 0 0 4px rgba(239, 159, 39, 0.08);
        }

        .field input.error,
        .field select.error {
          border-color: #ef4444;
        }

        .error-text {
          margin-top: 6px;
          display: inline-block;
          font-size: 12px;
          color: #ef4444;
        }

        .global-error {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.14);
          color: #ef4444;
          border-radius: 16px;
          padding: 14px 16px;
          font-size: 14px;
        }

        .cover-preview {
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid ${tokens.border};
          background: ${tokens.panelSoft};
          margin-bottom: 14px;
        }

        .cover-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .cover-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 14px;
        }

        .status-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-chip {
          border: 1px solid ${tokens.border};
          background: ${tokens.panelSoft};
          color: ${tokens.textSoft};
          border-radius: 999px;
          min-height: 42px;
          padding: 0 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .status-chip.active {
          border-color: rgba(239, 159, 39, 0.34);
          background: rgba(239, 159, 39, 0.12);
          color: ${ORANGE};
        }

        .coords-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .location-help {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
          padding: 14px 16px;
          border-radius: 16px;
          background: ${tokens.panelSoft};
          border: 1px solid ${tokens.border};
          color: ${tokens.textSoft};
          font-size: 13px;
        }

        .location-summary {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .location-box {
          border-radius: 16px;
          padding: 14px 16px;
          border: 1px solid ${tokens.border};
          background: ${tokens.panelSoft};
        }

        .location-box small {
          display: block;
          color: ${tokens.textMute};
          margin-bottom: 6px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .location-box strong {
          font-size: 14px;
          color: ${tokens.text};
        }

        .location-box.pending {
          opacity: 0.7;
        }

        .location-box.pending.visible {
          opacity: 1;
          border-color: rgba(239, 159, 39, 0.34);
          background: rgba(239, 159, 39, 0.08);
        }

        .map-actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .back-btn,
        .secondary-btn,
        .primary-btn {
          height: 44px;
          border-radius: 14px;
          padding: 0 16px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .back-btn,
        .secondary-btn {
          background: ${tokens.panelSoft};
          border: 1px solid ${tokens.border};
          color: ${tokens.textSoft};
        }

        .back-btn:hover,
        .secondary-btn:hover {
          color: ${tokens.text};
        }

        .primary-btn {
          background: ${ORANGE};
          color: white;
          box-shadow: 0 12px 24px rgba(239, 159, 39, 0.2);
        }

        .primary-btn:hover:not(:disabled) {
          background: ${ORANGE_DARK};
          transform: translateY(-1px);
        }

        .primary-btn:disabled {
          opacity: 0.56;
          cursor: not-allowed;
          transform: none;
        }

        .w-full {
          width: 100%;
        }

        .rich-editor-loading,
        .map-loading {
          min-height: 180px;
          border-radius: 16px;
          border: 1px solid ${tokens.border};
          background: ${tokens.panelSoft};
          display: grid;
          place-items: center;
          color: ${tokens.textSoft};
          font-size: 14px;
        }

        @media (max-width: 1100px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .topbar-left,
          .topbar-actions {
            width: 100%;
          }

          .topbar-actions {
            justify-content: flex-end;
          }

          .layout {
            padding: 20px 16px 32px;
          }

          .field-grid,
          .coords-row,
          .location-summary {
            grid-template-columns: 1fr;
          }

          .title-wrap h1 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}