import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Upload, Download, Package, PlusCircle, Cloud, HardDrive, LogOut, User, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Medicine } from './models/Medicine';
import { StorageManager } from './services/StorageManager';
import { FirebaseService } from './services/FirebaseService';
import { AuthService } from './services/AuthService';
import { getFirebaseConfigMessage, isFirebaseConfigured } from './config/firebase';
import { fuzzyMatch } from './services/FuzzySearch';
import { MedicineCard } from './components/MedicineCard';
import { AddMedicineModal } from './components/AddMedicineModal';
import { BulkAddModal } from './components/BulkAddModal';
import { AuthModal } from './components/AuthModal';
import { Button, Input, Badge } from './components/ui/BaseComponents';

// Kullanıcıya gösterilen güvenli toast bildirimi
const Toast = ({ message, type = 'error', onClose }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full ${styles[type]}`}
      role="alert"
    >
      <Icon size={18} className="mt-0.5 flex-shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

const SAFE_ERROR_MESSAGES = {
  load: 'İlaçlar yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.',
  save: 'Kaydetme sırasında bir hata oluştu. Lütfen tekrar deneyin.',
  delete: 'Silme sırasında bir hata oluştu. Lütfen tekrar deneyin.',
  import: 'İçe aktarma başarısız. Lütfen dosyayı kontrol edin.',
  signout: 'Çıkış yapılamadı. Lütfen tekrar deneyin.',
  cloud: 'Bulut moduna geçilemedi.'
};

const FirebaseSetupScreen = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-2xl w-full p-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="text-orange-500 mt-1" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Firebase ayarları eksik</h1>
          <p className="text-gray-600 mt-1">{getFirebaseConfigMessage()}</p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-700">
        <p>Projeyi yerelde çalıştırmak için proje kökünde `.env` dosyası oluşturup `.env.example` içindeki değerleri gerçek Firebase proje bilgilerinle doldur.</p>
        <pre className="bg-gray-900 text-gray-50 rounded-lg p-4 overflow-x-auto text-xs">{`VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...`}</pre>
        <p>Değerleri ekledikten sonra geliştirme sunucusunu durdurup tekrar `npm run dev` çalıştır.</p>
      </div>
    </div>
  </div>
);

function App() {
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [loaded, setLoaded] = useState(false);
  const [useCloud, setUseCloud] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setMedicines([]);
        setLoaded(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !useCloud) return;
    loadMedicines();
  }, [user, useCloud]);

  useEffect(() => {
    if (loaded && !useCloud) {
      StorageManager.save(medicines);
    }
  }, [medicines, loaded, useCloud]);

  const loadMedicines = async () => {
    if (!user && useCloud) return;

    try {
      setSyncing(true);
      if (useCloud && user) {
        const data = await FirebaseService.getAllMedicines(user.uid);
        setMedicines(data);
      } else {
        const data = StorageManager.load();
        setMedicines(data);
      }
      setLoaded(true);
    } catch (error) {
      showToast(SAFE_ERROR_MESSAGES.load);
    } finally {
      setSyncing(false);
    }
  };

  const handleAuth = async (action, data) => {
    try {
      if (action === 'signup') {
        await AuthService.signUp(data.email, data.password, data.displayName);
      } else if (action === 'signin') {
        await AuthService.signIn(data.email, data.password);
      } else if (action === 'reset') {
        await AuthService.resetPassword(data.email);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      setMedicines([]);
      setLoaded(false);
    } catch (error) {
      showToast(SAFE_ERROR_MESSAGES.signout);
    }
  };

  const handleSave = async (data) => {
    try {
      setSyncing(true);
      if (editingId) {
        const updated = { ...data, id: editingId };
        if (useCloud && user) {
          await FirebaseService.updateMedicine(user.uid, editingId, data);
        }
        setMedicines(prev => prev.map(m => m.id === editingId ? updated : m));
      } else {
        if (useCloud && user) {
          const newMed = await FirebaseService.addMedicine(user.uid, data);
          setMedicines(prev => [newMed, ...prev]);
        } else {
          const newMedicine = new Medicine(
            null,
            data.name,
            data.quantity,
            data.expiryDate,
            data.notes,
            data.activeIngredient1,
            data.activeIngredient2,
            data.activeIngredient3
          );
          setMedicines(prev => [newMedicine, ...prev]);
        }
      }
    } catch (error) {
      showToast(SAFE_ERROR_MESSAGES.save);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkAdd = async (medicinesData) => {
    try {
      setSyncing(true);
      if (useCloud && user) {
        const addedMedicines = [];
        for (const data of medicinesData) {
          const newMed = await FirebaseService.addMedicine(user.uid, data);
          addedMedicines.push(newMed);
        }
        setMedicines(prev => [...addedMedicines, ...prev]);
        showToast(`${addedMedicines.length} ilaç başarıyla eklendi`, 'success');
      } else {
        const newMedicines = medicinesData.map(data =>
          new Medicine(null, data.name, data.quantity, data.expiryDate, data.notes,
            data.activeIngredient1, data.activeIngredient2, data.activeIngredient3)
        );
        setMedicines(prev => [...newMedicines, ...prev]);
        showToast(`${newMedicines.length} ilaç eklendi`, 'success');
      }
    } catch (error) {
      showToast(SAFE_ERROR_MESSAGES.save);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingId(medicine.id);
    setModalInitialData(medicine);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id, idsToDelete = [id]) => {
    try {
      setSyncing(true);
      if (useCloud && user) {
        for (const deleteId of idsToDelete) {
          await FirebaseService.deleteMedicine(user.uid, deleteId);
        }
      }
      setMedicines(prev => prev.filter(m => !idsToDelete.includes(m.id)));
    } catch (error) {
      showToast(SAFE_ERROR_MESSAGES.delete);
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = () => {
    StorageManager.exportToJSON(medicines);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSyncing(true);
      const data = await StorageManager.importFromJSON(file);

      if (Array.isArray(data)) {
        if (useCloud && user) {
          const uploadedMedicines = [];
          for (const medicine of data) {
            const newMed = await FirebaseService.addMedicine(user.uid, medicine);
            uploadedMedicines.push(newMed);
          }
          setMedicines(uploadedMedicines);
          showToast(`${uploadedMedicines.length} ilaç başarıyla yüklendi`, 'success');
        } else {
          setMedicines(data);
          showToast('Veriler başarıyla yüklendi', 'success');
        }
      }
    } catch (err) {
      showToast(err.message || SAFE_ERROR_MESSAGES.import);
    } finally {
      setSyncing(false);
    }
    e.target.value = null;
  };

  const toggleCloudMode = async () => {
    if (!user && !useCloud) {
      setShowAuthModal(true);
      return;
    }

    const newMode = !useCloud;
    setUseCloud(newMode);
    setLoaded(false);

    try {
      setSyncing(true);
      if (newMode && user) {
        const cloudData = await FirebaseService.getAllMedicines(user.uid);
        setMedicines(cloudData);
      } else if (!newMode) {
        const localData = StorageManager.load();
        setMedicines(localData);
      }
      setLoaded(true);
    } catch (error) {
      showToast(SAFE_ERROR_MESSAGES.cloud);
      setUseCloud(!newMode);
    } finally {
      setSyncing(false);
    }
  };

  const filteredMedicines = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim().slice(0, 200);

    const filtered = medicines.filter(m => {
      if (!searchLower) return true;
      if (fuzzyMatch(searchLower, m.name)) return true;
      if (m.activeIngredient1 && fuzzyMatch(searchLower, m.activeIngredient1)) return true;
      if (m.activeIngredient2 && fuzzyMatch(searchLower, m.activeIngredient2)) return true;
      if (m.activeIngredient3 && fuzzyMatch(searchLower, m.activeIngredient3)) return true;
      return false;
    });

    const grouped = [];
    const processedIds = new Set();

    filtered.forEach(medicine => {
      if (processedIds.has(medicine.id)) return;

      const duplicates = filtered.filter(m => {
        if (processedIds.has(m.id)) return false;
        return (
          m.name.toLowerCase() === medicine.name.toLowerCase() &&
          (m.activeIngredient1 || '').toLowerCase() === (medicine.activeIngredient1 || '').toLowerCase() &&
          (m.activeIngredient2 || '').toLowerCase() === (medicine.activeIngredient2 || '').toLowerCase() &&
          (m.activeIngredient3 || '').toLowerCase() === (medicine.activeIngredient3 || '').toLowerCase() &&
          (m.quantity || '').toLowerCase() === (medicine.quantity || '').toLowerCase() &&
          m.expiryDate === medicine.expiryDate &&
          (m.notes || '').toLowerCase() === (medicine.notes || '').toLowerCase()
        );
      });

      duplicates.forEach(d => processedIds.add(d.id));
      grouped.push({ ...medicine, count: duplicates.length, allIds: duplicates.map(d => d.id) });
    });

    const sorted = [...grouped].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name, 'tr');
        case 'name-desc': return b.name.localeCompare(a.name, 'tr');
        case 'expiry-asc':
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return a.expiryDate.localeCompare(b.expiryDate);
        case 'expiry-desc':
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return b.expiryDate.localeCompare(a.expiryDate);
        case 'count-asc': return a.count - b.count;
        case 'count-desc': return b.count - a.count;
        case 'date-asc': return (a.createdAt || '').localeCompare(b.createdAt || '');
        case 'date-desc':
        default: return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });

    return sorted;
  }, [medicines, searchTerm, sortBy]);

  const visibleMedicineCount = useMemo(
    () => filteredMedicines.reduce((total, medicine) => total + (medicine.count || 1), 0),
    [filteredMedicines]
  );

  if (!isFirebaseConfigured) {
    return <FirebaseSetupScreen />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
          <div className="text-center text-white">
            <Package size={64} className="mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-2">İlaç Stok Takip Sistemi</h1>
            <p className="text-lg mb-8 opacity-90">Evinizdeki ilaçları dijital ortamda takip edin</p>
            <Button onClick={() => setShowAuthModal(true)} className="bg-white text-purple-600 hover:bg-gray-100">
              Giriş Yap / Kayıt Ol
            </Button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package size={32} />
              <div>
                <h1 className="text-2xl font-bold">İlaç Stok Takip</h1>
                <p className="text-sm text-purple-200">
                  {visibleMedicineCount} ilaç &bull; {user.displayName || user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={syncing ? 'warning' : useCloud ? 'success' : 'default'}>
                {syncing ? 'Senkronize ediliyor...' : useCloud ? 'Bulut' : 'Yerel'}
              </Badge>

              <button
                onClick={toggleCloudMode}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={useCloud ? 'Yerel Depolamaya Geç' : 'Bulut Depolamaya Geç'}
                aria-label={useCloud ? 'Yerel Depolamaya Geç' : 'Bulut Depolamaya Geç'}
              >
                {useCloud ? <HardDrive size={18} /> : <Cloud size={18} />}
              </button>

              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                title="Çıkış Yap"
                aria-label="Çıkış Yap"
              >
                <LogOut size={18} />
                <span className="hidden md:inline text-sm">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <div className="flex gap-2">
            <Button onClick={() => { setEditingId(null); setModalInitialData(null); setIsAddModalOpen(true); }}>
              <Plus size={20} /> Tek İlaç Ekle
            </Button>
            <Button onClick={() => setIsBulkModalOpen(true)} variant="secondary">
              <PlusCircle size={20} /> Toplu Ekle
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} variant="secondary">
              <Download size={18} /> Dışa Aktar
            </Button>
            <label className="cursor-pointer">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200">
                <Upload size={18} /> İçe Aktar
              </div>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImport}
                className="hidden"
                aria-label="JSON dosyası içe aktar"
              />
            </label>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <label htmlFor="sortSelect" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Sırala:
            </label>
            <select
              id="sortSelect"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
            >
              <option value="date-desc">En Yeni Önce</option>
              <option value="date-asc">En Eski Önce</option>
              <option value="name-asc">A - Z</option>
              <option value="name-desc">Z - A</option>
              <option value="expiry-asc">Yakında Bitecekler</option>
              <option value="expiry-desc">Uzun Süreliler</option>
              <option value="count-desc">Çok Olanlar Önce</option>
              <option value="count-asc">Az Olanlar Önce</option>
            </select>
            <span className="text-xs text-gray-500">({visibleMedicineCount} ilaç)</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="search"
              placeholder="İlaç ara (yanlış yazımlar da bulunur)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.slice(0, 200))}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
              aria-label="İlaç ara"
              maxLength={200}
            />
          </div>
        </div>

        {filteredMedicines.length === 0 ? (
          <div className="text-center py-16">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? 'İlaç bulunamadı' : 'Henüz ilaç eklenmemiş'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Farklı bir arama terimi deneyin' : 'İlaç eklemek için yukarıdaki butonları kullanın'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedicines.map(medicine => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingId(null); setModalInitialData(null); }}
        onSave={handleSave}
        initialData={modalInitialData}
        isEdit={!!editingId}
      />

      <BulkAddModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={handleBulkAdd}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
