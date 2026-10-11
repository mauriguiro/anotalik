"use client";

import React, { useState, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { 
  Folder, 
  Search, 
  Plus, 
  Link as LinkIcon, 
  MoreVertical,
  X,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Moon,
  Sun,
  Hash,
  HelpCircle,
  Copy,
  Star,
  Check,
  Globe,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Share2,
  Printer,
  Download,
  LogOut,
  AlertTriangle,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';

import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  updateEmail,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

// Mocks Iniciales
const INITIAL_CATEGORIES = [
  { id: '1', name: 'Trabajo', color: '#3b82f6', iconName: 'Briefcase', parentId: null },
  { id: '2', name: 'Personal', color: '#10b981', iconName: 'Home', parentId: null },
  { id: '3', name: 'Estudio', color: '#f59e0b', iconName: 'BookOpen', parentId: null },
  { id: '4', name: 'Viajes', color: '#ec4899', iconName: 'Plane', parentId: '2' },
  { id: '5', name: 'Auto', color: '#ef4444', iconName: 'Car', parentId: '2' },
];

const INITIAL_LINKS = [
  { 
    id: '1', 
    url: 'https://react.dev', 
    title: 'React Documentation', 
    description: 'Documentación oficial para repasar hooks.', 
    image: 'https://react.dev/images/og-home.png',
    categoryId: '3',
    tags: ['programacion', 'frontend']
  },
  { 
    id: '2', 
    url: 'https://tailwindcss.com', 
    title: 'Tailwind CSS', 
    description: 'Utility-first CSS framework.', 
    image: 'https://tailwindcss.com/api/og',
    categoryId: '1',
    tags: ['css', 'diseño']
  }
];

const AVAILABLE_ICONS = [
  // Trabajo, Oficina y Estudio
  'Briefcase', 'GraduationCap', 'BookOpen', 'Book', 'FileText', 'Folder', 'FolderArchive', 'Archive',
  'Clipboard', 'ClipboardList', 'Calendar', 'Clock', 'Laptop', 'Monitor', 'PenTool', 'Bookmark', 'Library', 'Award', 'Trophy',
  'Target', 'Lightbulb', 'Rocket', 'Crown', 'Gem', 'Package', 'Box',
  // Finanzas y Negocios
  'Banknote', 'CreditCard', 'Wallet', 'Coins', 'DollarSign', 'TrendingUp', 'BarChart2', 'PieChart', 'ShoppingCart', 'ShoppingBag', 'Tag', 'Receipt', 'Store', 'Percent',
  // Tecnología y Desarrollo
  'Code', 'Terminal', 'Cpu', 'Database', 'Server', 'Globe', 'Wifi', 'Smartphone', 'Tablet', 'Tv', 'Headphones', 'Key', 'Shield', 'Lock', 'Settings', 'Sliders', 'Wrench', 'Hammer', 'Scissors', 'Printer', 'Share2', 'Send',
  // Hogar, Personas y Comunicación
  'Home', 'Heart', 'Smile', 'Users', 'User', 'Gift', 'Bell', 'Mail', 'Inbox', 'MessageSquare', 'Phone', 'MapPin', 'Compass', 'Navigation', 'Map',
  // Transporte y Viajes
  'Plane', 'Car', 'Bus', 'Train', 'Bike', 'Truck', 'Fuel', 'Luggage', 'Anchor', 'Navigation2',
  // Clima y Naturaleza
  'Sun', 'Moon', 'Cloud', 'CloudRain', 'Umbrella', 'Wind', 'Thermometer', 'Trees', 'TreePine', 'Flower2', 'Leaf', 'Flame', 'Zap',
  // Entretenimiento y Arte
  'Music', 'Mic', 'Film', 'Video', 'Camera', 'Image', 'Palette', 'Brush', 'Gamepad2', 'Dices', 'Sparkles', 'Star', 'Glasses', 'Eye',
  // Comida y Bebidas
  'Coffee', 'Utensils', 'Pizza', 'Beer', 'Wine', 'Cake', 'Apple',
  // Salud y Deporte
  'Activity', 'Dumbbell', 'Stethoscope', 'Pill', 'Footprints', 'Flag', 'Link'
];

const AVAILABLE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', 
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', 
  '#ec4899', '#f43f5e', '#64748b'
];

const DynamicIcon = ({ name, size = 16, color }: { name: string, size?: number, color?: string }) => {
  const IconComponent = (LucideIcons as any)[name];
  if (!IconComponent) return <Folder size={size} color={color} />;
  return <IconComponent size={size} color={color} />;
};

export default function LinkNestApp() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
  const [categories, setCategories] = useState<any[]>(INITIAL_CATEGORIES);
  const [links, setLinks] = useState<any[]>(INITIAL_LINKS);
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCatOpen, setIsSidebarCatOpen] = useState(false);
  const [activeSidebarDropdown, setActiveSidebarDropdown] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [mainTab, setMainTab] = useState<'categories' | 'favorites' | 'report'>('categories');
  const [reportFilterCat, setReportFilterCat] = useState<string>('all');

  // User Profile Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userNewPassword, setUserNewPassword] = useState('');
  const [userProfileMsg, setUserProfileMsg] = useState('');
  const [userProfileError, setUserProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Logout Confirmation State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Nuevo Link State
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Modal Category State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [modalParentId, setModalParentId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(AVAILABLE_COLORS[0]);
  const [newCatIcon, setNewCatIcon] = useState(AVAILABLE_ICONS[0]);
  const [isManageCatsModalOpen, setIsManageCatsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catIconSearch, setCatIconSearch] = useState('');

  // Modal Link Edit State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editLinkTitle, setEditLinkTitle] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkDesc, setEditLinkDesc] = useState('');
  const [editLinkCat, setEditLinkCat] = useState<string | null>(null);
  const [editLinkTags, setEditLinkTags] = useState('');
  const [activeLinkDropdown, setActiveLinkDropdown] = useState<string | null>(null);
  const [isMoveLinkModalOpen, setIsMoveLinkModalOpen] = useState(false);
  const [isCatSelectorOpen, setIsCatSelectorOpen] = useState(false);
  const [modalExpandedCats, setModalExpandedCats] = useState<Record<string, boolean>>({});

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccessMessage, setAuthSuccessMessage] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Cargar datos de Firebase y estado de Auth
  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('anotalink_theme');
    const savedExpanded = localStorage.getItem('anotalink_expanded');
    if (savedExpanded) setExpandedCategories(JSON.parse(savedExpanded));
    
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserName(currentUser.displayName || '');
        setUserPhoto(currentUser.photoURL || '');
        setUserEmail(currentUser.email || '');
        try {
          const catsSnapshot = await getDocs(query(collection(db, 'categories'), where('userId', '==', currentUser.uid)));
          let userCats = catsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          const linksSnapshot = await getDocs(query(collection(db, 'links'), where('userId', '==', currentUser.uid)));
          let userLinks = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Seed mock data for new accounts
          if (userCats.length === 0 && userLinks.length === 0) {
            const batch = writeBatch(db);
            const catIdMap: Record<string, string> = {};
            
            for (const cat of INITIAL_CATEGORIES) {
              const docRef = doc(collection(db, 'categories'));
              catIdMap[cat.id] = docRef.id;
              const catData = { ...cat, userId: currentUser.uid, parentId: cat.parentId ? catIdMap[cat.parentId] : null };
              // @ts-expect-error delete
              delete catData.id;
              batch.set(docRef, catData);
              userCats.push({ ...catData, id: docRef.id });
            }
            
            for (const link of INITIAL_LINKS) {
              const docRef = doc(collection(db, 'links'));
              const linkData = { ...link, userId: currentUser.uid, categoryId: link.categoryId ? catIdMap[link.categoryId] : null };
              // @ts-expect-error delete
              delete linkData.id;
              batch.set(docRef, linkData);
              userLinks.push({ ...linkData, id: docRef.id });
            }
            
            await batch.commit();
          }
          
          setCategories(userCats);
          setLinks(userLinks);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        setCategories([]);
        setLinks([]);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Al cambiar de categoría o entrar a subcategorías, hacer scroll siempre al principio
  const contentContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, selectedSubCategory]);

  // Guardar estado visual expandido localmente
  useEffect(() => {
    if (isMounted && Object.keys(expandedCategories).length > 0) {
      localStorage.setItem('anotalink_expanded', JSON.stringify(expandedCategories));
    }
  }, [expandedCategories, isMounted]);

  // Toggle Dark Mode
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('anotalink_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('anotalink_theme', 'light');
    }
  };

  // Manejador de Web Share Target
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('url') || params.get('text');
      
      if (sharedUrl && sharedUrl.startsWith('http')) {
        setNewLinkUrl(sharedUrl);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (sharedUrl) {
        const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          setNewLinkUrl(urlMatch[0]);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleModalExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddCategoryModal = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCategoryId(null);
    setModalParentId(parentId);
    setNewCatName('');
    setCatIconSearch('');
    setNewCatColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
    setNewCatIcon(AVAILABLE_ICONS[Math.floor(Math.random() * AVAILABLE_ICONS.length)]);
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: any) => {
    setEditingCategoryId(cat.id);
    setModalParentId(cat.parentId);
    setNewCatName(cat.name);
    setCatIconSearch('');
    setNewCatColor(cat.color);
    setNewCatIcon(cat.iconName);
    setIsCatModalOpen(true);
  };

  const deleteCategory = async (id: string) => {
    // Check if it has subcategories
    if (categories.some(c => c.parentId === id)) {
      alert("No puedes eliminar una categoría que contiene subcategorías.");
      return;
    }
    
    await deleteDoc(doc(db, 'categories', id));
    setCategories(categories.filter(c => c.id !== id));
    
    // Update links
    const batch = writeBatch(db);
    let hasLinksToUpdate = false;
    const updatedLinks = links.map(l => {
      if (l.categoryId === id) {
        hasLinksToUpdate = true;
        batch.update(doc(db, 'links', l.id), { categoryId: null });
        return { ...l, categoryId: null };
      }
      return l;
    });
    if (hasLinksToUpdate) {
      await batch.commit();
      setLinks(updatedLinks);
    }
    
    if (activeCategory === id) {
      setActiveCategory(null);
      setSelectedSubCategory(null);
    }
    if (selectedSubCategory === id) {
      setSelectedSubCategory(null);
    }
  };

  const copyLinkToClipboard = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => {
      setCopiedLinkId(null);
    }, 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSavingProfile(true);
    setUserProfileMsg('');
    setUserProfileError('');

    try {
      // 1. Actualizar displayName y photoURL
      await updateProfile(auth.currentUser, {
        displayName: userName.trim() || null,
        photoURL: userPhoto.trim() || null
      });

      // 2. Si se cambió el correo y es distinto
      if (userEmail.trim() && userEmail.trim() !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, userEmail.trim());
      }

      // 3. Si se ingresó una nueva contraseña
      if (userNewPassword.trim()) {
        if (userNewPassword.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }
        await updatePassword(auth.currentUser, userNewPassword);
        setUserNewPassword('');
      }

      setUser({ ...auth.currentUser });
      setUserProfileMsg('¡Perfil actualizado con éxito!');
    } catch (err: any) {
      console.error('Error al actualizar perfil:', err);
      if (err.code === 'auth/requires-recent-login') {
        setUserProfileError('Por seguridad, para cambiar correo o contraseña debes haber iniciado sesión recientemente. Cierra sesión e ingresa de nuevo.');
      } else {
        setUserProfileError(err.message || 'Error al actualizar el perfil.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setUserProfileMsg(`Se ha enviado un correo a ${user.email} con las instrucciones para restablecer tu contraseña.`);
    } catch (err: any) {
      setUserProfileError(err.message || 'Error al enviar correo de restablecimiento.');
    }
  };

  const exportReportToCSV = () => {
    const headers = ['Categoría', 'Subcategoría', 'Título', 'URL', 'Descripción', 'Etiquetas', 'Favorito'];
    const rows: string[][] = [];

    const targetCats = reportFilterCat
      ? categories.filter(c => c.id === reportFilterCat || c.parentId === reportFilterCat)
      : categories;

    const rootCats = targetCats.filter(c => c.parentId === null);

    rootCats.forEach(cat => {
      // Directos
      const catDirectLinks = links.filter(l => l.categoryId === cat.id);
      catDirectLinks.forEach(link => {
        rows.push([
          cat.name,
          'General (Directo)',
          link.title || '',
          link.url || '',
          link.description || '',
          (link.tags || []).join('; '),
          link.isFavorite ? 'Sí' : 'No'
        ]);
      });

      // Subcategorías
      const subCats = targetCats.filter(c => c.parentId === cat.id);
      subCats.forEach(sub => {
        const subLinks = links.filter(l => l.categoryId === sub.id);
        subLinks.forEach(link => {
          rows.push([
            cat.name,
            sub.name,
            link.title || '',
            link.url || '',
            link.description || '',
            (link.tags || []).join('; '),
            link.isFavorite ? 'Sí' : 'No'
          ]);
        });
      });
    });

    // Sin Categoría si no hay filtro
    if (!reportFilterCat) {
      const uncategorizedLinks = links.filter(l => !l.categoryId || !categories.some(c => c.id === l.categoryId));
      uncategorizedLinks.forEach(link => {
        rows.push([
          'Sin Categoría',
          '-',
          link.title || '',
          link.url || '',
          link.description || '',
          (link.tags || []).join('; '),
          link.isFavorite ? 'Sí' : 'No'
        ]);
      });
    }

    const escapeCSV = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    const csvContent = '\uFEFF' + [
      headers.map(escapeCSV).join(';'),
      ...rows.map(row => row.map(escapeCSV).join(';'))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `anotalink_reporte_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportText = () => {
    let text = `📋 REPORTE DE ENLACES - ANOTALINK\n`;
    text += `Fecha: ${new Date().toLocaleDateString()}\n`;
    text += `Total categorías: ${categories.length} | Total enlaces: ${links.length}\n`;
    text += `===================================================\n\n`;

    const rootCats = reportFilterCat
      ? categories.filter(c => c.id === reportFilterCat)
      : categories.filter(c => c.parentId === null);

    rootCats.forEach(cat => {
      text += `📁 CATEGORÍA: ${cat.name.toUpperCase()}\n`;
      const direct = links.filter(l => l.categoryId === cat.id);
      if (direct.length > 0) {
        direct.forEach(l => {
          text += `  • ${l.title} ${l.isFavorite ? '⭐' : ''}\n    ${l.url}\n`;
          if (l.description) text += `    Notas: ${l.description}\n`;
        });
      }

      const subCats = categories.filter(c => c.parentId === cat.id);
      subCats.forEach(sub => {
        const sLinks = links.filter(l => l.categoryId === sub.id);
        text += `  📂 Subcategoría: ${sub.name} (${sLinks.length} enlaces)\n`;
        sLinks.forEach(l => {
          text += `    - ${l.title} ${l.isFavorite ? '⭐' : ''}\n      ${l.url}\n`;
          if (l.description) text += `      Notas: ${l.description}\n`;
        });
      });
      text += `\n`;
    });

    return text;
  };

  const copyReportToClipboard = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text);
    alert('¡Reporte copiado al portapapeles con éxito!');
  };

  const shareReport = async () => {
    const text = generateReportText();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Reporte AnotaLink',
          text: text,
        });
      } catch {
        // Cancelado
      }
    } else {
      copyReportToClipboard();
    }
  };

  const saveCategory = async () => {
    if (!newCatName.trim() || !user) return;
    
    if (editingCategoryId) {
      const catRef = doc(db, 'categories', editingCategoryId);
      const updatedData = {
        name: newCatName,
        color: newCatColor,
        iconName: newCatIcon,
        parentId: modalParentId
      };
      await updateDoc(catRef, updatedData);
      setCategories(categories.map(c => c.id === editingCategoryId ? { ...c, ...updatedData } : c));
    } else {
      const newCatData = {
        userId: user.uid,
        name: newCatName,
        color: newCatColor,
        iconName: newCatIcon,
        parentId: modalParentId
      };
      const docRef = await addDoc(collection(db, 'categories'), newCatData);
      setCategories([...categories, { id: docRef.id, ...newCatData }]);
      if (modalParentId) {
        setExpandedCategories(prev => ({ ...prev, [modalParentId]: true }));
      }
    }
    setIsCatModalOpen(false);
  };

  const saveNewLink = () => {
    if (!newLinkUrl.trim()) return;
    
    let url = newLinkUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Auto-rellenar modo creación
      setEditingLink(null);
      setEditLinkUrl(url);
      setEditLinkTitle(domain.charAt(0).toUpperCase() + domain.slice(1));
      setEditLinkDesc('');
      const defaultCat = (selectedSubCategory && selectedSubCategory !== '__parent_direct__') ? selectedSubCategory : activeCategory;
      setEditLinkCat(defaultCat);
      setEditLinkTags('');
      
      setIsLinkModalOpen(true);
      setNewLinkUrl('');
    } catch (e) {
      alert("Por favor ingresa una URL válida (ej: google.com)");
    }
  };

  const deleteLink = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas borrar este enlace?')) {
      await deleteDoc(doc(db, 'links', id));
      setLinks(links.filter(l => l.id !== id));
    }
  };

  const toggleFavoriteLink = async (link: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newFav = !link.isFavorite;
    setLinks(links.map(l => l.id === link.id ? { ...l, isFavorite: newFav } : l));
    try {
      await updateDoc(doc(db, 'links', link.id), { isFavorite: newFav });
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
    }
  };

  const openEditLinkModal = (link: any) => {
    setEditingLink(link);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
    setEditLinkDesc(link.description || '');
    setEditLinkCat(link.categoryId);
    setEditLinkTags((link.tags || []).join(', '));
    setIsLinkModalOpen(true);
  };

  const openMoveLinkModal = (link: any) => {
    setEditingLink(link);
    setEditLinkCat(link.categoryId);
    setIsMoveLinkModalOpen(true);
  };

  const saveMovedLink = async () => {
    if (editingLink && user) {
      const linkRef = doc(db, 'links', editingLink.id);
      await updateDoc(linkRef, { categoryId: editLinkCat });
      setLinks(links.map(l => l.id === editingLink.id ? { ...l, categoryId: editLinkCat } : l));
    }
    setIsMoveLinkModalOpen(false);
  };

  const saveEditedLink = async () => {
    if (!user) return;
    const tagsArray = editLinkTags.split(',').map(t => t.trim()).filter(t => t !== '');
    const finalCategoryId = editLinkCat;
    
    if (editingLink) {
      const linkRef = doc(db, 'links', editingLink.id);
      const updatedData = {
        title: editLinkTitle,
        url: editLinkUrl,
        description: editLinkDesc,
        categoryId: finalCategoryId,
        tags: tagsArray
      };
      await updateDoc(linkRef, updatedData);
      setLinks(links.map(l => l.id === editingLink.id ? { ...l, ...updatedData } : l));
    } else {
      let domain = '';
      try {
        domain = new URL(editLinkUrl).hostname.replace('www.', '');
      } catch {
        domain = editLinkUrl.split('/')[0];
      }
      
      const newLinkData = {
        userId: user.uid,
        url: editLinkUrl,
        title: editLinkTitle,
        description: editLinkDesc,
        image: `/api/thumbnail?url=${encodeURIComponent(editLinkUrl)}&v=2`,
        categoryId: finalCategoryId,
        tags: tagsArray
      };
      const docRef = await addDoc(collection(db, 'links'), newLinkData);
      setLinks([{ id: docRef.id, ...newLinkData }, ...links]);
    }
    
    setIsLinkModalOpen(false);
  };

  // Filtrado
  const filteredLinks = links.filter(link => {
    // 1. Filtrar por categoría / subcategoría activa
    if (activeCategory !== null) {
      if (selectedSubCategory === '__parent_direct__') {
        if (link.categoryId !== activeCategory) return false;
      } else if (selectedSubCategory !== null) {
        if (link.categoryId !== selectedSubCategory) return false;
      } else {
        const hasSubCats = categories.some(c => c.parentId === activeCategory);
        if (!hasSubCats && link.categoryId !== activeCategory) return false;
      }
    }
    
    // 2. Filtrar por búsqueda (Título, URL, Descripción, Etiquetas)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const inTitle = link.title && link.title.toLowerCase().includes(q);
      const inDesc = link.description && link.description.toLowerCase().includes(q);
      const inUrl = link.url && link.url.toLowerCase().includes(q);
      const inTags = link.tags && link.tags.some((t: string) => t.toLowerCase().includes(q));
      
      if (!inTitle && !inDesc && !inUrl && !inTags) return false;
    }
    
    return true;
  });

  const getRecursiveLinkCount = (catId: string): number => {
    let count = links.filter(l => l.categoryId === catId).length;
    const children = categories.filter(c => c.parentId === catId);
    for (const child of children) {
      count += getRecursiveLinkCount(child.id);
    }
    return count;
  };

  const getCategoryPath = (catId: string | null) => {
    if (!catId) return [];
    const path: any[] = [];
    let current = categories.find(c => c.id === catId);
    while (current) {
      path.unshift(current);
      current = current.parentId ? categories.find(c => c.id === current.parentId) : null;
    }
    return path;
  };

  const expandAllCategories = () => {
    const allExp: Record<string, boolean> = {};
    categories.forEach(c => { allExp[c.id] = true; });
    setExpandedCategories(allExp);
  };

  const collapseAllCategories = () => {
    setExpandedCategories({});
  };

  const renderLinkCard = (link: any) => {
    const category = categories.find(c => c.id === link.categoryId);
    const isCopied = copiedLinkId === link.id;

    return (
      <div 
        key={link.id} 
        className="bg-white dark:bg-gray-800/90 rounded-xl border border-gray-200/80 dark:border-gray-700/80 px-3 py-2 sm:px-3.5 sm:py-2.5 hover:shadow-sm hover:border-blue-400/80 dark:hover:border-blue-500/60 transition-all duration-150 group flex flex-col justify-between relative overflow-hidden backdrop-blur-xs"
      >
        {/* Indicador de categoría sutil superior */}
        {category && (
          <div 
            className="absolute top-0 left-0 right-0 h-0.5 opacity-80"
            style={{ backgroundColor: category.color }}
          />
        )}

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Favicon / Miniatura compacta */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-100 dark:bg-gray-700/60 rounded-lg relative overflow-hidden shrink-0 flex items-center justify-center border border-gray-200/50 dark:border-gray-700/50 shadow-2xs">
            {/* Fallback de fondo */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-0">
              {(() => {
                const lUrl = link.url.toLowerCase();
                if (lUrl.includes('youtube.') || lUrl.includes('youtu.be')) return <LucideIcons.Video size={16} className="text-red-500 opacity-70" />;
                if (lUrl.includes('instagram.')) return <LucideIcons.Camera size={16} className="text-pink-500 opacity-70" />;
                if (lUrl.includes('facebook.') || lUrl.includes('fb.')) return <LucideIcons.Users size={16} className="text-blue-600 opacity-70" />;
                if (lUrl.includes('twitter.') || lUrl.includes('x.com')) return <LucideIcons.MessageCircle size={16} className="text-gray-600 dark:text-gray-300 opacity-70" />;
                if (lUrl.includes('linkedin.')) return <LucideIcons.Briefcase size={16} className="text-blue-700 opacity-70" />;
                if (lUrl.includes('github.')) return <LucideIcons.Code size={16} className="text-gray-800 dark:text-gray-200 opacity-70" />;
                if (lUrl.includes('tiktok.')) return <LucideIcons.Music size={16} className="text-gray-900 dark:text-gray-100 opacity-70" />;
                if (lUrl.includes('twitch.')) return <LucideIcons.Tv size={16} className="text-purple-500 opacity-70" />;
                return <LucideIcons.Globe size={16} className="text-blue-500 opacity-60" />;
              })()}
            </div>

            <img 
              src={link.image?.includes('favicons?domain=') ? `/api/thumbnail?url=${encodeURIComponent(link.url)}&v=2` : (link.image?.includes('/api/thumbnail') ? link.image + '&v=2' : link.image)} 
              alt={link.title} 
              className="w-full h-full object-cover absolute inset-0 z-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.failed) {
                  target.dataset.failed = 'true';
                  try {
                    const urlStr = link.url.startsWith('http') ? link.url : `https://${link.url}`;
                    const domain = new URL(urlStr).hostname;
                    target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                  } catch {
                    target.style.display = 'none';
                  }
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          </div>
          
          {/* Información Principal del Enlace */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {category && (
                <span 
                  style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded truncate max-w-[120px]"
                >
                  <DynamicIcon name={category.iconName} size={10} />
                  <span className="truncate">{category.name}</span>
                </span>
              )}
            </div>

            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" title={link.title}>
              {link.title}
            </h3>

            <a 
              href={link.url} 
              target="_blank" 
              rel="noreferrer" 
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono mt-0.5 max-w-full"
              title={link.url}
            >
              <span className="truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
              <ExternalLink size={10} className="shrink-0 opacity-70" />
            </a>

            {link.description ? (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 leading-tight">
                {link.description}
              </p>
            ) : null}

            {/* Etiquetas / Tags */}
            {link.tags && link.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {link.tags.map((tag: string, i: number) => (
                  <span key={i} className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Columna de Acciones Delicadas */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            {/* Favorito */}
            <button 
              type="button"
              onClick={(e) => toggleFavoriteLink(link, e)}
              className={`p-1.5 rounded-lg transition-all ${
                link.isFavorite 
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' 
                  : 'text-gray-300 dark:text-gray-600 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={link.isFavorite ? "Quitar de favoritos" : "Marcar favorito"}
            >
              <Star 
                size={15} 
                className={link.isFavorite ? "fill-amber-400 text-amber-500" : ""} 
              />
            </button>

            {/* Copiar enlace */}
            <button 
              type="button"
              onClick={() => copyLinkToClipboard(link.url, link.id)}
              className={`p-1.5 rounded-lg transition-all relative ${
                isCopied 
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' 
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={isCopied ? "¡Enlace copiado!" : "Copiar enlace"}
            >
              {isCopied ? <Check size={15} className="text-emerald-500" /> : <Copy size={14} />}
            </button>

            {/* Menú de 3 puntos */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setActiveLinkDropdown(activeLinkDropdown === link.id ? null : link.id)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Más opciones"
              >
                <MoreVertical size={15} />
              </button>
              
              {activeLinkDropdown === link.id && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setActiveLinkDropdown(null)} 
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1.5 overflow-hidden text-xs">
                    <button 
                      type="button"
                      className="w-full text-left px-3.5 py-2 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 transition-colors"
                      onClick={(e) => { setActiveLinkDropdown(null); toggleFavoriteLink(link, e); }}
                    >
                      <Star size={13} className={link.isFavorite ? "fill-amber-400 text-amber-500" : "text-amber-500"} />
                      {link.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
                    </button>
                    <button 
                      type="button"
                      className="w-full text-left px-3.5 py-2 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setActiveLinkDropdown(null); openEditLinkModal(link); }}
                    >
                      <Edit2 size={13} className="text-blue-500" /> Editar enlace
                    </button>
                    <button 
                      type="button"
                      className="w-full text-left px-3.5 py-2 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setActiveLinkDropdown(null); openMoveLinkModal(link); }}
                    >
                      <Folder size={13} className="text-indigo-500" /> Mover categoría
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700/60" />
                    <button 
                      type="button"
                      className="w-full text-left px-3.5 py-2 font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2.5 transition-colors"
                      onClick={() => { setActiveLinkDropdown(null); deleteLink(link.id); }}
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSidebarCategoriesMenu = () => {
    const rootCats = categories
      .filter(c => c.parentId === null)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    if (rootCats.length === 0) {
      return (
        <div className="py-6 px-3 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <Folder size={24} className="mx-auto mb-2 text-gray-400 opacity-50" />
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No hay categorías aún</p>
          <button
            type="button"
            onClick={() => openAddCategoryModal(null)}
            className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <Plus size={13} /> Crear la primera
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-1 py-1">
        {rootCats.map(cat => {
          const subCats = categories
            .filter(c => c.parentId === cat.id)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
          const isExpanded = !!expandedCategories[cat.id];
          const isCatSelected = activeCategory === cat.id && !selectedSubCategory;

          return (
            <div 
              key={cat.id} 
              className={`rounded-lg border transition-all ${
                isCatSelected 
                  ? 'border-blue-300/80 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-900/30' 
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-800 hover:bg-gray-100/60 dark:hover:bg-gray-800/40'
              }`}
            >
              {/* Fila compacta de categoría principal */}
              <div className="flex items-center justify-between px-2 py-1.5 gap-1.5 relative">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSelectedSubCategory(null);
                    setMainTab('categories');
                    if (subCats.length > 0 && !isExpanded) {
                      setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
                    }
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left group"
                >
                  <div 
                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }} 
                    className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                  >
                    <DynamicIcon name={cat.iconName} size={13} />
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </span>
                    {subCats.length > 0 && (
                      <span className="text-[10px] px-1 py-0.2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium shrink-0">
                        {subCats.length}
                      </span>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-0.5">
                  {/* Desplegable chevron */}
                  {subCats.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(cat.id, e)}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                      title={isExpanded ? "Ocultar subcategorías" : "Ver subcategorías"}
                    >
                      {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    </button>
                  )}

                  {/* Menú de 3 puntos */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSidebarDropdown(activeSidebarDropdown === cat.id ? null : cat.id);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                      title="Opciones"
                    >
                      <MoreVertical size={13} />
                    </button>

                    {activeSidebarDropdown === cat.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setActiveSidebarDropdown(null)} 
                        />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarDropdown(null);
                              openAddCategoryModal(cat.id);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-2 transition-colors"
                          >
                            <Plus size={13} /> Agregar subcategoría
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarDropdown(null);
                              openEditCategoryModal(cat);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 transition-colors"
                          >
                            <Edit2 size={13} className="text-gray-500" /> Editar categoría
                          </button>
                          <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSidebarDropdown(null);
                              deleteCategory(cat.id);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={13} /> Eliminar categoría
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Lista compacta y delicada de subcategorías */}
              {subCats.length > 0 && isExpanded && (
                <div className="pl-3 pr-1 pb-1 pt-0.5 space-y-0.5 border-l-2 border-blue-200/50 dark:border-blue-900/40 ml-4 mb-1">
                  {subCats.map(sub => {
                    const isSubSelected = activeCategory === cat.id && selectedSubCategory === sub.id;

                    return (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between px-2 py-1 rounded-md transition-all ${
                          isSubSelected
                            ? 'bg-blue-100/80 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCategory(cat.id);
                            setSelectedSubCategory(sub.id);
                            setMainTab('categories');
                            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                              setIsSidebarOpen(false);
                            }
                          }}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <div style={{ color: sub.color }} className="shrink-0">
                            <DynamicIcon name={sub.iconName} size={12} />
                          </div>
                          <span className="text-xs truncate">{sub.name}</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSidebarDropdown(activeSidebarDropdown === sub.id ? null : sub.id);
                            }}
                            className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
                            title="Opciones"
                          >
                            <MoreVertical size={12} />
                          </button>

                          {activeSidebarDropdown === sub.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setActiveSidebarDropdown(null)} 
                              />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-50 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSidebarDropdown(null);
                                    openEditCategoryModal(sub);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium flex items-center gap-2 transition-colors"
                                >
                                  <Edit2 size={13} className="text-gray-500" /> Editar subcategoría
                                </button>
                                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSidebarDropdown(null);
                                    deleteCategory(sub.id);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium flex items-center gap-2 transition-colors"
                                >
                                  <Trash2 size={13} /> Eliminar subcategoría
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderManageCategoryTree = (parentId: string | null, level = 0) => {
    const children = categories.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={level > 0 ? "ml-4 mt-2 border-l-2 border-gray-100 dark:border-gray-700/50 pl-3 space-y-2" : "space-y-2"}>
        {children.map(cat => (
          <div key={cat.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 transition-colors shadow-sm">
              <div className="flex items-center gap-3">
                <div style={{ color: cat.color }} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <DynamicIcon name={cat.iconName} size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cat.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => openAddCategoryModal(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Añadir subcategoría"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => openEditCategoryModal(cat)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {renderManageCategoryTree(cat.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  // Prevenir desajuste de hidratación en SSR
  if (!isMounted) return <div className="h-screen bg-white dark:bg-gray-900"></div>;

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  if (!user) {
    const getAuthErrorMessage = (err: any) => {
      const code = err?.code || '';
      switch (code) {
        case 'auth/user-not-found':
          return 'No existe ninguna cuenta registrada con este correo electrónico.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return 'Correo o contraseña incorrectos. Verifica tus datos o restablece tu contraseña.';
        case 'auth/email-already-in-use':
          return 'Ya existe una cuenta registrada con este correo electrónico.';
        case 'auth/weak-password':
          return 'La contraseña debe tener al menos 6 caracteres.';
        case 'auth/invalid-email':
          return 'El formato del correo electrónico no es válido.';
        case 'auth/missing-email':
          return 'Por favor ingresa un correo electrónico.';
        case 'auth/too-many-requests':
          return 'Demasiados intentos fallidos. Intenta nuevamente en unos minutos.';
        default:
          return err?.message || 'Ocurrió un error en la autenticación.';
      }
    };

    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      setAuthSuccessMessage('');
      setIsSubmittingAuth(true);

      try {
        if (authMode === 'forgot_password') {
          if (!email.trim()) {
            setAuthError('Por favor ingresa tu correo electrónico.');
            setIsSubmittingAuth(false);
            return;
          }
          await sendPasswordResetEmail(auth, email.trim());
          setAuthSuccessMessage(`¡Listo! Hemos enviado las instrucciones para restablecer tu contraseña a ${email.trim()}. Revisa tu bandeja de entrada y tu carpeta de correo no deseado (spam).`);
        } else if (authMode === 'login') {
          await signInWithEmailAndPassword(auth, email.trim(), password);
        } else {
          await createUserWithEmailAndPassword(auth, email.trim(), password);
        }
      } catch (err: any) {
        setAuthError(getAuthErrorMessage(err));
      } finally {
        setIsSubmittingAuth(false);
      }
    };

    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Folder size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">AnotaLink</h1>
          </div>

          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100 text-center">
            {authMode === 'login' && 'Iniciar Sesión'}
            {authMode === 'register' && 'Crear Cuenta'}
            {authMode === 'forgot_password' && 'Recuperar Cuenta'}
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            {authMode === 'login' && 'Ingresa tus credenciales para acceder a tus notas y enlaces.'}
            {authMode === 'register' && 'Crea una cuenta para sincronizar tus enlaces en la nube.'}
            {authMode === 'forgot_password' && 'En AnotaLink tu usuario es tu correo electrónico.'}
          </p>

          {authMode === 'forgot_password' && (
            <div className="mb-5 p-3.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
              💡 <strong>¿Olvidaste tu usuario o contraseña?</strong>
              <br />
              Ingresa la casilla de correo con la que creaste tu cuenta. Te enviaremos un enlace oficial de Firebase para restablecer tu contraseña y recuperar el acceso inmediato.
            </div>
          )}

          {authSuccessMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300">
              {authSuccessMessage}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo Electrónico {authMode === 'forgot_password' ? '(tu usuario)' : ''}
              </label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
              />
            </div>

            {authMode !== 'forgot_password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6} 
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" 
                />
                {authMode === 'login' && (
                  <div className="mt-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot_password');
                        setAuthError('');
                        setAuthSuccessMessage('');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-block"
                    >
                      ¿Olvidaste tu contraseña o usuario?
                    </button>
                  </div>
                )}
              </div>
            )}

            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}

            <button 
              type="submit" 
              disabled={isSubmittingAuth}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors cursor-pointer"
            >
              {isSubmittingAuth ? 'Procesando...' : (
                authMode === 'login' 
                  ? 'Entrar' 
                  : authMode === 'register' 
                    ? 'Registrarse' 
                    : 'Enviar correo de recuperación'
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            {authMode === 'forgot_password' ? (
              <button 
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccessMessage('');
                }} 
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                ← Volver a Iniciar Sesión
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                  setAuthSuccessMessage('');
                }} 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            )}
          </div>

          {/* Firma CAELUM */}
          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700/80 text-center">
            <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
              By CAELUM. Bussines group. Software / Labs
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900">
          <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Folder className="text-blue-500" />
            AnotaLink
          </h1>
          <button 
            className="md:hidden text-gray-500 dark:text-gray-400 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Sidebar Body with 4 Main Options */}
        <div className="p-3 flex-1 overflow-y-auto space-y-2">
          
          {/* 1. OPCIÓN: CATEGORÍAS */}
          <div className="rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsSidebarCatOpen(prev => !prev)}
              className="w-full flex items-center justify-between p-3 text-left font-bold text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/80 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl">
                  <Folder size={17} />
                </div>
                <div>
                  <span>Categorías</span>
                  <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                    {categories.filter(c => c.parentId === null).length} principales
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                {isSidebarCatOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
              </div>
            </button>

            {/* Despliegue de Categorías y Subcategorías sin enlaces */}
            {isSidebarCatOpen && (
              <div className="p-2 pt-0 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40">
                {/* Botón rápido para agregar categoría raíz */}
                <div className="flex items-center justify-between py-2 px-1 mb-1 border-b border-gray-100 dark:border-gray-800/80">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Estructura
                  </span>
                  <button
                    type="button"
                    onClick={() => openAddCategoryModal(null)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Plus size={13} /> Nueva categoría
                  </button>
                </div>

                {renderSidebarCategoriesMenu()}
              </div>
            )}
          </div>

          {/* 2. OPCIÓN: REPORTE */}
          <button
            type="button"
            onClick={() => {
              setMainTab('report');
              setActiveCategory(null);
              setSelectedSubCategory(null);
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left font-bold text-sm transition-all ${
              mainTab === 'report'
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl transition-colors ${
                mainTab === 'report'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'
              }`}>
                <FileSpreadsheet size={17} />
              </div>
              <div>
                <span>Reporte</span>
                <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400">
                  Planilla & exportar enlaces
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              {links.length}
            </span>
          </button>

          {/* 3. OPCIÓN: USUARIO */}
          <button
            type="button"
            onClick={() => setIsUserModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-800/40 text-gray-700 dark:text-gray-200 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left font-bold text-sm transition-all group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300 flex-shrink-0">
                  <UserIcon size={17} />
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="truncate">{userName || 'Usuario'}</span>
                <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400 truncate">
                  {userEmail || user?.email || 'Ver y editar perfil'}
                </p>
              </div>
            </div>
            <div className="p-1 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <LucideIcons.Settings size={15} />
            </div>
          </button>

          {/* 4. OPCIÓN: SALIR */}
          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 text-left font-bold text-sm transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                <LogOut size={17} />
              </div>
              <div>
                <span>Salir</span>
                <p className="text-[10px] font-normal text-red-400 dark:text-red-400/80">
                  Cerrar sesión actual
                </p>
              </div>
            </div>
          </button>

        </div>

        {/* Firma CAELUM */}
        <div className="px-3 py-2 text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium border-t border-gray-100 dark:border-gray-800/80 tracking-wide">
          By CAELUM. Bussines group. Software / Labs
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Topbar / Search */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/90 dark:border-gray-800 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between z-10 sticky top-0 transition-colors">
          <div className="flex items-center w-full gap-2.5">
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>

            <div className="relative w-full max-w-md flex-1 group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-amber-500 transition-colors group-focus-within:text-amber-600">
                <Search size={17} strokeWidth={2.2} />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar enlaces, etiquetas o categorías..." 
                className="w-full pl-10 pr-9 py-2 bg-amber-50/40 dark:bg-gray-800/90 border-2 border-amber-400/80 dark:border-amber-500/70 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-amber-400/20 outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full"
                  title="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-200/60 dark:border-gray-700/60"
              title={isDarkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            
            {/* Botón de Ayuda (Dorado) */}
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-colors flex items-center justify-center border border-amber-200 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10 shadow-2xs"
              title="Ayuda y Manual de Uso"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div ref={contentContainerRef} className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          
          {/* Add New Link Bar (Solo visible en pantalla principal / inicio, no en subcategorías) */}
          {activeCategory === null && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/90 dark:border-gray-700/80 p-3 sm:p-4 mb-6 transition-all">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <div className="flex-1 relative">
                <LinkIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${newLinkUrl.trim() ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} size={18} />
                <input 
                  type="text" 
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNewLink()}
                  placeholder="Pega un enlace aquí para guardarlo rápidamente (ej. https://...)..." 
                  className={`w-full pl-10 ${newLinkUrl ? 'pr-10' : 'pr-4'} py-3 bg-gray-50 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700/80 rounded-xl text-sm text-gray-900 dark:text-white font-medium placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all`}
                />
                {newLinkUrl && (
                  <button
                    type="button"
                    onClick={() => setNewLinkUrl('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full transition-colors"
                    title="Limpiar enlace"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                type="button"
                disabled={!newLinkUrl.trim()}
                onClick={saveNewLink}
                className={`px-5 sm:px-7 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 ${
                  newLinkUrl.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer hover:shadow-md active:scale-[0.98]'
                    : 'bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-70'
                }`}
              >
                <Plus size={18} strokeWidth={2.5} />
                <span>Guardar Enlace</span>
              </button>
            </div>
          </div>
          )}

          {/* SEARCH MODE */}
          {searchQuery.trim() !== '' ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Search size={18} className="text-blue-500" />
                    Resultados para: <span className="text-blue-600 dark:text-blue-400">"{searchQuery}"</span>
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Se encontraron {filteredLinks.length} enlace(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:text-red-600 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Limpiar búsqueda
                </button>
              </div>

              {/* Categorías coincidentes si las hay */}
              {(() => {
                const q = searchQuery.toLowerCase();
                const matchedCats = categories.filter(c => c.name.toLowerCase().includes(q));
                if (matchedCats.length === 0) return null;
                return (
                  <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                    <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                      Categorías coincidentes ({matchedCats.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {matchedCats.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { 
                            if (cat.parentId !== null) {
                              setActiveCategory(cat.parentId);
                              setSelectedSubCategory(cat.id);
                            } else {
                              setActiveCategory(cat.id);
                              setSelectedSubCategory(null);
                            }
                            setSearchQuery(''); 
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 hover:border-blue-500 transition-colors shadow-2xs"
                        >
                          <div style={{ color: cat.color }}>
                            <DynamicIcon name={cat.iconName} size={14} />
                          </div>
                          <span>{cat.name}</span>
                          <span className="text-[10px] text-gray-400">({links.filter(l => l.categoryId === cat.id).length})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Grid de Enlaces */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
                {filteredLinks.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8">
                    <Folder size={44} className="mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-sm">No se encontraron enlaces con ese término.</p>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-xs text-blue-500 hover:underline font-medium"
                    >
                      Ver todas las categorías
                    </button>
                  </div>
                ) : (
                  filteredLinks.map(link => renderLinkCard(link))
                )}
              </div>
            </div>
          ) : (
            <div>
              {/* Pestañas de la Pantalla Principal */}
              <div className="flex items-center justify-between gap-3 mb-5 pb-2.5 border-b border-gray-200/80 dark:border-gray-800">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMainTab('categories');
                      setActiveCategory(null);
                      setSelectedSubCategory(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      mainTab === 'categories' && activeCategory === null
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200/80 dark:border-gray-700/80'
                    }`}
                  >
                    <Folder size={14} />
                    <span>Categorías</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      mainTab === 'categories' && activeCategory === null
                        ? 'bg-blue-700 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {categories.filter(c => c.parentId === null).length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMainTab('favorites');
                      setActiveCategory(null);
                      setSelectedSubCategory(null);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                      mainTab === 'favorites'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200/80 dark:border-gray-700/80'
                    }`}
                  >
                    <Star size={14} className={mainTab === 'favorites' ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'} />
                    <span>Favoritos</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      mainTab === 'favorites' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {links.filter(l => l.isFavorite).length}
                    </span>
                  </button>
                </div>
              </div>

              {mainTab === 'report' ? (
                /* TAB REPORTE Y PLANILLA */
                <div className="space-y-6">
                  {/* Encabezado y Barra de Acciones de Reporte */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                          <div className="p-2 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-xl">
                            <FileSpreadsheet size={22} />
                          </div>
                          <span>Reporte General de Enlaces</span>
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Visualiza, comparte y exporta tus enlaces organizados jerárquicamente por categoría y subcategoría con sus colores distintivos.
                        </p>
                      </div>

                      {/* Botones de Exportar / Compartir */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={exportReportToCSV}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
                          title="Descargar archivo compatible con Excel / Calc"
                        >
                          <Download size={14} />
                          <span>Descargar Excel (.csv)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                          title="Imprimir o guardar como PDF"
                        >
                          <Printer size={14} />
                          <span>Imprimir / PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={shareReport}
                          className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
                          title="Compartir lista o copiar enlace"
                        >
                          <Share2 size={14} />
                          <span>Compartir</span>
                        </button>

                        <button
                          type="button"
                          onClick={copyReportToClipboard}
                          className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-750 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copiar reporte al portapapeles"
                        >
                          <LucideIcons.Copy size={14} />
                          <span>Copiar texto</span>
                        </button>
                      </div>
                    </div>

                    {/* Filtros rápidos del reporte */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold">Filtrar categoría:</span>
                        <select
                          value={reportFilterCat}
                          onChange={(e) => setReportFilterCat(e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="all">Todas las categorías ({links.length} enlaces)</option>
                          {categories.filter(c => c.parentId === null).map(rc => (
                            <option key={rc.id} value={rc.id}>
                              {rc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        <span>Total categorías: <strong className="text-gray-800 dark:text-gray-200">{categories.length}</strong></span>
                        <span>•</span>
                        <span>Total enlaces: <strong className="text-gray-800 dark:text-gray-200">{links.length}</strong></span>
                        <span>•</span>
                        <span>Favoritos: <strong className="text-amber-600 dark:text-amber-400">{links.filter(l => l.isFavorite).length}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Planilla Visual Estructurada */}
                  {(() => {
                    const rootCatsToDisplay = reportFilterCat === 'all'
                      ? categories.filter(c => c.parentId === null)
                      : categories.filter(c => c.id === reportFilterCat);

                    if (rootCatsToDisplay.length === 0) {
                      return (
                        <div className="py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8">
                          <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-30 text-emerald-500" />
                          <p className="font-semibold text-base mb-1">No hay enlaces ni categorías para este filtro</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6">
                        {rootCatsToDisplay.map(rootCat => {
                          const subCats = categories.filter(c => c.parentId === rootCat.id);
                          const directRootLinks = links.filter(l => l.categoryId === rootCat.id);
                          const totalCatLinks = links.filter(l => {
                            if (l.categoryId === rootCat.id) return true;
                            return subCats.some(sc => sc.id === l.categoryId);
                          }).length;

                          return (
                            <div 
                              key={rootCat.id} 
                              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xs"
                            >
                              {/* Barra de la Categoría Raíz con su color identificativo */}
                              <div 
                                style={{ borderLeftColor: rootCat.color }}
                                className="p-4 border-l-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70 dark:bg-gray-900/40 border-b border-gray-200/80 dark:border-gray-700/80"
                              >
                                <div className="flex items-center gap-3">
                                  <div 
                                    style={{ backgroundColor: `${rootCat.color}20`, color: rootCat.color }}
                                    className="p-2.5 rounded-xl shadow-2xs"
                                  >
                                    <DynamicIcon name={rootCat.iconName} size={20} />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                        {rootCat.name}
                                      </h3>
                                      <span 
                                        style={{ backgroundColor: `${rootCat.color}20`, color: rootCat.color }}
                                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                      >
                                        Categoría Principal
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {subCats.length} subcategoría{subCats.length === 1 ? '' : 's'} • {totalCatLinks} enlace{totalCatLinks === 1 ? '' : 's'} en total
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCategory(rootCat.id);
                                      setSelectedSubCategory(null);
                                      setMainTab('categories');
                                    }}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Folder size={13} className="text-blue-500" />
                                    <span>Ver en inicio</span>
                                  </button>
                                </div>
                              </div>

                              {/* Enlaces directos de la categoría raíz si tiene */}
                              {directRootLinks.length > 0 && (
                                <div className="p-4 border-b border-gray-100 dark:border-gray-750">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                      Enlaces Generales de {rootCat.name}
                                    </span>
                                    <span className="text-[11px] px-2 py-0.2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-semibold">
                                      {directRootLinks.length}
                                    </span>
                                  </div>

                                  {/* Tabla / Lista de enlaces estilizada */}
                                  <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700/60">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700/60">
                                        <tr>
                                          <th className="p-3 w-10 text-center">★</th>
                                          <th className="p-3">Título & Notas</th>
                                          <th className="p-3">Enlace URL</th>
                                          <th className="p-3">Etiquetas</th>
                                          <th className="p-3 w-24 text-right">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {directRootLinks.map(link => (
                                          <tr key={link.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors">
                                            <td className="p-3 text-center">
                                              {link.isFavorite ? (
                                                <Star size={14} className="text-amber-500 fill-amber-400 mx-auto" />
                                              ) : (
                                                <span className="text-gray-300">-</span>
                                              )}
                                            </td>
                                            <td className="p-3 font-medium text-gray-900 dark:text-gray-100">
                                              <div>{link.title}</div>
                                              {link.description && (
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal mt-0.5 line-clamp-1">{link.description}</div>
                                              )}
                                            </td>
                                            <td className="p-3 font-mono text-[11px] text-blue-600 dark:text-blue-400 max-w-[220px] truncate">
                                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                <span className="truncate">{link.url}</span>
                                                <ExternalLink size={11} className="flex-shrink-0" />
                                              </a>
                                            </td>
                                            <td className="p-3">
                                              {link.tags && link.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                  {link.tags.map((t: string, idx: number) => (
                                                    <span key={idx} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px]">
                                                      #{t}
                                                    </span>
                                                  ))}
                                                </div>
                                              ) : (
                                                <span className="text-gray-400 text-[10px]">—</span>
                                              )}
                                            </td>
                                            <td className="p-3 text-right">
                                              <button
                                                type="button"
                                                onClick={() => openEditLinkModal(link)}
                                                className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex"
                                                title="Editar enlace"
                                              >
                                                <Edit2 size={13} />
                                              </button>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Subcategorías de la raíz */}
                              {subCats.length > 0 && (
                                <div className="p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/20">
                                  {subCats.map(subCat => {
                                    const subLinks = links.filter(l => l.categoryId === subCat.id);

                                    return (
                                      <div 
                                        key={subCat.id}
                                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200/80 dark:border-gray-700/80 p-3.5 shadow-2xs"
                                      >
                                        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100 dark:border-gray-700">
                                          <div className="flex items-center gap-2.5">
                                            <div 
                                              style={{ backgroundColor: `${subCat.color}15`, color: subCat.color }}
                                              className="p-1.5 rounded-lg"
                                            >
                                              <DynamicIcon name={subCat.iconName} size={15} />
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                  {subCat.name}
                                                </h4>
                                                <span 
                                                  style={{ backgroundColor: `${subCat.color}20`, color: subCat.color }}
                                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                >
                                                  Subcategoría
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                                            {subLinks.length} enlace{subLinks.length === 1 ? '' : 's'}
                                          </span>
                                        </div>

                                        {subLinks.length === 0 ? (
                                          <p className="text-xs text-gray-400 italic py-2">
                                            No hay enlaces guardados en esta subcategoría todavía.
                                          </p>
                                        ) : (
                                          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700/60">
                                            <table className="w-full text-left text-xs">
                                              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-700/60">
                                                <tr>
                                                  <th className="p-2.5 w-8 text-center">★</th>
                                                  <th className="p-2.5">Título & Notas</th>
                                                  <th className="p-2.5">Enlace URL</th>
                                                  <th className="p-2.5">Etiquetas</th>
                                                  <th className="p-2.5 w-20 text-right">Acción</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                                {subLinks.map(link => (
                                                  <tr key={link.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors">
                                                    <td className="p-2.5 text-center">
                                                      {link.isFavorite ? (
                                                        <Star size={13} className="text-amber-500 fill-amber-400 mx-auto" />
                                                      ) : (
                                                        <span className="text-gray-300 text-[10px]">-</span>
                                                      )}
                                                    </td>
                                                    <td className="p-2.5 font-medium text-gray-900 dark:text-gray-100">
                                                      <div>{link.title}</div>
                                                      {link.description && (
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 font-normal mt-0.5 line-clamp-1">{link.description}</div>
                                                      )}
                                                    </td>
                                                    <td className="p-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400 max-w-[200px] truncate">
                                                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                        <span className="truncate">{link.url}</span>
                                                        <ExternalLink size={10} className="flex-shrink-0" />
                                                      </a>
                                                    </td>
                                                    <td className="p-2.5">
                                                      {link.tags && link.tags.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                          {link.tags.map((t: string, idx: number) => (
                                                            <span key={idx} className="px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[9px]">
                                                              #{t}
                                                            </span>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <span className="text-gray-400 text-[10px]">—</span>
                                                      )}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                      <button
                                                        type="button"
                                                        onClick={() => openEditLinkModal(link)}
                                                        className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors inline-flex"
                                                        title="Editar enlace"
                                                      >
                                                        <Edit2 size={12} />
                                                      </button>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              ) : mainTab === 'favorites' ? (
                /* TAB FAVORITOS */
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <Star className="text-amber-500 fill-amber-400" size={22} />
                        Mis Enlaces Favoritos
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {links.filter(l => l.isFavorite).length} enlace(s) destacados con la estrellita dorada
                      </p>
                    </div>
                  </div>

                  {links.filter(l => l.isFavorite).length === 0 ? (
                    <div className="py-16 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8">
                      <Star size={52} className="mx-auto mb-3 text-amber-400 opacity-30" />
                      <p className="font-semibold text-base mb-1 text-gray-800 dark:text-gray-200">
                        Aún no tienes enlaces favoritos
                      </p>
                      <p className="text-xs text-gray-400 mb-5 max-w-sm mx-auto">
                        Haz clic en la estrellita amarilla de cualquier enlace para marcarlo como favorito y tenerlo a mano aquí.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMainTab('categories');
                          setActiveCategory(null);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Folder size={15} /> Ver Categorías
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
                      {links.filter(l => l.isFavorite).map(link => renderLinkCard(link))}
                    </div>
                  )}
                </div>
              ) : activeCategory !== null ? (
                /* CATEGORÍA SELECCIONADA: DESPLIEGUE JERÁRQUICO DE SUBCATEGORÍAS Y LINKS */
                <div>
                  {(() => {
                    const activeCatObj = categories.find(c => c.id === activeCategory);
                    const path = getCategoryPath(activeCategory);
                    const subCats = categories.filter(c => c.parentId === activeCategory);
                    const directLinks = links.filter(l => l.categoryId === activeCategory);
                    const selectedSubCategoryObj = selectedSubCategory && selectedSubCategory !== '__parent_direct__' 
                      ? categories.find(c => c.id === selectedSubCategory) 
                      : null;

                    // Determinamos los enlaces que corresponden mostrar según la subcategoría seleccionada
                    let displayLinks: any[] = [];
                    let activeTargetTitle = activeCatObj?.name || 'Categoría';
                    let activeTargetColor = activeCatObj?.color || '#3b82f6';
                    let activeTargetIcon = activeCatObj?.iconName || 'Folder';
                    let activeTargetCatId: string | null = activeCategory;

                    if (subCats.length > 0) {
                      if (selectedSubCategory === '__parent_direct__') {
                        displayLinks = directLinks;
                        activeTargetTitle = `General (${activeCatObj?.name})`;
                      } else if (selectedSubCategoryObj) {
                        displayLinks = links.filter(l => l.categoryId === selectedSubCategory);
                        activeTargetTitle = selectedSubCategoryObj.name;
                        activeTargetColor = selectedSubCategoryObj.color;
                        activeTargetIcon = selectedSubCategoryObj.iconName;
                        activeTargetCatId = selectedSubCategory;
                      } else {
                        // Aún no seleccionó subcategoría
                        displayLinks = [];
                      }
                    } else {
                      // No tiene subcategorías, muestra los enlaces directos
                      displayLinks = directLinks;
                    }

                    return (
                      <div className="space-y-6">
                        {/* Encabezado limpio: Título de la Categoría y Botón Volver en la misma línea */}
                        <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/60 dark:border-gray-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              style={{ backgroundColor: `${activeCatObj?.color || '#3b82f6'}20`, color: activeCatObj?.color || '#3b82f6' }}
                              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                            >
                              <DynamicIcon name={activeCatObj?.iconName || 'Folder'} size={18} />
                            </div>
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                              {activeCatObj?.name || 'Categoría'}
                            </h2>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveCategory(null);
                              setSelectedSubCategory(null);
                            }}
                            className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-gray-200/80 dark:border-gray-750 shrink-0 shadow-2xs hover:shadow-xs active:scale-[0.98]"
                          >
                            <LucideIcons.ArrowLeft size={14} /> 
                            <span>Volver</span>
                          </button>
                        </div>

                        {/* DESPLIEGUE ELEGANTE Y PROLIJO DE SUBCATEGORÍAS */}
                        {subCats.length > 0 && (
                          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Folder size={14} className="text-blue-500" />
                                Subcategorías
                              </span>
                            </div>

                            {/* Píldoras / Botones de Subcategorías Elegantes y Ordenadas Alfabéticamente */}
                            <div className="flex flex-wrap gap-2 pt-0.5">

                              {subCats
                                .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
                                .map(sub => {
                                  const isSelected = selectedSubCategory === sub.id;
                                  const subLinksCount = links.filter(l => l.categoryId === sub.id).length;

                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => setSelectedSubCategory(isSelected ? null : sub.id)}
                                      style={{
                                        borderColor: isSelected ? sub.color : `${sub.color}30`,
                                        backgroundColor: isSelected ? sub.color : `${sub.color}10`,
                                        color: isSelected ? '#ffffff' : undefined
                                      }}
                                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
                                        !isSelected ? 'text-gray-800 dark:text-gray-100' : 'shadow-sm'
                                      }`}
                                    >
                                      <div 
                                        style={{ color: isSelected ? '#ffffff' : sub.color }}
                                        className="shrink-0"
                                      >
                                        <DynamicIcon name={sub.iconName} size={14} />
                                      </div>

                                      <span>{sub.name}</span>

                                      <span 
                                        style={{
                                          backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : `${sub.color}20`,
                                          color: isSelected ? '#ffffff' : sub.color
                                        }}
                                        className="text-[10px] font-bold px-1.5 py-0.2 rounded-full shrink-0"
                                      >
                                        {subLinksCount}
                                      </span>
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* SECCIÓN DE ENLACES SELECCIONADOS */}
                        {subCats.length > 0 && selectedSubCategory === null ? (
                          /* Mensaje amigable: esperando selección de subcategoría */
                          <div className="py-14 px-6 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 shadow-xs">
                            <div 
                              style={{ backgroundColor: `${activeCatObj?.color || '#3b82f6'}18`, color: activeCatObj?.color || '#3b82f6' }}
                              className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                            >
                              <Folder size={32} />
                            </div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
                              Toca una subcategoría arriba para desplegar sus enlaces
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-5">
                              Al presionar en "{subCats[0]?.name}" u otra subcategoría, aparecerán de inmediato todas las pestañas de sus enlaces guardados.
                            </p>
                            <div className="flex items-center justify-center flex-wrap gap-2">
                              {subCats.slice(0, 3).map(s => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => setSelectedSubCategory(s.id)}
                                  className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors cursor-pointer"
                                >
                                  Ver enlaces de {s.name} →
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* RECIÉN SE MUESTRAN LOS LINKS SELECCIONADOS */
                          <div className="space-y-3 pt-1">

                            {displayLinks.length === 0 ? (
                              <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 shadow-xs">
                                <LinkIcon size={44} className="mx-auto mb-2.5 text-gray-300 dark:text-gray-600" />
                                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1">
                                  Aún no hay enlaces en "{activeTargetTitle}"
                                </p>
                                <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
                                  Pega una URL en la barra superior o presiona el botón para añadir el primer enlace.
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingLink(null);
                                    setEditLinkUrl('');
                                    setEditLinkTitle('');
                                    setEditLinkDesc('');
                                    setEditLinkCat(activeTargetCatId);
                                    setEditLinkTags('');
                                    setIsLinkModalOpen(true);
                                  }}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                  <Plus size={15} strokeWidth={2.5} /> Añadir primer enlace
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
                                {displayLinks.map(link => renderLinkCard(link))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* PANTALLA DE INICIO: TODAS LAS CATEGORÍAS */
                <div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-white tracking-wide">
                      {categories.filter(c => c.parentId === null).length} categorías principales • {links.length} enlaces guardados
                    </p>
                  </div>

                  {categories.filter(c => c.parentId === null).length === 0 ? (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/80 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 shadow-2xs">
                      <Folder size={36} className="mx-auto mb-2 opacity-20 text-blue-500" />
                      <p className="font-semibold text-sm mb-1 text-gray-800 dark:text-gray-200">No hay categorías aún</p>
                      <p className="text-xs text-gray-400 mb-4 max-w-xs mx-auto">
                        Crea una categoría desde el menú lateral para organizar tus enlaces.
                      </p>
                      <button
                        type="button"
                        onClick={() => openAddCategoryModal(null)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Plus size={14} /> Nueva Categoría
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5 w-full">
                      {[...categories]
                        .filter(c => c.parentId === null)
                        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
                        .map(cat => {
                          const totalLinks = getRecursiveLinkCount(cat.id);

                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setActiveCategory(cat.id);
                                setSelectedSubCategory(null);
                              }}
                              style={{
                                backgroundColor: isDarkMode ? `${cat.color}15` : `${cat.color}10`,
                                borderColor: `${cat.color}35`
                              }}
                              className="w-full rounded-xl border px-3.5 py-2.5 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden active:scale-[0.99] text-left"
                            >
                              {/* Barra lateral de acento con el color de la categoría */}
                              <div 
                                className="absolute left-0 top-0 bottom-0 w-1 group-hover:w-1.5 transition-all opacity-90"
                                style={{ backgroundColor: cat.color }}
                              />

                              {/* Ícono a la izquierda */}
                              <div 
                                style={{ 
                                  backgroundColor: `${cat.color}25`, 
                                  color: cat.color 
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ml-1"
                              >
                                <DynamicIcon name={cat.iconName} size={16} />
                              </div>

                              {/* Nombre de la categoría centrado */}
                              <div className="flex-1 min-w-0 text-center px-2">
                                <h3 
                                  className="font-bold text-gray-900 dark:text-gray-100 text-xs sm:text-sm leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate"
                                  title={cat.name}
                                >
                                  {cat.name}
                                </h3>
                              </div>

                              {/* Cantidad de links y flecha a la derecha */}
                              <div className="flex items-center gap-2 shrink-0">
                                <span 
                                  style={{ 
                                    color: cat.color, 
                                    backgroundColor: `${cat.color}20` 
                                  }}
                                  className="text-[11px] font-bold px-2 py-0.5 rounded-md"
                                >
                                  {totalLinks} {totalLinks === 1 ? 'link' : 'links'}
                                </span>
                                <ChevronRight size={14} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all opacity-60" />
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Firma CAELUM Sutil en la Pantalla Principal */}
          <footer className="mt-12 pt-6 pb-4 border-t border-gray-200/60 dark:border-gray-800 text-center select-none">
            <p className="text-[11px] font-medium tracking-wide text-gray-400 dark:text-gray-500">
              By CAELUM. Bussines group. Software / Labs
            </p>
          </footer>
        </div>
      </main>

      {/* Modal Gestionar Categorías */}
      {isManageCatsModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <LucideIcons.Settings size={18} className="text-blue-500" />
                Gestionar Categorías
              </h2>
              <button onClick={() => setIsManageCatsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <button 
                onClick={() => openAddCategoryModal(null)}
                className="w-full flex items-center justify-center gap-2 p-2 mb-4 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors font-medium text-sm"
              >
                <Plus size={16} /> Crear Nueva Categoría
              </button>
              <div className="space-y-2">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">No hay categorías.</p>
                ) : (
                  renderManageCategoryTree(null)
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Categoría */}
      {isCatModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 dark:text-white">
                {editingCategoryId ? 'Editar Categoría' : (modalParentId ? 'Agregar Subcategoría' : 'Nueva Categoría')}
              </h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Ej. Viajes, Recetas, Trabajo..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${newCatColor === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent hover:scale-110'} transition-transform`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ícono ({AVAILABLE_ICONS.length} opciones)
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span>Elegido:</span>
                    <span 
                      style={{ color: newCatColor, backgroundColor: `${newCatColor}20` }}
                      className="px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold text-xs"
                    >
                      <DynamicIcon name={newCatIcon} size={13} /> {newCatIcon}
                    </span>
                  </div>
                </div>

                {/* Buscador de íconos */}
                <div className="relative mb-2.5">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    value={catIconSearch}
                    onChange={e => setCatIconSearch(e.target.value)}
                    placeholder="Buscar ícono por nombre..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                  {catIconSearch && (
                    <button 
                      type="button"
                      onClick={() => setCatIconSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Grilla de íconos con scroll amplio */}
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/20">
                  {AVAILABLE_ICONS
                    .filter(iconName => iconName.toLowerCase().includes(catIconSearch.toLowerCase().trim()))
                    .map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setNewCatIcon(iconName)}
                        title={iconName}
                        className={`aspect-square rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          newCatIcon === iconName 
                            ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-xs scale-105 ring-2 ring-blue-500/20' 
                            : 'border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:border-gray-600'
                        }`}
                        style={{ color: newCatIcon === iconName ? newCatColor : '#9ca3af' }}
                      >
                        <DynamicIcon name={iconName} size={20} />
                      </button>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
              <button 
                onClick={() => setIsCatModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveCategory}
                disabled={!newCatName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mover Enlace */}
      {isMoveLinkModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Folder size={18} className="text-blue-500" />
                Mover Enlace
              </h2>
              <button onClick={() => setIsMoveLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Selecciona la nueva categoría para el enlace:</p>
              
              <div className="relative">
                <div 
                  onClick={() => setIsCatSelectorOpen(!isCatSelectorOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg cursor-pointer flex justify-between items-center"
                >
                  <span className={!editLinkCat ? "text-gray-400" : ""}>
                    {editLinkCat ? categories.find(c => c.id === editLinkCat)?.name : "Selecciona una categoría..."}
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${isCatSelectorOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isCatSelectorOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto hide-scrollbar">
                    {categories.filter(c => c.parentId === null).map(cat => {
                      const hasChildren = categories.some(c => c.parentId === cat.id);
                      const isExpanded = modalExpandedCats[cat.id];
                      
                      return (
                        <div key={cat.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                          <div 
                            className={`flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${editLinkCat === cat.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
                            onClick={(e) => { 
                              if (hasChildren) {
                                toggleModalExpand(cat.id, e);
                              } else {
                                setEditLinkCat(cat.id); 
                                setIsCatSelectorOpen(false); 
                              }
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span style={{ color: cat.color }}><DynamicIcon name={cat.iconName} size={14} /></span>
                              <span>{cat.name}</span>
                            </div>
                            {hasChildren && (
                              <button onClick={(e) => toggleModalExpand(cat.id, e)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                                <ChevronDown size={14} className={`transition-transform text-gray-500 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            )}
                          </div>
                          
                          {hasChildren && isExpanded && (
                            <div className="bg-gray-50 dark:bg-gray-800/40 py-1">
                              <div 
                                className={`flex items-center gap-2 pl-9 pr-3 py-1 text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${editLinkCat === cat.id ? 'text-blue-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
                                onClick={() => { setEditLinkCat(cat.id); setIsCatSelectorOpen(false); }}
                              >
                                ? Ninguna
                              </div>
                              {categories.filter(c => c.parentId === cat.id).map(sub => (
                                <div 
                                  key={sub.id}
                                  className={`flex items-center gap-2 pl-9 pr-3 py-1 text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${editLinkCat === sub.id ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-300'}`}
                                  onClick={() => { setEditLinkCat(sub.id); setIsCatSelectorOpen(false); }}
                                >
                                  <span style={{ color: sub.color }}><DynamicIcon name={sub.iconName} size={12} /></span>
                                  <span>{sub.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
              <button 
                onClick={() => setIsMoveLinkModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveMovedLink}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar / Crear Enlace */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700/80 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/70 flex justify-between items-start bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-gray-800 dark:to-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  {editingLink ? <Edit2 size={18} /> : <LinkIcon size={18} />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    {editingLink ? 'Editar Enlace' : 'Guardar Nuevo Enlace'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {editingLink 
                      ? 'Actualiza los datos o reubica el enlace en tus categorías.' 
                      : 'Revisa los detalles y clasifica tu enlace para encontrarlo siempre.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsLinkModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 max-h-[70vh]">
              {/* Tarjeta de URL Detectada */}
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Favicon del dominio */}
                    <div className="w-6 h-6 rounded-md bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {(() => {
                        let domain = '';
                        try {
                          const u = editLinkUrl.startsWith('http') ? editLinkUrl : `https://${editLinkUrl}`;
                          domain = new URL(u).hostname;
                        } catch {
                          domain = '';
                        }
                        if (domain) {
                          return (
                            <img 
                              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                              alt="favicon" 
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          );
                        }
                        return <Globe size={14} className="text-blue-500" />;
                      })()}
                    </div>
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200 truncate">
                      {(() => {
                        try {
                          const u = editLinkUrl.startsWith('http') ? editLinkUrl : `https://${editLinkUrl}`;
                          return new URL(u).hostname.replace('www.', '');
                        } catch {
                          return 'Enlace web';
                        }
                      })()}
                    </span>
                  </div>
                  
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full shrink-0">
                    <Check size={11} strokeWidth={3} /> Enlace detectado
                  </span>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    value={editLinkUrl}
                    onChange={e => setEditLinkUrl(e.target.value)}
                    placeholder="https://ejemplo.com"
                    className="w-full pl-3 pr-8 py-2 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800/80 rounded-lg text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {editLinkUrl && (
                    <a 
                      href={editLinkUrl.startsWith('http') ? editLinkUrl : `https://${editLinkUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
                      title="Probar enlace"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
              
              {/* Título */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Título del Enlace <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={editLinkTitle}
                  onChange={e => setEditLinkTitle(e.target.value)}
                  placeholder="ej. Guía de programación, Mi receta favorita, etc."
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm font-semibold placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Categoría con selector visual */}
              <div className="relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Categoría <span className="text-red-500">*</span>
                </label>
                
                {/* Botón selector de categoría */}
                <button
                  type="button"
                  onClick={() => setIsCatSelectorOpen(!isCatSelectorOpen)}
                  className={`w-full px-3.5 py-2.5 border rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                    editLinkCat 
                      ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400' 
                      : 'border-amber-300 dark:border-amber-600/70 bg-amber-50/50 dark:bg-amber-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const selectedCat = categories.find(c => c.id === editLinkCat);
                      if (selectedCat) {
                        const path = getCategoryPath(selectedCat.id);
                        return (
                          <>
                            <div 
                              style={{ backgroundColor: `${selectedCat.color}20`, color: selectedCat.color }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            >
                              <DynamicIcon name={selectedCat.iconName} size={15} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white block truncate">
                                {selectedCat.name}
                              </span>
                              {path.length > 1 && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                                  {path.map(p => p.name).join(' › ')}
                                </span>
                              )}
                            </div>
                          </>
                        );
                      }
                      return (
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Selecciona una categoría...
                        </span>
                      );
                    })()}
                  </div>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${isCatSelectorOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desplegable de Categorías */}
                {isCatSelectorOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60 animate-in fade-in duration-100">
                    {categories.filter(c => c.parentId === null).map(cat => {
                      const hasChildren = categories.some(c => c.parentId === cat.id);
                      const isExpanded = modalExpandedCats[cat.id];
                      const isSelected = editLinkCat === cat.id;
                      return (
                        <div key={cat.id} className="p-1">
                          <div 
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' 
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                            }`}
                            onClick={(e) => { 
                              if (hasChildren) {
                                toggleModalExpand(cat.id, e);
                              } else {
                                setEditLinkCat(cat.id); 
                                setIsCatSelectorOpen(false); 
                              }
                            }}
                          >
                            <div className="flex items-center gap-2.5">
                              <div 
                                style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                              >
                                <DynamicIcon name={cat.iconName} size={13} />
                              </div>
                              <span>{cat.name}</span>
                            </div>
                            {hasChildren ? (
                              <button 
                                type="button"
                                onClick={(e) => toggleModalExpand(cat.id, e)} 
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400"
                              >
                                <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            ) : isSelected && (
                              <Check size={16} className="text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          
                          {/* Subcategorías */}
                          {hasChildren && isExpanded && (
                            <div className="ml-3 pl-3 border-l-2 border-gray-100 dark:border-gray-700 space-y-0.5 my-1">
                              {/* Opción de guardar directamente en la categoría padre */}
                              <div 
                                className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                                  isSelected 
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-medium' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                }`}
                                onClick={() => { setEditLinkCat(cat.id); setIsCatSelectorOpen(false); }}
                              >
                                <span>↳ Guardar en categoría principal "{cat.name}"</span>
                                {isSelected && <Check size={13} className="text-blue-600" />}
                              </div>
                              {categories.filter(c => c.parentId === cat.id).map(sub => {
                                const isSubSelected = editLinkCat === sub.id;
                                return (
                                  <div 
                                    key={sub.id}
                                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                                      isSubSelected 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-semibold' 
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                    }`}
                                    onClick={() => { setEditLinkCat(sub.id); setIsCatSelectorOpen(false); }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div 
                                        style={{ backgroundColor: `${sub.color}20`, color: sub.color }}
                                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                                      >
                                        <DynamicIcon name={sub.iconName} size={11} />
                                      </div>
                                      <span>{sub.name}</span>
                                    </div>
                                    {isSubSelected && <Check size={13} className="text-blue-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Descripción o Notas <span className="text-gray-400 font-normal lowercase">(opcional)</span>
                </label>
                <textarea 
                  value={editLinkDesc}
                  onChange={e => setEditLinkDesc(e.target.value)}
                  placeholder="Escribe detalles importantes, recordatorio o notas personales..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Etiquetas */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Etiquetas <span className="text-gray-400 font-normal lowercase">(opcional, separadas por coma)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                  <input 
                    type="text" 
                    value={editLinkTags}
                    onChange={e => setEditLinkTags(e.target.value)}
                    placeholder="trabajo, tutorial, importante"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                {/* Preview de chips de etiquetas si se escribieron */}
                {editLinkTags.trim() !== '' && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editLinkTags.split(',').map(t => t.trim()).filter(Boolean).map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer con botones modernos */}
            <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-700/70 bg-gray-50/80 dark:bg-gray-800/80 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={saveEditedLink}
                disabled={!editLinkTitle.trim() || !editLinkCat}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} />
                {editingLink ? 'Actualizar Enlace' : 'Guardar Enlace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Ayuda */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] border border-yellow-200 dark:border-yellow-700/50">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/10">
              <h2 className="text-lg font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
                <HelpCircle size={22} />
                Guía de Uso AnotaLink
              </h2>
              <button onClick={() => setIsHelpModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4 text-sm text-gray-700 dark:text-white">
              <details className="group border-b border-gray-100 dark:border-gray-700 pb-3">
                <summary className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex justify-between items-center select-none">
                  <span className="flex items-center gap-2">🤔 ¿Qué es AnotaLink?</span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-white group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-600 dark:text-white">Es tu nido personal para guardar, clasificar y no perder nunca más un enlace de internet importante. Tus datos quedan guardados directamente en la memoria de tu dispositivo.</p>
              </details>

              <details className="group border-b border-gray-100 dark:border-gray-700 pb-3">
                <summary className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex justify-between items-center select-none">
                  <span className="flex items-center gap-2">📲 ¿Tengo que instalar algo?</span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-white group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-600 dark:text-white"><strong>¡No, nada será instalado en tu teléfono!</strong> AnotaLink funciona al 100% desde tu navegador web y no ocupa espacio. Sin embargo, para la mejor experiencia, te recomendamos usar la opción <strong>"Agregar a la pantalla principal"</strong> desde el menú de tu navegador. Esto simplemente crea un acceso directo junto a tus otras apps, permitiéndote abrirla rápido y usar la función de compartir.</p>
              </details>

              <details className="group border-b border-gray-100 dark:border-gray-700 pb-3">
                <summary className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex justify-between items-center select-none">
                  <span className="flex items-center gap-2">🚀 Guardar desde una app</span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-white group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-600 dark:text-white">¡Sí! Si ya agregaste el acceso directo a tu pantalla principal, puedes ir a YouTube, Instagram o cualquier app, tocar el botón nativo de "Compartir" de tu teléfono y seleccionar AnotaLink. El enlace viajará mágicamente y se preparará para ser guardado.</p>
              </details>

              <details className="group border-b border-gray-100 dark:border-gray-700 pb-3">
                <summary className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex justify-between items-center select-none">
                  <span className="flex items-center gap-2">🔗 ¿Cómo guardo un enlace nuevo?</span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-white group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-600 dark:text-white">Solo pega la dirección web (ej: youtube.com) en la barra principal y toca <strong>Guardar</strong>. Se abrirá un panel donde podrás asignarle la categoría correcta, ajustar el título y agregarle notas antes de que se guarde en tu lista.</p>
              </details>

              <details className="group border-b border-gray-100 dark:border-gray-700 pb-3">
                <summary className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex justify-between items-center select-none">
                  <span className="flex items-center gap-2">📁 ¿Cómo organizo las categorías?</span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-white group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-3 text-gray-600 dark:text-white">
                  <p className="mb-2">Abre el menú lateral tocando el ícono de hamburguesa (arriba a la izquierda). Ahí puedes crear categorías con tus propios colores e íconos.</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Toca el ícono <Plus size={12} className="inline text-gray-500 dark:text-white"/> al lado de una categoría para crearle una <strong>Subcategoría</strong>.</li>
                    <li>Usa la barra superior para navegar rápidamente.</li>
                  </ul>
                </div>
              </details>

              <details className="group pb-1">
                <summary className="font-semibold text-gray-900 dark:text-white text-base cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors list-none flex justify-between items-center select-none">
                  <span className="flex items-center gap-2">🔍 ¿Para qué sirve el buscador y las etiquetas?</span>
                  <ChevronDown size={16} className="text-gray-400 dark:text-white group-open:rotate-180 transition-transform" />
                </summary>
                <p className="mt-3 text-gray-600 dark:text-white">Cuando guardas o editas un link, puedes ponerle <strong>Etiquetas</strong> (separadas por comas). Luego, usa la lupa superior para buscar: el sistema rastreará al instante entre todos tus títulos, descripciones, links y etiquetas para encontrar lo que buscas.</p>
              </details>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-center">
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm w-full"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE USUARIO (DATOS CONSULTABLES Y EDITABLES) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/70 dark:bg-gray-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 rounded-xl">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Mi Perfil de Usuario
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Consulta y edita tus datos de cuenta
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsUserModalOpen(false);
                  setUserProfileMsg('');
                  setUserProfileError('');
                }} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
              
              {/* Notificaciones de éxito / error */}
              {userProfileMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="flex-shrink-0" />
                  <span>{userProfileMsg}</span>
                </div>
              )}
              {userProfileError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-300">
                  <AlertTriangle size={16} className="flex-shrink-0" />
                  <span>{userProfileError}</span>
                </div>
              )}

              {/* Tarjeta de Resumen y Avatar */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center gap-4">
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt="Avatar" 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-sm flex-shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm">
                    {(userName || userEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                    {userName || 'Usuario Sin Nombre'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {userEmail || user?.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
                      {links.length} enlaces
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold">
                      {categories.length} categorías
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario Editable */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Datos Editables
                </h4>

                {/* Nombre de Usuario */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Nombre o Apodo
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Foto / Avatar URL */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    URL de Avatar / Foto de Perfil
                  </label>
                  <input
                    type="url"
                    value={userPhoto}
                    onChange={(e) => setUserPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  {/* Avatares sugeridos rápidos */}
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-medium">Sugeridos:</span>
                    {[
                      'https://api.dicebear.com/7.x/bottts/svg?seed=AnotaLink',
                      'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
                      'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
                      'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star',
                    ].map((avatarUrl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setUserPhoto(avatarUrl)}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-300 transition-colors"
                      >
                        Avatar {i + 1}
                      </button>
                    ))}
                    {userPhoto && (
                      <button
                        type="button"
                        onClick={() => setUserPhoto('')}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-mono"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Si cambias el correo, Firebase podría requerir que vuelvas a iniciar sesión recientemente.
                  </p>
                </div>

                {/* Cambio de Contraseña */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Nueva Contraseña (opcional)
                    </label>
                    <button
                      type="button"
                      onClick={handleSendPasswordReset}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Enviar correo de recuperación
                    </button>
                  </div>
                  <input
                    type="password"
                    value={userNewPassword}
                    onChange={(e) => setUserNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres (dejar vacío para mantener actual)"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {/* Metadatos de la cuenta consultables */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>ID de Usuario (UID):</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300 max-w-[200px] truncate">{user?.uid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cuenta creada:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Último acceso:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsUserModalOpen(false);
                  setUserProfileMsg('');
                  setUserProfileError('');
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN PARA SALIR (CERRAR SESIÓN) */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-700 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mx-auto mb-4 flex items-center justify-center shadow-xs">
              <LogOut size={26} />
            </div>

            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1.5">
              ¿Deseas cerrar tu sesión?
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Tendrás que ingresar tu correo y contraseña nuevamente para acceder a tus categorías y enlaces guardados.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsLogoutModalOpen(false);
                  await signOut(auth);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer"
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
