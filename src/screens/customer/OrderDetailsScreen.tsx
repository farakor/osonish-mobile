import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet, ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Modal,
  Dimensions,
  Pressable,
  Animated,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';;
import { SvgXml } from 'react-native-svg';
import { theme } from '../../constants';
import { noElevationStyles } from '../../utils/noShadowStyles';
import { usePlatformSafeAreaInsets, getFixedBottomStyle, getEdgeToEdgeBottomStyle, getImprovedFixedBottomStyle } from '../../utils/safeAreaUtils';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { CustomerStackParamList } from '../../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import CalendarIcon from '../../../assets/card-icons/calendar.svg';
import LocationIcon from '../../../assets/card-icons/location.svg';
import CategoryIcon from '../../../assets/card-icons/category.svg';
import UserIcon from '../../../assets/user-01.svg';
import NoImagePlaceholder from '../../../assets/no-image-placeholder.svg';
import ArrowBackIcon from '../../../assets/arrow-narrow-left.svg';
import CarIcon from '../../../assets/car-01.svg';
import BankNoteIcon from '../../../assets/bank-note-01.svg';
import { VideoView, useVideoPlayer } from 'expo-video';
import LottieView from 'lottie-react-native';
import { HeaderWithBack, MediaViewer, OrderLocationMap, DropdownMenuItem, StatusBadge, DropdownMenu, StarIcon, CategoryIcon as CategoryIconComponent } from '../../components/common';
import { orderService } from '../../services/orderService';
import { getCategoryEmoji, getCategoryLabel } from '../../utils/categoryUtils';
import { getCategoryAnimation } from '../../utils/categoryIconUtils';
import { authService } from '../../services/authService';
import { getSpecializationIcon, getTranslatedSpecializationName, getSpecializationIconComponent } from '../../constants/specializations';
import { supabase } from '../../services/supabaseClient';
import { Order, Applicant, User } from '../../types';
import { useTranslation } from 'react-i18next';
import { useCustomerTranslation, useErrorsTranslation, useCommonTranslation, useWorkerTranslation } from '../../hooks/useTranslation';
import { OrderDetailsSkeleton } from '../../components/skeletons';

// SVG иконка empty-state-no-applications
const emptyStateNoApplicationsSvg = `<svg width="161" height="160" viewBox="0 0 161 160" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M85.0749 130.6C113.075 130.6 135.775 107.9 135.775 79.8C135.775 51.7 113.075 29 85.0749 29C57.0749 29 34.3749 51.7 34.3749 79.8C34.3749 107.9 57.0749 130.6 85.0749 130.6Z" fill="#F1F3FA"/>
<g filter="url(#filter0_d_6007_2070)">
<path d="M132.075 59.5H45.3749C43.4749 59.5 41.9749 58 41.9749 56.1V36.6C41.9749 34.7 43.4749 33.2 45.3749 33.2H131.975C133.875 33.2 135.375 34.7 135.375 36.6V56.1C135.475 58 133.875 59.5 132.075 59.5Z" fill="white"/>
</g>
<path d="M62.9749 46.3C62.9749 48.5 61.9749 50.5 60.4749 51.9C59.1749 53.1 57.3749 53.8 55.4749 53.8C53.5749 53.8 51.7749 53.1 50.4749 51.9C48.8749 50.5 47.9749 48.5 47.9749 46.3C47.9749 42.2 51.3749 38.8 55.4749 38.8C59.5749 38.8 62.9749 42.2 62.9749 46.3Z" fill="#D5DAE5"/>
<path d="M60.4749 51.9C59.1749 53.1 57.3749 53.8 55.4749 53.8C53.5749 53.8 51.7749 53.1 50.4749 51.9C51.0749 51.7 51.7749 51.4 52.6749 51C52.8749 50.9 53.0749 50.7 53.1749 50.5C53.2749 50.4 53.2749 50.2 53.2749 50.1V48.2L53.1749 48.1C52.9749 47.9 52.8749 47.6 52.8749 47.3L52.6749 47.2C52.1749 47.3 52.2749 46.8 52.0749 45.8C52.0749 45.4 52.0749 45.3 52.2749 45.2L52.4749 45C51.5749 42.9 51.9749 41.6 52.9749 41.1C52.6749 40.4 52.6749 40.2 52.6749 40.2C52.6749 40.2 54.6749 40.5 55.2749 40.4C56.1749 40.2 57.4749 40.4 57.9749 41.6C58.7749 41.9 59.0749 42.4 59.1749 43C59.2749 43.9 58.7749 44.9 58.6749 45.2C58.7749 45.3 58.8749 45.4 58.7749 45.7C58.6749 46.6 58.6749 47.2 58.1749 47.1L57.7749 48C57.7749 48.1 57.7749 48.1 57.7749 48.2C57.7749 48.3 57.7749 48.6 57.7749 50.2C57.7749 50.4 57.8749 50.6 57.8749 50.7C57.9749 50.9 58.1749 51 58.2749 51.1C59.1749 51.4 59.8749 51.7 60.4749 51.9Z" fill="white"/>
<path d="M58.7011 45.3C58.7011 45.0918 58.597 44.7796 58.4929 44.5714V44.4673C58.0766 43.6347 57.244 43.3224 56.4113 43.3224C54.3297 43.2183 54.1215 43.6347 53.3929 43.0102C53.6011 43.3224 53.6011 43.8428 53.2889 44.4673C53.0807 44.8836 52.6644 45.0918 52.248 45.1959C51.3113 43.0102 51.7276 41.6571 52.7684 41.1367C52.4562 40.4081 52.4562 40.2 52.4562 40.2C52.4562 40.2 54.5378 40.5122 55.1623 40.4081C56.0991 40.2 57.4521 40.4081 57.9725 41.6571C58.8052 41.9693 59.1174 42.4898 59.2215 43.1142C59.3256 43.8428 58.8052 44.8836 58.7011 45.3Z" fill="#AAB2C5"/>
<path d="M57.8748 50.6999V51.0999H53.1748V50.5999C53.2748 50.4999 53.2748 50.2999 53.2748 50.1999V48.2999L53.1748 48.1999V48.0999C53.2748 48.2999 53.3748 48.3999 53.5748 48.5999L55.0748 49.5999C55.3748 49.8999 55.8748 49.8999 56.2748 49.5999L57.6748 48.3999L57.7748 48.2999C57.7748 48.3999 57.7748 48.6999 57.7748 50.2999C57.6748 50.3999 57.7748 50.4999 57.8748 50.6999Z" fill="url(#paint0_linear_6007_2070)"/>
<path d="M87.5748 44.1H68.3748C67.8748 44.1 67.5748 43.7 67.5748 43.3V40.8C67.5748 40.3 67.9748 40 68.3748 40H87.5748C88.0748 40 88.3748 40.4 88.3748 40.8V43.3C88.3748 43.8 88.0748 44.1 87.5748 44.1Z" fill="#D5DAE5"/>
<path d="M110.375 52.6H68.3748C67.8748 52.6 67.5748 52.2 67.5748 51.8V49.3C67.5748 48.8 67.9748 48.5 68.3748 48.5H110.375C110.875 48.5 111.175 48.9 111.175 49.3V51.8C111.175 52.3 110.775 52.6 110.375 52.6Z" fill="#D5DAE5"/>
<g filter="url(#filter1_d_6007_2070)">
<path d="M132.075 125.1H45.3749C43.4749 125.1 41.9749 123.6 41.9749 121.7V102.2C41.9749 100.3 43.4749 98.8 45.3749 98.8H131.975C133.875 98.8 135.375 100.3 135.375 102.2V121.7C135.475 123.6 133.875 125.1 132.075 125.1Z" fill="white"/>
</g>
<path d="M62.9749 111.9C62.9749 114.1 61.9749 116.1 60.4749 117.5C59.1749 118.7 57.3749 119.4 55.4749 119.4C53.5749 119.4 51.7749 118.7 50.4749 117.5C48.8749 116.1 47.9749 114.1 47.9749 111.9C47.9749 107.8 51.3749 104.4 55.4749 104.4C59.5749 104.4 62.9749 107.8 62.9749 111.9Z" fill="#D5DAE5"/>
<path d="M60.4749 117.5C59.1749 118.7 57.3749 119.4 55.4749 119.4C53.5749 119.4 51.7749 118.7 50.4749 117.5C51.0749 117.3 51.7749 117 52.6749 116.6C52.8749 116.5 53.0749 116.3 53.1749 116.1C53.2749 116 53.2749 115.8 53.2749 115.7V113.8L53.1749 113.7C52.9749 113.5 52.8749 113.2 52.8749 112.9L52.6749 112.8C52.1749 112.9 52.2749 112.4 52.0749 111.4C52.0749 111 52.0749 110.9 52.2749 110.8L52.4749 110.6C51.5749 108.5 51.9749 107.2 52.9749 106.7C52.6749 106 52.6749 105.8 52.6749 105.8C52.6749 105.8 54.6749 106.1 55.2749 106C56.1749 105.8 57.4749 106 57.9749 107.2C58.7749 107.5 59.0749 108 59.1749 108.6C59.2749 109.5 58.7749 110.5 58.6749 110.8C58.7749 110.9 58.8749 111 58.7749 111.3C58.6749 112.2 58.6749 112.8 58.1749 112.7L57.7749 113.5C57.7749 113.6 57.7749 113.6 57.7749 113.7C57.7749 113.8 57.7749 114.1 57.7749 115.7C57.7749 115.9 57.8749 116.1 57.8749 116.2C57.9749 116.4 58.1749 116.5 58.2749 116.6C59.1749 117.1 59.8749 117.3 60.4749 117.5Z" fill="white"/>
<path d="M58.7011 110.9C58.7011 110.692 58.597 110.38 58.4929 110.171V110.067C58.0766 109.235 57.244 108.923 56.4113 108.923C54.3297 108.818 54.1215 109.235 53.3929 108.61C53.6011 108.923 53.6011 109.443 53.2889 110.067C53.0807 110.484 52.6644 110.692 52.248 110.796C51.3113 108.61 51.7276 107.257 52.7684 106.737C52.4562 106.008 52.4562 105.8 52.4562 105.8C52.4562 105.8 54.5378 106.112 55.1623 106.008C56.0991 105.8 57.4521 106.008 57.9725 107.257C58.8052 107.569 59.1174 108.09 59.2215 108.714C59.3256 109.547 58.8052 110.484 58.7011 110.9Z" fill="#AAB2C5"/>
<path d="M57.8748 116.3V116.7H53.1748V116.2C53.2748 116.1 53.2748 115.9 53.2748 115.8V113.9L53.1748 113.8V113.7C53.2748 113.9 53.3748 114 53.5748 114.2L55.0748 115.2C55.3748 115.5 55.8748 115.5 56.2748 115.2L57.6748 114L57.7748 113.9C57.7748 114 57.7748 114.3 57.7748 115.9C57.6748 116 57.7748 116.2 57.8748 116.3Z" fill="url(#paint1_linear_6007_2070)"/>
<path d="M87.5748 109.8H68.3748C67.8748 109.8 67.5748 109.4 67.5748 109V106.5C67.5748 106 67.9748 105.7 68.3748 105.7H87.5748C88.0748 105.7 88.3748 106.1 88.3748 106.5V109C88.3748 109.4 88.0748 109.8 87.5748 109.8Z" fill="#D5DAE5"/>
<path d="M110.375 118.3H68.3748C67.8748 118.3 67.5748 117.9 67.5748 117.5V115C67.5748 114.5 67.9748 114.2 68.3748 114.2H110.375C110.875 114.2 111.175 114.6 111.175 115V117.5C111.175 117.9 110.775 118.3 110.375 118.3Z" fill="#D5DAE5"/>
<g filter="url(#filter2_d_6007_2070)">
<path d="M117.375 92.3H30.7749C28.8749 92.3 27.3749 90.8 27.3749 88.9V69.4C27.3749 67.5 28.8749 66 30.7749 66H117.375C119.275 66 120.775 67.5 120.775 69.4V88.9C120.875 90.8 119.275 92.3 117.375 92.3Z" fill="white"/>
</g>
<path d="M72.9749 76.9001H53.7749C53.2749 76.9001 52.9749 76.5 52.9749 76.1V73.6C52.9749 73.1 53.3749 72.8 53.7749 72.8H72.9749C73.4749 72.8 73.7749 73.2 73.7749 73.6V76.1C73.7749 76.6 73.4749 76.9001 72.9749 76.9001Z" fill="#D5DAE5"/>
<path d="M95.7749 85.5001H53.7749C53.2749 85.5001 52.9749 85.1001 52.9749 84.7001V82.2001C52.9749 81.7001 53.3749 81.4001 53.7749 81.4001H95.6749C96.1749 81.4001 96.4749 81.8001 96.4749 82.2001V84.7001C96.5749 85.1001 96.1749 85.5001 95.7749 85.5001Z" fill="#D5DAE5"/>
<path d="M48.4749 79.1001C48.4749 81.2001 47.5749 83.1001 46.1749 84.5001C46.0749 84.6001 46.0749 84.6001 45.9749 84.7001C44.6749 85.9001 42.8749 86.6001 40.9749 86.6001C39.0749 86.6001 37.3749 85.9001 36.0749 84.8001C36.0749 84.8001 36.0749 84.8001 35.9749 84.8001C34.3749 83.4001 33.3749 81.4001 33.3749 79.1001C33.3749 75.0001 36.7749 71.6001 40.8749 71.6001C45.0749 71.6001 48.4749 75.0001 48.4749 79.1001Z" fill="#D5DAE5"/>
<path d="M46.1456 84.6525C45.8414 83.9426 45.3343 83.3341 44.523 82.9285C44.1174 82.7257 43.8132 82.6243 43.3061 82.6243H43.0019C42.292 82.6243 42.1906 82.5228 42.1906 82.5228V81.3059C43.0019 80.6975 43.6103 79.8862 43.8132 78.9735C44.3202 78.8721 44.6244 78.4665 44.523 77.9594C44.523 77.7566 44.3202 77.5538 44.3202 77.3509C44.3202 77.2495 44.3202 77.1481 44.3202 77.0467C44.3202 76.9453 44.3202 76.9453 44.3202 76.8439C44.3202 76.7425 44.3202 76.7425 44.3202 76.6411C44.3202 76.2354 44.2188 75.9312 43.9146 75.5256C43.3061 74.4101 42.0892 73.7002 40.7709 73.7002C40.4666 73.7002 40.2638 73.7002 39.9596 73.8016C39.4525 73.903 39.0469 74.1058 38.6413 74.4101C38.5399 74.5115 38.5399 74.5115 38.4384 74.6129C38.4384 74.6129 38.4384 74.6129 38.337 74.7143C37.9314 75.1199 37.6272 75.627 37.4243 76.134C37.2215 76.6411 37.2215 77.2495 37.2215 77.858C37.2215 77.858 37.2215 77.858 37.2215 77.9594C37.2215 78.0608 37.2215 78.0608 37.2215 78.1622C37.2215 78.1622 37.2215 78.2636 37.1201 78.2636C37.3229 78.0608 37.2215 78.365 37.3229 78.5679C37.5258 79.0749 37.83 78.9735 38.2356 79.2777C38.2356 79.2777 38.2356 79.2777 38.1342 79.2777L37.7286 79.3791C35.4976 80.089 35.2947 82.4214 37.5258 82.9285C37.3229 83.0299 37.2215 83.1313 37.1201 83.1313C36.5117 83.6384 36.106 84.2468 35.9032 84.8553C37.2215 85.9708 38.9455 86.6806 40.8723 86.6806C42.7991 86.6806 44.6244 85.9708 45.9428 84.7539C46.0442 84.8553 46.1456 84.7539 46.1456 84.6525C46.247 84.6525 46.247 84.6525 46.1456 84.6525ZM39.8582 82.2186C39.7568 82.1172 39.6554 82.0158 39.6554 82.0158C39.554 81.9144 39.4525 81.9144 39.3511 81.813C39.3511 81.813 39.2497 81.813 39.2497 81.7116C38.9455 81.5087 38.6413 81.3059 38.5399 81.0017C38.5399 80.9003 38.6413 80.6975 38.8441 80.4947C38.9455 80.5961 39.0469 80.6975 39.1483 80.9003C39.2497 81.0017 39.3511 81.1031 39.4525 81.2045C39.554 81.2045 39.6554 81.3059 39.6554 81.4073C39.6554 81.4073 39.6554 81.4073 39.7568 81.4073C39.7568 81.4073 39.7568 81.4073 39.8582 81.4073V82.2186Z" fill="white"/>
<path d="M43.1249 82.5664C43.0249 82.9664 42.8249 83.2664 42.8249 83.2664L39.0249 82.6664L39.2249 81.6664C39.2249 81.6664 39.3249 81.6664 39.3249 81.7664C39.4249 81.8664 39.5249 81.8664 39.6249 81.9664C39.7249 81.9664 39.7249 82.0664 39.8249 82.1664V81.4664C39.8249 81.4664 39.8249 81.4664 39.7249 81.4664C40.3249 81.7664 41.1249 81.9664 42.2249 81.2664V82.4664C42.3249 82.4664 42.4249 82.5664 43.1249 82.5664Z" fill="url(#paint2_linear_6007_2070)"/>
<path d="M42.3346 76.9886C43.048 76.9886 43.7614 76.8866 44.3729 76.6828C44.3729 76.6828 44.3729 76.5809 44.4749 76.479C44.3729 76.1732 44.271 75.7656 44.0672 75.3579C43.4557 74.2368 42.2327 73.5234 40.9078 73.5234C40.6021 73.5234 40.3088 73.5452 39.8999 73.6472C39.3557 73.8135 39.103 73.9597 38.9741 74.0378C38.9741 74.0378 38.6762 74.2381 38.4619 74.4407C38.2475 74.6432 37.7485 75.3579 37.5446 75.8675C37.3408 76.479 37.1763 76.9987 37.2783 77.6102C37.3802 77.6102 37.5446 77.4981 37.6465 77.4981C38.4619 77.0905 39.0734 76.5809 39.3791 75.7656C40.1944 76.479 41.2136 76.8866 42.3346 76.9886Z" fill="#AAB2C5"/>
<path d="M40.2749 84.3C39.9749 84.7 39.4749 84.7001 38.9749 84.7001C39.4749 84.2001 39.1749 82.7001 37.5749 82.9001C35.2749 82.5001 35.5749 80.1001 37.7749 79.4001L38.1749 79.3C38.1749 79.3 38.1749 79.3001 38.2749 79.4001C38.4749 79.9001 38.6749 80.2 38.9749 80.6C38.0749 81.4 39.3749 81.6001 39.9749 82.2001C40.3749 82.4001 40.7749 83.7 40.2749 84.3Z" fill="#AAB2C5"/>
<defs>
<filter id="filter0_d_6007_2070" x="32.9749" y="29.2" width="111.404" height="44.3" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="5"/>
<feGaussianBlur stdDeviation="4.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.397708 0 0 0 0 0.47749 0 0 0 0 0.575 0 0 0 0.17 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6007_2070"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6007_2070" result="shape"/>
</filter>
<filter id="filter1_d_6007_2070" x="32.9749" y="94.8" width="111.404" height="44.3" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="5"/>
<feGaussianBlur stdDeviation="4.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.397708 0 0 0 0 0.47749 0 0 0 0 0.575 0 0 0 0.17 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6007_2070"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6007_2070" result="shape"/>
</filter>
<filter id="filter2_d_6007_2070" x="18.3749" y="62" width="111.404" height="44.3" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="5"/>
<feGaussianBlur stdDeviation="4.5"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.397708 0 0 0 0 0.47749 0 0 0 0 0.575 0 0 0 0.17 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_6007_2070"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_6007_2070" result="shape"/>
</filter>
<linearGradient id="paint0_linear_6007_2070" x1="55.5262" y1="51.1181" x2="55.5262" y2="49.4654" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="#E2E5EC"/>
</linearGradient>
<linearGradient id="paint1_linear_6007_2070" x1="55.5262" y1="116.718" x2="55.5262" y2="115.066" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="#E2E5EC"/>
</linearGradient>
<linearGradient id="paint2_linear_6007_2070" x1="41.0761" y1="83.2785" x2="41.0761" y2="82.1767" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="#E2E5EC"/>
</linearGradient>
</defs>
</svg>`;

const { width, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // 24px margin on each side

// Убираем определение Android - используем одинаковое меню для всех платформ

type OrderDetailsRouteProp = RouteProp<CustomerStackParamList, 'OrderDetails'>;
type NavigationProp = NativeStackNavigationProp<CustomerStackParamList>;

// Вспомогательная функция для определения видео файлов
const isVideoFile = (uri: string): boolean => {
  return /\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv)(\?|$)/i.test(uri) ||
    uri.includes('video') ||
    uri.includes('/video/') ||
    uri.includes('_video_');
};

// Компонент для превью видео
const VideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={styles.mediaImage}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

// Компонент для изображения с обработкой ошибок
const SafeImage: React.FC<{ uri: string; index: number }> = ({ uri, index }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <View style={[styles.mediaImage, styles.errorContainer]}>
        <Text style={styles.errorText}>❌</Text>
        <Text style={styles.errorSubtext}>Ошибка загрузки</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaImageContainer}>
      <Image
        source={{ uri }}
        style={styles.mediaImage}
        resizeMode="cover"
        onLoad={() => {
          console.log(`[OrderDetails] ✅ Изображение ${index + 1} загружено`);
          setIsLoading(false);
        }}
        onError={(error) => {
          console.error(`[OrderDetails] ❌ Ошибка загрузки изображения ${index + 1}:`, error.nativeEvent.error);
          console.error(`[OrderDetails] URL: ${uri}`);
          setHasError(true);
          setIsLoading(false);
        }}
        onLoadStart={() => {
          console.log(`[OrderDetails] 🔄 Начинаем загрузку изображения ${index + 1}`);
          setIsLoading(true);
        }}
      />
      {isLoading && (
        <View style={[styles.mediaImage, styles.loadingOverlay]}>
          <Text style={styles.loadingText}>⏳</Text>
        </View>
      )}
    </View>
  );
};

// Компонент галереи изображений
const ImageGallery: React.FC<{ photos: string[] }> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const renderPhoto = ({ item, index }: { item: string; index: number }) => {
    const isVideo = isVideoFile(item);

    return (
      <View style={styles.photoContainer}>
        <MediaViewer
          uri={item}
          isVideo={isVideo}
          style={styles.mediaTouch}
          allImages={photos}
        >
          {isVideo ? (
            <VideoPreview uri={item} />
          ) : (
            <SafeImage uri={item} index={index} />
          )}
        </MediaViewer>
      </View>
    );
  };

  const onScroll = (event: any) => {
    const slideSize = CARD_WIDTH;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({ index: currentIndex - 1, animated: true });
    }
  };

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  return (
    <View style={styles.galleryContainer}>
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderPhoto}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item: string, index: number) => index.toString()}
      />

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonLeft]}
            onPress={goToPrevious}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={goToNext}
            disabled={currentIndex === photos.length - 1}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Dots indicator */}
      {photos.length > 1 && (
        <View style={styles.dotsContainer}>
          {photos.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const OrderDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OrderDetailsRouteProp>();
  const { orderId } = route.params;
  const insets = usePlatformSafeAreaInsets();
  const { t: translate } = useTranslation();
  const t = useCustomerTranslation();
  const tError = useErrorsTranslation();
  const tCommon = useCommonTranslation();
  const tWorker = useWorkerTranslation();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orderCustomer, setOrderCustomer] = useState<User | null>(null); // Владелец заказа
  
  // НОВОЕ: Определяем контекст просмотра
  const isMyOrder = order?.customerId === currentUser?.id;
  const isWorker = currentUser?.role === 'worker';
  const viewingAsCustomer = isMyOrder; // Просматриваем как заказчик (владелец заказа)

  // Анимация для sticky header
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_HEIGHT = 100;
  const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 44; // 44 для iOS, currentHeight для Android

  // Состояния для подтверждения выбора исполнителя
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);

  // Состояния для завершения заказа
  const [isCompletingOrder, setIsCompletingOrder] = useState(false);

  // Анимация для карточек откликов
  const animatedCards = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Функция для проверки, можно ли показывать кнопку "Завершить"
  const canShowCompleteButton = (order: Order | null): boolean => {
    // Кнопка "Завершить" видна только для своих заказов со статусом "in_progress"
    return isMyOrder && order?.status === 'in_progress';
  };

  // Загружаем заказ по ID
  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        // Получаем информацию о текущем пользователе
        const authState = authService.getAuthState();
        if (authState.user) {
          setCurrentUser(authState.user);
        }

        // Загружаем информацию о владельце заказа (заказчике)
        if (orderData && orderData.customerId) {
          try {
            const { data: customerData, error: customerError } = await supabase
              .from('users')
              .select('*')
              .eq('id', orderData.customerId)
              .single();
            
            if (customerData && !customerError) {
              setOrderCustomer({
                id: customerData.id,
                phone: customerData.phone,
                firstName: customerData.first_name,
                lastName: customerData.last_name,
                role: customerData.role,
                profileImage: customerData.profile_image,
                city: customerData.city,
                createdAt: customerData.created_at
              });
            }
          } catch (error) {
            console.error('Ошибка загрузки данных заказчика:', error);
          }
        }

        // Увеличиваем счетчик просмотров заказа
        if (orderData) {
          await orderService.incrementOrderViews(orderId);
        }
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        Alert.alert(tError('error'), t('load_order_error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  // Загружаем отклики для заказа
  useEffect(() => {
    const loadApplicants = async () => {
      if (!orderId) return;

      try {
        setApplicantsLoading(true);
        const filteredApplicants = await orderService.getFilteredApplicantsForOrder(orderId);
        setApplicants(filteredApplicants);

        // Инициализируем список принятых исполнителей
        const accepted = new Set(
          filteredApplicants
            .filter(applicant => applicant.status === 'accepted')
            .map(applicant => applicant.id)
        );
        setAcceptedApplicants(accepted);

        console.log(`[OrderDetailsScreen] Загружено ${filteredApplicants.length} отфильтрованных откликов для заказа ${orderId}, принято: ${accepted.size}`);
      } catch (error) {
        console.error('Ошибка загрузки откликов:', error);
      } finally {
        setApplicantsLoading(false);
      }
    };

    loadApplicants();
  }, [orderId]);

  // Создаем функции для переиспользования
  const loadOrderData = useCallback(async () => {
    try {
      setIsLoading(true);
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);

      // Получаем информацию о текущем пользователе
      const authState = authService.getAuthState();
      if (authState.user) {
        setCurrentUser(authState.user);
      }
    } catch (error) {
      console.error('[OrderDetailsScreen] Ошибка загрузки заказа:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const loadApplicantsData = useCallback(async () => {
    if (!orderId) return;

    // Загружаем отклики только для своих заказов
    if (!isMyOrder) {
      console.log('[OrderDetailsScreen] Пропускаем загрузку откликов - это не мой заказ');
      return;
    }

    try {
      setApplicantsLoading(true);
      const filteredApplicants = await orderService.getFilteredApplicantsForOrder(orderId);
      setApplicants(filteredApplicants);

      // Инициализируем список принятых исполнителей
      const accepted = new Set(
        filteredApplicants
          .filter(applicant => applicant.status === 'accepted')
          .map(applicant => applicant.id)
      );
      setAcceptedApplicants(accepted);

      console.log(`[OrderDetailsScreen] Загружено ${filteredApplicants.length} отфильтрованных откликов для заказа ${orderId}, принято: ${accepted.size}`);
    } catch (error) {
      console.error('[OrderDetailsScreen] Ошибка загрузки откликов:', error);
    } finally {
      setApplicantsLoading(false);
    }
  }, [orderId, isMyOrder]);

  // Обновляем данные при возврате на экран
  useFocusEffect(
    useCallback(() => {
      console.log('[OrderDetailsScreen] 🔄 useFocusEffect: перезагружаем данные');
      loadOrderData();
      loadApplicantsData();
    }, [loadOrderData, loadApplicantsData])
  );

  // Real-time обновления для заказа
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !orderId) {
      return;
    }

    console.log('[OrderDetailsScreen] Подключаем real-time обновления заказа');

    const orderSubscription = supabase
      .channel('order_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[OrderDetailsScreen] Real-time изменение заказа:', payload);
          loadOrderData();
        }
      )
      .subscribe();

    return () => {
      console.log('[OrderDetailsScreen] Отключаем real-time обновления заказа');
      orderSubscription.unsubscribe();
    };
  }, [orderId, loadOrderData]);

  // Real-time обновления для откликов
  useEffect(() => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user || !orderId) {
      return;
    }

    console.log('[OrderDetailsScreen] Подключаем real-time обновления откликов');

    const applicantsSubscription = supabase
      .channel('applicants_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applicants',
          filter: `order_id=eq.${orderId}`
        },
        (payload: any) => {
          console.log('[OrderDetailsScreen] Real-time изменение откликов:', payload);
          loadApplicantsData();
        }
      )
      .subscribe();

    return () => {
      console.log('[OrderDetailsScreen] Отключаем real-time обновления откликов');
      applicantsSubscription.unsubscribe();
    };
  }, [orderId, loadApplicantsData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${dateStr} ${t('at_time')} ${timeStr}`;
  };

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('ru-RU');
  };

  const getApplicantStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getApplicantStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return t('status_pending');
      case 'accepted': return t('status_accepted');
      case 'rejected': return t('status_rejected');
      default: return t('status_unknown');
    }
  };

  const handleEditOrder = () => {
    if (!order) return;

    // Проверяем, что заказ принадлежит текущему пользователю
    if (!isMyOrder) {
      Alert.alert(
        tError('error'),
        t('cannot_edit_other_user_order')
      );
      return;
    }

    // Проверяем, что заказ можно редактировать
    if (!['new', 'response_received'].includes(order.status)) {
      Alert.alert(
        t('cannot_edit'),
        t('edit_restriction')
      );
      return;
    }

    // Переходим на экран редактирования заказа
    navigation.navigate('EditOrder', { orderId: order.id });
  };

  const handleCancelOrder = () => {
    if (!order) return;

    // Проверяем, что заказ принадлежит текущему пользователю
    if (!isMyOrder) {
      Alert.alert(
        tError('error'),
        t('cannot_cancel_other_user_order')
      );
      return;
    }

    // Проверяем, что заказ можно отменить
    if (!['new', 'response_received'].includes(order.status)) {
      Alert.alert(
        t('cannot_cancel'),
        t('cancel_restriction')
      );
      return;
    }

    Alert.alert(
      t('cancel_order'),
      t('cancel_confirmation'),
      [
        { text: tCommon('back'), style: 'cancel' },
        {
          text: t('cancel_order_button'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await orderService.cancelOrder(order.id);

              if (result.success) {
                Alert.alert(
                  t('order_cancelled'),
                  t('order_cancelled_success'),
                  [{ text: tCommon('ok'), onPress: () => navigation.navigate('MainTabs' as any) }]
                );
              } else {
                Alert.alert(tError('error'), result.error || t('cancel_order_error'));
              }
            } catch (error) {
              console.error('Ошибка отмены заказа:', error);
              Alert.alert(tError('error'), t('cancel_order_general_error'));
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRepeatOrder = () => {
    if (!order) return;

    Alert.alert(
      t('repeat_order'),
      t('repeat_order_description'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: t('repeat_order'),
          onPress: () => {
            // Создаем объект с данными заказа для повторения
            const orderData = {
              title: order.title,
              description: order.description,
              category: order.category || 'other',
              location: order.location,
              latitude: order.latitude,
              longitude: order.longitude,
              budget: order.budget,
              workersNeeded: order.workersNeeded,
              photos: order.photos || [],
              transportPaid: order.transportPaid,
              mealIncluded: order.mealIncluded,
              mealPaid: order.mealPaid,
            };

            // Переходим на экран создания заказа с предзаполненными данными
            navigation.navigate('MainTabs', {
              screen: 'CreateOrder',
              params: {
                repeatOrderData: orderData,
                startFromDateStep: true
              }
            });
          }
        }
      ]
    );
  };

  // Показать модалку подтверждения выбора исполнителя
  const handleSelectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setShowConfirmModal(true);
  };

  // Подтвердить выбор исполнителя
  const handleConfirmSelection = async () => {
    if (!selectedApplicant || !order || isProcessing) return;

    setIsProcessing(true);

    try {
      // Принимаем выбранного исполнителя
      const success = await orderService.updateApplicantStatus(selectedApplicant.id, 'accepted');
      if (!success) {
        Alert.alert(tError('error'), t('accept_applicant_error'));
        setIsProcessing(false);
        setShowConfirmModal(false);
        setSelectedApplicant(null);
        return;
      }

      // Небольшая задержка для обеспечения обновления в БД
      await new Promise(resolve => setTimeout(resolve, 500));

      // Обновляем список откликов
      const updatedApplicants = await orderService.getApplicantsForOrder(orderId);
      setApplicants(updatedApplicants);

      // Обновляем список принятых исполнителей
      const newAcceptedApplicants = new Set(
        updatedApplicants
          .filter(applicant => applicant.status === 'accepted')
          .map(applicant => applicant.id)
      );
      setAcceptedApplicants(newAcceptedApplicants);

      // Проверяем, достигнуто ли нужное количество исполнителей
      if (newAcceptedApplicants.size >= order.workersNeeded) {
        // Автоматически отклоняем остальных
        const rejectionPromises = updatedApplicants
          .filter(applicant =>
            applicant.status === 'pending' &&
            !newAcceptedApplicants.has(applicant.id)
          )
          .map(applicant => orderService.updateApplicantStatus(applicant.id, 'rejected'));

        if (rejectionPromises.length > 0) {
          await Promise.all(rejectionPromises);

          // Обновляем список откликов еще раз после отклонения
          const finalUpdatedApplicants = await orderService.getApplicantsForOrder(orderId);
          setApplicants(finalUpdatedApplicants);

          // Обновляем список принятых исполнителей
          const finalAcceptedApplicants = new Set(
            finalUpdatedApplicants
              .filter(applicant => applicant.status === 'accepted')
              .map(applicant => applicant.id)
          );
          setAcceptedApplicants(finalAcceptedApplicants);
        }

        // Проверяем и обновляем статус заказа при достижении нужного количества исполнителей
        await orderService.checkAndUpdateOrderStatus(orderId);
      }

      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedApplicant(null);

      // Показываем сообщение об успехе
      Alert.alert(tCommon('success'), t('applicant_selected_success', { name: selectedApplicant.workerName }));

    } catch (error) {
      console.error('Ошибка принятия отклика:', error);
      Alert.alert(tError('error'), t('accept_applicant_general_error'));
      setIsProcessing(false);
      setShowConfirmModal(false);
      setSelectedApplicant(null);
    }
  };

  // Завершить заказ
  const handleCallWorker = async (workerPhone: string, workerName: string, workerId: string) => {
    console.log('[OrderDetailsScreen] 🔍 handleCallWorker вызван:', {
      workerPhone,
      workerName,
      workerId,
      orderId: order?.id,
      currentUserId: currentUser?.id
    });

    Alert.alert(
      t('call_worker'),
      t('call_worker_confirmation', { name: workerName, phone: workerPhone }),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: t('call'),
          onPress: async () => {
            try {
              console.log('[OrderDetailsScreen] 📞 Пользователь подтвердил звонок');

              // Логируем попытку звонка перед открытием диалера
              if (order && currentUser) {
                console.log('[OrderDetailsScreen] 📝 Отправляем данные для логирования:', {
                  orderId: order.id,
                  callerId: currentUser.id,
                  receiverId: workerId,
                  callerType: 'customer',
                  receiverType: 'worker',
                  phoneNumber: workerPhone,
                  callSource: 'order_details'
                });

                await orderService.logCallAttempt({
                  orderId: order.id,
                  callerId: currentUser.id,
                  receiverId: workerId,
                  callerType: 'customer',
                  receiverType: 'worker',
                  phoneNumber: workerPhone,
                  callSource: 'order_details'
                });
                console.log('[OrderDetailsScreen] ✅ Звонок успешно залогирован');
              } else {
                console.warn('[OrderDetailsScreen] ⚠️ Не удалось залогировать звонок - отсутствуют данные:', {
                  hasOrder: !!order,
                  hasCurrentUser: !!currentUser
                });
              }

              // Открываем диалер
              Linking.openURL(`tel:${workerPhone}`);
            } catch (error) {
              console.error('[OrderDetailsScreen] ❌ Ошибка логирования звонка:', error);
              // Все равно открываем диалер, даже если логирование не удалось
              Linking.openURL(`tel:${workerPhone}`);
            }
          }
        }
      ]
    );
  };

  // Создаем элементы выпадающего меню
  const getDropdownMenuItems = (): DropdownMenuItem[] => {
    if (!order) return [];

    const items: DropdownMenuItem[] = [];

    // Показываем кнопки редактирования и отмены только для СВОИХ заказов со статусом 'new' или 'response_received'
    if (isMyOrder && ['new', 'response_received'].includes(order.status)) {
      items.push({
        id: 'edit',
        title: t('edit'),
        onPress: handleEditOrder,
      });

      items.push({
        id: 'cancel',
        title: tCommon('cancel'),
        color: '#DC2626',
        onPress: handleCancelOrder,
      });
    }

    return items;
  };

  const handleCompleteOrder = async () => {
    if (!order || isCompletingOrder) return;

    // Проверяем, что заказ принадлежит текущему пользователю
    if (!isMyOrder) {
      Alert.alert(
        tError('error'),
        t('cannot_complete_other_user_order')
      );
      return;
    }

    Alert.alert(
      t('complete_order'),
      t('complete_confirmation'),
      [
        { text: tCommon('cancel'), style: 'cancel' },
        {
          text: t('complete'),
          style: 'destructive',
          onPress: async () => {
            setIsCompletingOrder(true);
            try {
              // Получаем принятых исполнителей
              const acceptedWorkers = await orderService.getAcceptedWorkersForOrder(orderId);

              // Завершаем заказ
              const success = await orderService.completeOrder(orderId);
              if (!success) {
                Alert.alert(tError('error'), t('complete_order_error'));
                return;
              }

              // Обновляем статус заказа локально
              setOrder(prev => prev ? { ...prev, status: 'completed' } : null);

              // Если есть принятые исполнители, переходим к оценке
              if (acceptedWorkers.length > 0) {
                // Передаем всех принятых исполнителей для оценки
                navigation.navigate('Rating', {
                  orderId: orderId,
                  acceptedWorkers: acceptedWorkers,
                });
              } else {
                // Если нет исполнителей, просто показываем сообщение
                Alert.alert(
                  t('order_completed'),
                  t('order_completed_success'),
                  [{
                    text: tCommon('ok'),
                    onPress: () => {
                      // Сбрасываем стек навигации, чтобы нельзя было вернуться назад
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'MainTabs' as any }],
                      });
                    }
                  }]
                );
              }
            } catch (error) {
              console.error('Ошибка завершения заказа:', error);
              Alert.alert(tError('error'), t('complete_order_general_error'));
            } finally {
              setIsCompletingOrder(false);
            }
          }
        }
      ]
    );
  };

  const renderApplicant = ({ item }: { item: Applicant }) => {
    const formatAppliedAt = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return t('minutes_ago_short', { count: diffMins });
      } else if (diffHours < 24) {
        return t('hours_ago_short', { count: diffHours });
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return t('days_ago_short', { count: diffDays });
      }
    };

    const formatPrice = (price: number) => {
      return price.toLocaleString('ru-RU');
    };

    const isAccepted = item.status === 'accepted';
    const isRejected = item.status === 'rejected';
    const isPending = item.status === 'pending';

    // Инициализируем анимацию для карточки если её еще нет
    if (!animatedCards[item.id]) {
      animatedCards[item.id] = new Animated.Value(0);
      // Запускаем анимацию появления
      Animated.timing(animatedCards[item.id], {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }

    const animatedStyle = {
      opacity: animatedCards[item.id],
      transform: [
        {
          translateY: animatedCards[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
        {
          scale: animatedCards[item.id].interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[
        styles.modernApplicantCard,
        isAccepted && styles.modernAcceptedCard,
        isRejected && styles.modernRejectedCard,
        animatedStyle
      ]}>
        {/* Градиентная полоса статуса - только для отклоненных */}
        {isRejected && <View style={styles.modernStatusBarRejected} />}

        {/* Основное содержимое */}
        <View style={styles.modernCardContent}>
          {/* Заголовок с аватаром */}
          <View style={styles.modernApplicantHeader}>
            {/* Аватар исполнителя */}
            <View style={styles.modernAvatarContainer}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.modernAvatar} />
              ) : (
                <View style={styles.modernAvatarPlaceholder}>
                  <NoImagePlaceholder width={48} height={48} />
                </View>
              )}
              {/* Рейтинг бейдж на аватаре */}
              <View style={styles.modernRatingBadge}>
                <Text style={styles.modernRatingText}>
                  {item.rating ? item.rating.toFixed(1) : '—'}
                </Text>
              </View>
            </View>

            {/* Информация исполнителя */}
            <View style={styles.modernApplicantInfo}>
              <View style={styles.modernNameRow}>
                <View style={styles.nameWithBadge}>
                  <Text style={[styles.modernApplicantName, isRejected && styles.rejectedText]} numberOfLines={1} ellipsizeMode="tail">
                    {item.workerName}
                  </Text>
                  {isAccepted && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedIcon}>✓</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modernNameActions}>
                  <TouchableOpacity
                    style={styles.reviewsButton}
                    onPress={() => navigation.navigate('ProfessionalMasterProfile', {
                      masterId: item.workerId
                    })}
                  >
                    <View style={styles.reviewsButtonContent}>
                      <StarIcon filled={true} size={14} color="#FDB022" />
                      <Text style={styles.reviewsButtonText}>{t('reviews')}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Цена отклика и время в одном ряду */}
              <View style={styles.modernPriceAndTimeRow}>
                {/* Цена отклика */}
                {item.proposedPrice && (
                  <View style={styles.modernPriceUnderName}>
                    <Text style={[styles.modernPriceUnderNameValue, isAccepted && styles.modernPriceValueAccepted, isRejected && styles.rejectedText]}>
                      {formatPrice(item.proposedPrice)} сум
                    </Text>
                    {order && item.proposedPrice !== order.budget && (
                      <View style={[
                        styles.modernPriceDiffBadgeInline,
                        { backgroundColor: item.proposedPrice > order.budget ? '#FFE6E6' : '#E6F7F6' }
                      ]}>
                        <Text style={[
                          styles.modernPriceDiffTextInline,
                          { color: item.proposedPrice > order.budget ? '#FF4444' : '#4ECDC4' }
                        ]}>
                          {item.proposedPrice > order.budget ? '+' : ''}{formatPrice(item.proposedPrice - order.budget)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Время отклика */}
                <View style={styles.modernTimeRow}>
                  <Text style={styles.modernStatIcon}>🕒</Text>
                  <Text style={[styles.modernStatText, isRejected && styles.rejectedText]}>
                    {formatAppliedAt(item.appliedAt)}
                  </Text>
                </View>
              </View>
            </View>

          </View>


          {/* Комментарий исполнителя */}
          {item.message && item.message.trim() && (
            <View style={styles.modernMessageContainer}>
              <Text style={[styles.modernMessageLabel, isRejected && styles.rejectedText]}>
                {t('comment')}
              </Text>
              <Text style={[styles.modernMessageText, isRejected && styles.rejectedText]}>
                {item.message}
              </Text>
            </View>
          )}

          {/* Контактная информация для принятого исполнителя */}
          {isAccepted && item.workerPhone && (
            <View style={styles.modernContactInfo}>
              <View style={styles.modernContactHeader}>
                <Text style={styles.modernContactLabel}>{t('contacts')}</Text>
              </View>
              <View style={styles.modernContactRow}>
                <Text style={styles.modernPhoneNumber}>{item.workerPhone}</Text>
                <TouchableOpacity
                  style={styles.modernCallButton}
                  onPress={() => handleCallWorker(item.workerPhone, item.workerName, item.workerId)}
                >
                  <Text style={styles.modernCallButtonText}>{t('call')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Кнопки действий - показываем только для pending заявок */}
          {isPending && (
            <View style={styles.modernApplicantActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modernAcceptButton,
                  {
                    opacity: pressed ? 0.8 : 1,
                    transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
                  }
                ]}
                onPress={() => handleSelectApplicant(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
              >
                <Text style={styles.modernAcceptButtonText}>{t('accept_worker')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Состояния загрузки и ошибок
  if (isLoading) {
    return <OrderDetailsSkeleton />;
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <HeaderWithBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('order_not_found')}</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>{t('back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <Animated.View style={[styles.stickyHeader, {
        paddingTop: STATUS_BAR_HEIGHT + theme.spacing.lg,
        opacity: scrollY.interpolate({
          inputRange: [0, HEADER_HEIGHT],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        }),
      }]}>
        <View style={styles.stickyHeaderContent}>
          <TouchableOpacity style={styles.stickyBackButton} onPress={() => navigation.goBack()}>
            <ArrowBackIcon width={20} height={20} stroke={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.stickyTitleContainer}>
            <Text style={styles.stickyTitle} numberOfLines={1}>
              {order?.title || 'Загрузка...'}
            </Text>
            <Text style={styles.stickyPrice}>
              {order ? formatBudget(order.budget) + ' ' + t('sum_currency') : ''}
            </Text>
          </View>
          <View style={styles.stickyRightContainer}>
            {canShowCompleteButton(order) ? (
              <TouchableOpacity
                style={styles.stickyCompleteButton}
                onPress={handleCompleteOrder}
                activeOpacity={0.8}
              >
                <Text style={styles.stickyCompleteButtonText}>
                  {isCompletingOrder ? t('completing') : t('complete')}
                </Text>
              </TouchableOpacity>
            ) : getDropdownMenuItems().length > 0 ? (
              <DropdownMenu
                items={getDropdownMenuItems()}
              />
            ) : null}
          </View>
        </View>
      </Animated.View>

      <View style={styles.contentContainer}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          scrollEnabled={true} // Включаем scroll обратно
        >
          {/* Regular Header */}
          <HeaderWithBack
            rightComponent={
              <View style={styles.headerRightContainer}>
                {/* Кнопка "Повторить заказ" видна только для своих заказов */}
                {isMyOrder && (
                  <TouchableOpacity
                    style={styles.repeatButton}
                    onPress={handleRepeatOrder}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.repeatButtonText}>
                      {t('repeat_order')}
                    </Text>
                  </TouchableOpacity>
                )}

                {canShowCompleteButton(order) && (
                  <TouchableOpacity
                    style={[
                      styles.completeButton,
                      { backgroundColor: '#DC2626' }
                    ]}
                    onPress={handleCompleteOrder}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.completeButtonText}>
                      {isCompletingOrder ? t('completing') : t('complete')}
                    </Text>
                  </TouchableOpacity>
                )}
                {!canShowCompleteButton(order) && getDropdownMenuItems().length > 0 && (
                  <DropdownMenu
                    items={getDropdownMenuItems()}
                  />
                )}
              </View>
            }
          />



          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                {orderCustomer?.profileImage ? (
                  <Image source={{ uri: orderCustomer.profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <NoImagePlaceholder width={48} height={48} />
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {orderCustomer ? `${orderCustomer.lastName} ${orderCustomer.firstName}` : t('user')}
                </Text>
                <Text style={styles.profileRole}>{t('customer')}</Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.orderPrice}>{formatBudget(order.budget)} {t('sum_currency')}</Text>
                <View style={styles.statusContainer}>
                  <StatusBadge status={order.status} workerView={false} />
                </View>
              </View>
            </View>
          </View>

          {/* Order Title */}
          <View style={styles.titleSection}>
            <Text style={styles.orderTitle}>{order.title}</Text>
            
            {/* НОВОЕ: Индикатор контекста для исполнителей */}
            {isWorker && isMyOrder && (
              <View style={styles.contextBadgeContainer}>
                <View style={styles.contextBadge}>
                  <Text style={styles.contextBadgeText}>
                    💼 {tWorker('viewing_as_customer')}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Отклики - перемещен после названия заказа */}
          {isMyOrder && applicants.length > 0 ? (
            <View style={styles.applicantsSection}>
              <View style={styles.applicantsHeader}>
                <Text style={styles.applicantsTitle}>{t('applicants_count', { count: applicants.length })}</Text>
                {order?.workersNeeded && (
                  <View style={styles.progressInfo}>
                    <Text style={styles.applicantsSubtitle}>
                      {t('selected_workers', { selected: acceptedApplicants.size, needed: order.workersNeeded, ending: order.workersNeeded === 1 ? t('worker_ending_single') : t('worker_ending_multiple') })}
                    </Text>
                    <View style={styles.progressBarSmall}>
                      <View
                        style={[
                          styles.progressFillSmall,
                          { width: `${Math.min((acceptedApplicants.size / order.workersNeeded) * 100, 100)}%` }
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Полный список откликов с возможностью принятия */}
              <FlatList
                data={applicants}
                renderItem={renderApplicant}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : isMyOrder && applicants.length === 0 ? (
            /* Если откликов нет - показываем только для своих заказов */
            <View style={styles.noApplicantsSection}>
              <SvgXml xml={emptyStateNoApplicationsSvg} style={styles.noApplicantsIcon} />
              <Text style={styles.noApplicantsTitle}>{t('no_applicants_title')}</Text>
              <Text style={styles.noApplicantsText}>
                {t('no_applicants_text')}
              </Text>
            </View>
          ) : null}

          {/* Image Gallery */}
          {order.photos && order.photos.length > 0 && (
            <View style={styles.gallerySection}>
              <ImageGallery photos={order.photos} />
            </View>
          )}

          {/* Info Grid */}
          <View style={styles.infoSection}>
            <View style={styles.infoGrid}>
              {/* Верхний ряд: Специализация/Категория и Дата */}
              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  {order.specializationId ? (
                    <CategoryIconComponent
                      icon={getSpecializationIcon(order.specializationId)}
                      iconComponent={getSpecializationIconComponent(order.specializationId)}
                      size={22}
                    />
                  ) : (
                    <LottieView
                      source={getCategoryAnimation(order.category || 'other')}
                      style={styles.categoryLottieIcon}
                      autoPlay={false}
                      loop={false}
                      progress={0.5}
                    />
                  )}
                </View>
                <Text style={styles.infoValue}>
                  {order.specializationId 
                    ? getTranslatedSpecializationName(order.specializationId, translate)
                    : getCategoryLabel(order.category || 'other', translate)}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIcon}>
                  <CalendarIcon width={22} height={22} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{formatDate(order.serviceDate)}</Text>
              </View>

              {/* Нижний ряд: Адрес на всю ширину */}
              <View style={styles.infoCardFullWidth}>
                <View style={styles.infoIcon}>
                  <LocationIcon width={22} height={22} color="#679B00" />
                </View>
                <Text style={styles.infoValue}>{order.location}</Text>
              </View>
            </View>
          </View>


          {/* Amenities Section */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionTitle}>{t('amenities')}</Text>
            <View style={styles.amenitiesContainer}>
              <View style={styles.amenityItem}>
                <View style={styles.amenityIconContainer}>
                  <CarIcon width={20} height={20} color={order.transportPaid ? theme.colors.primary : theme.colors.text.secondary} />
                </View>
                <Text style={order.transportPaid ? styles.amenityText : styles.amenityTextNegative}>
                  {order.transportPaid ? t('transport_paid_yes') : t('transport_paid_no')}
                </Text>
              </View>

              <View style={styles.amenityItem}>
                <View style={styles.amenityIconContainer}>
                  <BankNoteIcon width={20} height={20} color={order.mealIncluded || order.mealPaid ? theme.colors.primary : theme.colors.text.secondary} />
                </View>
                <Text style={order.mealIncluded || order.mealPaid ? styles.amenityText : styles.amenityTextNegative}>
                  {order.mealIncluded ? t('meal_included_yes') :
                    order.mealPaid ? t('meal_paid_yes') :
                      t('meal_included_no')}
                </Text>
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>{t('details')}</Text>
            <Text style={styles.detailsText}>{order.description}</Text>
          </View>

          {/* Location Map Section */}
          {order.latitude && order.longitude && (
            <OrderLocationMap
              latitude={order.latitude}
              longitude={order.longitude}
              address={order.location}
              title={t('where_to_go')}
            />
          )}
        </Animated.ScrollView>

      </View>



      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Text style={styles.confirmModalIcon}>👤</Text>
              <Text style={styles.confirmModalTitle}>
                {t('confirm_selection', { name: selectedApplicant?.workerName })}
              </Text>
              <Text style={styles.confirmModalSubtitle}>
                {t('confirm_selection_subtitle')}
              </Text>
            </View>

            <View style={styles.confirmModalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.confirmButton,
                  isProcessing && styles.confirmButtonDisabled,
                  {
                    opacity: pressed && !isProcessing ? 0.8 : 1,
                    backgroundColor: pressed && !isProcessing ? theme.colors.primary + 'CC' : theme.colors.primary
                  }
                ]}
                onPress={handleConfirmSelection}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonText}>
                  {isProcessing ? t('processing') : t('confirm')}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  { opacity: pressed && !isProcessing ? 0.7 : 1 }
                ]}
                onPress={() => setShowConfirmModal(false)}
                disabled={isProcessing}
              >
                <Text style={[styles.modalCancelButtonText, isProcessing && styles.cancelButtonTextDisabled]}>
                  {tCommon('cancel')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  errorButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
  },
  statusContainer: {
    marginTop: theme.spacing.xs,
    alignItems: 'flex-end',
  },

  // Title Section
  titleSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  orderTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: 32,
    marginBottom: theme.spacing.md,
  },


  // Gallery Section
  gallerySection: {
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  galleryContainer: {
    position: 'relative',
  },
  photoContainer: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaImageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  mediaTouch: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  navButtonLeft: {
    left: theme.spacing.xl,
  },
  navButtonRight: {
    right: theme.spacing.xl,
  },
  navButtonText: {
    fontSize: 24,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.bold,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: theme.spacing.md,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md, // Одинаковые отступы между карточками
  },
  infoCard: {
    flex: 1, // Используем flex для равномерного распределения
    backgroundColor: '#F6F7F9',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  infoCardFullWidth: {
    flexBasis: '100%', // Карточка на всю ширину
    backgroundColor: '#F6F7F9',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  categoryLottieIcon: {
    width: 22,
    height: 22,
  },
  specializationEmoji: {
    fontSize: 22,
  },
  iconText: {
    fontSize: 16,
  },


  infoValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },

  // Details Section
  detailsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  detailsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailsText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },

  // Applicants Section
  applicantsSection: {
    backgroundColor: '#F6F7F9',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  applicantsHeader: {
    flexDirection: 'column',
    marginBottom: theme.spacing.md,
  },
  applicantsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicantsSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  viewAllText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantPreview: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  applicantPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  applicantPreviewName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  applicantPreviewRating: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantPreviewPrice: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  manageButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  manageButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  closeButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantsList: {
    padding: theme.spacing.lg,
  },
  // Старые стили откликов (сохраняем для обратной совместимости)
  applicantCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 0, borderColor: theme.colors.border,
    position: 'relative',
    paddingTop: theme.spacing.xl,
  },

  // Новые современные стили для откликов
  modernApplicantCard: {
    backgroundColor: '#F6F7F9',
    borderRadius: 16,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
    elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, borderWidth: 2, borderColor: '#679B00',
  },
  modernAcceptedCard: {
    borderColor: '#679B00', borderWidth: 2, backgroundColor: '#F6F7F9',
  },
  modernRejectedCard: {
    opacity: 0.7,
    backgroundColor: '#F6F7F9',
    borderColor: '#679B00', borderWidth: 2,
  },
  modernStatusBarAccepted: {
    height: 4,
    backgroundColor: '#679B00', // fallback для устройств без градиентов
  },
  modernStatusBarRejected: {
    height: 4,
    backgroundColor: '#FF6B6B', // fallback
  },

  modernCardContent: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 8,
    paddingRight: 8,
    minHeight: 140,
  },
  modernApplicantHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modernAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  modernAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
  },
  modernAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernRatingBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#679B00',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    borderWidth: 0, borderColor: 'transparent',
  },
  modernRatingText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernApplicantInfo: {
    flex: 1,
    marginRight: 8,
  },
  modernNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  modernApplicantName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 24,
    flexShrink: 1,
    marginRight: 8,
  },
  modernSelectedBadge: {
    backgroundColor: '#679B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexShrink: 0,
  },
  modernSelectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modernStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  modernStatIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  modernStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  modernTimeContainer: {
    alignItems: 'flex-end',
  },
  modernTimeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  modernPendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFA726',
  },
  modernPriceContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0, borderColor: 'transparent',
  },
  modernPriceContainerAccepted: {
    backgroundColor: '#F0FDFA',
    borderColor: 'transparent',
  },
  modernPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modernPriceLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernPriceDiffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modernPriceDiffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modernPriceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  modernPriceValueAccepted: {
    color: '#679B00',
  },
  modernPriceUnderName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modernPriceUnderNameValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 8,
  },
  modernPriceDiffBadgeInline: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modernPriceDiffTextInline: {
    fontSize: 10,
    fontWeight: '600',
  },
  modernMessageContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#679B00',
  },
  modernMessageLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernMessageText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontWeight: '400',
  },
  modernContactInfo: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0, borderColor: 'transparent',
  },
  modernContactHeader: {
    marginBottom: 12,
  },
  modernContactLabel: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernPhoneNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  modernCallButton: {
    backgroundColor: '#679B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0,
  },
  modernCallButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modernApplicantActions: {
    marginTop: 4,
  },
  modernAcceptButton: {
    backgroundColor: '#679B00',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0,
  },
  modernAcceptButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },

  // Стили для превью откликов
  modernApplicantPreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0,
    borderWidth: 2,
    borderColor: '#F6F7F9',
    paddingLeft: 16,
  },
  modernPreviewAccepted: {
    borderColor: '#F6F7F9',
    backgroundColor: '#FAFFFE',
  },
  modernPreviewRejected: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
    borderColor: '#F6F7F9',
  },

  modernPreviewContent: {
    padding: 0,
    minHeight: 100,
    justifyContent: 'center',
  },
  modernPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modernPreviewAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  modernPreviewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
  },
  modernPreviewAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernPreviewRatingMini: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#679B00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 24,
    alignItems: 'center',
    borderWidth: 0, borderColor: 'transparent',
  },
  modernPreviewRatingMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernPreviewInfo: {
    flex: 1,
    marginRight: 8,
    justifyContent: 'center',
  },
  modernPreviewNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  modernPreviewPriceRow: {
    marginBottom: 6,
  },
  modernPreviewName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 22,
    flex: 1,
    marginRight: 6,
  },
  modernPreviewSelectedBadge: {
    backgroundColor: '#679B00',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  modernPreviewSelectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },

  modernPreviewPriceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 'auto',
    paddingLeft: 0,
    minWidth: 100,
  },
  modernPreviewPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#679B00',
    textAlign: 'left',
  },

  applicantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  applicantStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantRating: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  applicantJobs: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  applicantTime: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md, // Увеличен размер как у кнопки "Создать новый заказ"
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 0, borderColor: theme.colors.border,
  },
  rejectButtonText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  proposedPriceContainer: {
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  proposedPriceLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: theme.fonts.weights.medium,
  },
  proposedPriceValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semiBold,
  },
  priceDifference: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  messageContainer: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  messageLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: theme.fonts.weights.medium,
  },
  messageText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },

  // Стили для статусов карточек
  acceptedCard: {
    borderWidth: 0, borderColor: 'transparent', backgroundColor: '#f0fffe',
  },
  rejectedCard: {
    backgroundColor: '#f8f9fa',
    opacity: 0.7,
  },
  statusBar: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    backgroundColor: '#679B00',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderTopLeftRadius: theme.borderRadius.lg - 1,
    borderTopRightRadius: theme.borderRadius.lg - 1,
    zIndex: 10,
  },
  statusBarRejected: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderTopLeftRadius: theme.borderRadius.lg - 1,
    borderTopRightRadius: theme.borderRadius.lg - 1,
    zIndex: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: theme.spacing.xs,
  },
  statusIconRejected: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: theme.spacing.xs,
  },
  statusText: {
    color: 'white',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
  statusTextRejected: {
    color: 'white',
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semiBold,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  selectedBadge: {
    backgroundColor: '#679B00',
    color: 'white',
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
    overflow: 'hidden',
  },
  rejectedText: {
    color: '#9ca3af',
  },
  acceptedPrice: {
    color: '#679B00',
    fontWeight: theme.fonts.weights.bold,
  },

  // Дополнительные стили для кнопок и бейджей
  nameWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#679B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  verifiedIcon: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernNameActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  reviewsButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0,
    borderColor: 'transparent',
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#679B00',
  },
  modernTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  modernPriceAndTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 8,
  },


  // Стили для модалки подтверждения
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Увеличил прозрачность для лучшей видимости
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    zIndex: 9999, // Максимальный z-index
  },
  confirmModalContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 350,
    elevation: 0, shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0,
  },
  confirmModalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  confirmModalIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  confirmModalTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  confirmModalSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmModalActions: {
    gap: theme.spacing.md,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  confirmButtonDisabled: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.7,
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 0, borderColor: 'transparent',
  },
  modalCancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  cancelButtonTextDisabled: {
    color: '#d1d5db',
  },


  applicantPreviewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  applicantPreviewJobs: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  applicantPreviewStatus: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: 'auto',
  },
  applicantPreviewStatusText: {
    fontSize: theme.fonts.sizes.xs,
    color: '#fff',
    fontWeight: theme.fonts.weights.medium,
  },
  viewAllApplicantsButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  viewAllApplicantsButtonText: {
    color: '#fff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
  },
  noApplicantsSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  noApplicantsIcon: {
    width: 80,
    height: 80,
    marginBottom: theme.spacing.lg,
  },
  noApplicantsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  noApplicantsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressInfo: {
    marginTop: theme.spacing.xs,
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: theme.spacing.xs,
    borderWidth: 0, borderColor: theme.colors.border,
  },
  progressFillSmall: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },

  // Новые стили для фиксированной кнопки
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.lg, // Обычный отступ снизу
  },
  fixedBottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    // paddingTop и paddingBottom устанавливаются через getImprovedFixedBottomStyle
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Убираем только тени, границу оставляем
    elevation: 0, shadowOpacity: 0,
  },
  fixedViewAllApplicantsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0, marginBottom: Platform.OS === 'ios' ? 16 : 0, // Отступ только на iOS
  },
  fixedViewAllApplicantsButtonText: {
    color: '#fff',
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    textAlign: 'center',
  },

  // Sticky Header Styles
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    minHeight: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.xl,
    color: theme.colors.text.primary,
  },
  // Новые стили для sticky header кнопок (идентичные HeaderWithBack)
  stickyBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },

  stickyCompleteButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  stickyCompleteButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#FFFFFF',
  },
  stickyRepeatButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
    marginRight: theme.spacing.sm,
  },
  stickyRepeatButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#FFFFFF',
  },
  stickyRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickyTitleContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  stickyTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  stickyPrice: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  rightActionText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: `${theme.colors.success}10`,
    borderRadius: theme.borderRadius.sm,
  },
  phoneNumber: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
    flex: 1,
  },
  callButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  callButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.surface,
  },
  completeButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  completeButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#FFFFFF',
  },
  repeatButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0,
  },
  repeatButtonText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: '#FFFFFF',
  },
  // Стили для header
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'visible',
  },

  // Amenities Section Styles
  amenitiesSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#F6F7F9',
  },
  amenitiesContainer: {
    gap: theme.spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  amenityIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  amenityIconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  amenityTextNegative: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  // НОВЫЕ СТИЛИ: Индикатор контекста для исполнителей
  contextBadgeContainer: {
    marginTop: theme.spacing.md,
  },
  contextBadge: {
    backgroundColor: `${theme.colors.primary}10`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  contextBadgeText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
}); 