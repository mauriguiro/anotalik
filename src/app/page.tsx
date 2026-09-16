"use client";

import React, { useState, useEffect } from 'react';
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
  Copy
} from 'lucide-react';

import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
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
  'Briefcase', 'Home', 'BookOpen', 'Plane', 'Car', 'Fuel', 
  'ShoppingCart', 'Heart', 'Camera', 'Music', 'Gamepad2', 
  'Coffee', 'Utensils', 'Zap', 'Star', 'Flag', 'MapPin', 
  'Smile', 'Folder', 'Link', 'Monitor', 'Smartphone', 'Banknote'
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
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
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authError, setAuthError] = useState('');

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
    setNewCatColor(AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)]);
    setNewCatIcon(AVAILABLE_ICONS[Math.floor(Math.random() * AVAILABLE_ICONS.length)]);
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: any) => {
    setEditingCategoryId(cat.id);
    setModalParentId(cat.parentId);
    setNewCatName(cat.name);
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
    
    if (activeCategory === id) setActiveCategory(null);
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
      setEditLinkCat(activeCategory);
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
        image: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
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
    // 1. Filtrar por categoría
    if (activeCategory !== null && link.categoryId !== activeCategory) return false;
    
    // 2. Filtrar por búsqueda (Título, URL, Descripción, Etiquetas)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const inTitle = link.title.toLowerCase().includes(q);
      const inDesc = link.description && link.description.toLowerCase().includes(q);
      const inUrl = link.url.toLowerCase().includes(q);
      const inTags = link.tags && link.tags.some((t: string) => t.toLowerCase().includes(q));
      
      if (!inTitle && !inDesc && !inUrl && !inTags) return false;
    }
    
    return true;
  });

  const renderCategoryTree = (parentId: string | null, level = 0) => {
    const children = categories.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <ul className={level > 0 ? "ml-4 mt-1 border-l border-gray-100 dark:border-gray-700 pl-1 space-y-1" : "space-y-1"}>
        {children.map(cat => {
          const hasChildren = categories.some(c => c.parentId === cat.id);
          const isExpanded = expandedCategories[cat.id];
          
          return (
            <React.Fragment key={cat.id}>
              <li 
                className={`flex flex-col rounded-md cursor-pointer group ${activeCategory === cat.id ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
              >
                <div 
                  className="flex items-center justify-between p-2"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    if (hasChildren && !isExpanded) {
                      setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
                    }
                    setIsSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {hasChildren ? (
                      <div onClick={(e) => toggleExpand(cat.id, e)} className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                    ) : (
                      <div className="w-[18px]"></div> // Spacer
                    )}
                    <div style={{ color: cat.color }}>
                      <DynamicIcon name={cat.iconName} size={16} />
                    </div>
                    <span className={`text-sm ${activeCategory === cat.id ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                      {cat.name}
                    </span>
                  </div>
                </div>
                
                {hasChildren && isExpanded && (
                  <div className="pb-1">
                    {renderCategoryTree(cat.id, level + 1)}
                  </div>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ul>
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
    const handleAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError('');
      try {
        if (isLoginMode) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } catch (err: any) {
        setAuthError(err.message || 'Error en la autenticación');
      }
    };
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white">
              <Folder size={28} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">AnotaLink</h1>
          </div>
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">
            {isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-gray-100" />
            </div>
            {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors">
              {isLoginMode ? 'Entrar' : 'Registrarse'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {isLoginMode ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
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
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-2">Categorías</h2>
            <button 
              onClick={() => setIsManageCatsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors border border-blue-100 dark:border-blue-900/50"
            >
              <LucideIcons.Settings size={16} /> Gestionar Categorías
            </button>
          </div>
          
          <div 
            className={`flex items-center gap-2 p-2 mb-2 rounded-md cursor-pointer ${activeCategory === null ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
            onClick={() => {
              setActiveCategory(null);
              setIsSidebarOpen(false);
            }}
          >
            <div className="w-[18px]"></div>
            <Folder size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-sm font-medium">Todos los Links</span>
          </div>

          {renderCategoryTree(null)}
        </div>
        
        {/* User Profile & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Cuenta</span>
            <span className="text-sm font-semibold truncate text-gray-800 dark:text-gray-200" title={user?.email || ''}>{user?.email}</span>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Cerrar sesión"
          >
            <LucideIcons.LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden">
        
        {/* Topbar / Search */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between z-10">
          <div className="flex items-center w-full gap-2">
            <button 
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>

            <div className="relative w-full max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, tag o url..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-transparent rounded-lg text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all dark:text-white"
              />
            </div>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ml-2"
              title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* Botón de Ayuda (Dorado) */}
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="p-2 ml-1 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full transition-colors flex items-center justify-center border border-yellow-200 dark:border-yellow-700/50 bg-yellow-50/50 dark:bg-yellow-900/10"
              title="Ayuda y Manual de Uso"
            >
              <HelpCircle size={20} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
          
          {/* Add New Link */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input 
                  type="text" 
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNewLink()}
                  placeholder="Pega una URL aquí para guardar rápidamente..." 
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 outline-none transition-all dark:text-white"
                />
              </div>
              <button 
                onClick={saveNewLink}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus size={18} />
                Guardar
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {activeCategory !== null 
                ? `Categoría: ${categories.find(c => c.id === activeCategory)?.name}` 
                : (searchQuery ? 'Resultados de búsqueda' : 'Recientes')}
            </h2>
          </div>

          {/* Links List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {filteredLinks.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                <Folder size={48} className="mx-auto mb-4 opacity-20" />
                <p>No se encontraron enlaces.</p>
              </div>
            ) : filteredLinks.map(link => {
              const category = categories.find(c => c.id === link.categoryId);
              
              return (
                <div key={link.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3 hover:shadow-md transition-shadow group">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-lg relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {/* Fallback de fondo */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-0">
                      {(() => {
                        const lUrl = link.url.toLowerCase();
                        if (lUrl.includes('youtube.') || lUrl.includes('youtu.be')) return <LucideIcons.Video size={28} className="text-red-500 opacity-40" />;
                        if (lUrl.includes('instagram.')) return <LucideIcons.Camera size={28} className="text-pink-500 opacity-40" />;
                        if (lUrl.includes('facebook.') || lUrl.includes('fb.')) return <LucideIcons.Users size={28} className="text-blue-600 opacity-40" />;
                        if (lUrl.includes('twitter.') || lUrl.includes('x.com')) return <LucideIcons.MessageCircle size={28} className="text-gray-500 opacity-40" />;
                        if (lUrl.includes('linkedin.')) return <LucideIcons.Briefcase size={28} className="text-blue-700 opacity-40" />;
                        if (lUrl.includes('github.')) return <LucideIcons.Code size={28} className="text-gray-600 opacity-40" />;
                        if (lUrl.includes('tiktok.')) return <LucideIcons.Music size={28} className="text-gray-700 opacity-40" />;
                        if (lUrl.includes('twitch.')) return <LucideIcons.Tv size={28} className="text-purple-500 opacity-40" />;
                        return <LucideIcons.Globe size={28} className="text-gray-400 opacity-40" />;
                      })()}
                    </div>

                    <img 
                      src={link.image} 
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
                          } catch (err) {
                            target.style.display = 'none';
                          }
                        } else {
                          target.style.display = 'none';
                        }
                      }}
                    />
                    
                    {category && (
                      <span 
                        className="absolute top-1 right-1 p-0.5 rounded text-white shadow-sm flex items-center z-20"
                        style={{ backgroundColor: category.color }}
                        title={category.name}
                      >
                        <DynamicIcon name={category.iconName} size={12} />
                      </span>
                    )}
                    {(() => {
                      const lUrl = link.url.toLowerCase();
                      let icon = null;
                      let bg = '';
                      if (lUrl.includes('youtube.') || lUrl.includes('youtu.be')) { icon = <LucideIcons.Video size={12} />; bg = 'bg-red-500'; }
                      else if (lUrl.includes('instagram.')) { icon = <LucideIcons.Camera size={12} />; bg = 'bg-pink-600'; }
                      else if (lUrl.includes('facebook.') || lUrl.includes('fb.')) { icon = <LucideIcons.Users size={12} />; bg = 'bg-blue-600'; }
                      else if (lUrl.includes('twitter.') || lUrl.includes('x.com')) { icon = <LucideIcons.MessageCircle size={12} />; bg = 'bg-blue-400 dark:bg-gray-800'; }
                      else if (lUrl.includes('linkedin.')) { icon = <LucideIcons.Briefcase size={12} />; bg = 'bg-blue-700'; }
                      else if (lUrl.includes('github.')) { icon = <LucideIcons.Code size={12} />; bg = 'bg-gray-900 dark:bg-gray-700'; }
                      else if (lUrl.includes('tiktok.')) { icon = <LucideIcons.Music size={12} />; bg = 'bg-black dark:bg-gray-800'; }
                      else if (lUrl.includes('twitch.')) { icon = <LucideIcons.Tv size={12} />; bg = 'bg-purple-600'; }
                      
                      if (!icon) return null;
                      return (
                        <span 
                          className={`absolute bottom-1 left-1 p-1 rounded-full text-white shadow-sm flex items-center justify-center z-20 ${bg}`}
                          title="Red de origen"
                        >
                          {icon}
                        </span>
                      );
                    })()}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base line-clamp-1 mb-0.5" title={link.title}>
                      {link.title}
                    </h3>
                    <a href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-blue-500 dark:text-blue-400 hover:underline mb-1">
                      {(() => {
                        const url = link.url.toLowerCase();
                        if (url.includes('youtube.') || url.includes('youtu.be')) return <LucideIcons.Video size={14} className="text-red-500 shrink-0" />;
                        if (url.includes('instagram.')) return <LucideIcons.Camera size={14} className="text-pink-500 shrink-0" />;
                        if (url.includes('facebook.') || url.includes('fb.')) return <LucideIcons.Users size={14} className="text-blue-600 shrink-0" />;
                        if (url.includes('twitter.') || url.includes('x.com')) return <LucideIcons.MessageCircle size={14} className="text-blue-400 dark:text-gray-300 shrink-0" />;
                        if (url.includes('linkedin.')) return <LucideIcons.Briefcase size={14} className="text-blue-700 shrink-0" />;
                        if (url.includes('github.')) return <LucideIcons.Code size={14} className="text-gray-800 dark:text-gray-200 shrink-0" />;
                        if (url.includes('tiktok.')) return <LucideIcons.Music size={14} className="text-gray-900 dark:text-gray-100 shrink-0" />;
                        if (url.includes('twitch.')) return <LucideIcons.Tv size={14} className="text-purple-500 shrink-0" />;
                        return <LucideIcons.Globe size={14} className="text-gray-400 shrink-0" />;
                      })()}
                      <span className="truncate">{link.url}</span>
                    </a>
                    <p className={`text-xs sm:text-sm line-clamp-1 sm:line-clamp-2 ${link.description ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                      {link.description ? link.description : '(descripción)'}
                    </p>
                    
                    {/* Tags */}
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {link.tags.map((tag: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <Hash size={10} className="mr-0.5 opacity-50"/> {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Opciones */}
                  <div className="relative pl-2 border-l border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-0.5">
                    <button 
                      onClick={() => setActiveLinkDropdown(activeLinkDropdown === link.id ? null : link.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Opciones"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <button 
                      onClick={() => navigator.clipboard.writeText(link.url)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Copiar enlace"
                    >
                      <Copy size={14} />
                    </button>
                    
                    {activeLinkDropdown === link.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveLinkDropdown(null)} 
                        />
                        <div className="absolute right-0 top-10 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1 overflow-hidden">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => { setActiveLinkDropdown(null); openEditLinkModal(link); }}
                          >
                            <Edit2 size={14} /> Editar
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            onClick={() => { setActiveLinkDropdown(null); openMoveLinkModal(link); }}
                          >
                            <Folder size={14} /> Mover
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            onClick={() => { setActiveLinkDropdown(null); deleteLink(link.id); }}
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ícono</label>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 hide-scrollbar">
                  {AVAILABLE_ICONS.map(iconName => (
                    <button
                      key={iconName}
                      onClick={() => setNewCatIcon(iconName)}
                      className={`aspect-square rounded-lg flex items-center justify-center border transition-all ${newCatIcon === iconName ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-sm' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-full border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingLink ? 'Editar Enlace' : 'Guardar Nuevo Enlace'}
              </h2>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                <input 
                  type="text" 
                  value={editLinkUrl}
                  onChange={e => setEditLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  value={editLinkTitle}
                  onChange={e => setEditLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea 
                  value={editLinkDesc}
                  onChange={e => setEditLinkDesc(e.target.value)}
                  placeholder="Agrega una descripción..."
                  rows={1}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <div 
                  onClick={() => setIsCatSelectorOpen(!isCatSelectorOpen)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg cursor-pointer flex justify-between items-center"
                >
                  <span className={!editLinkCat ? "text-gray-400" : ""}>
                    {editLinkCat ? categories.find(c => c.id === editLinkCat)?.name : "Selecciona una categoría obligatoria..."}
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
                                ↳ Ninguna
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Etiquetas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input 
                  type="text" 
                  value={editLinkTags}
                  onChange={e => setEditLinkTags(e.target.value)}
                  placeholder="ej. urgente, leer-luego, recetas"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
              <button 
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveEditedLink}
                disabled={!editLinkTitle.trim() || !editLinkCat}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Guardar Cambios
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

    </div>
  );
}
