import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Upload, Download, Package, PlusCircle, Cloud, HardDrive } from 'lucide-react';
import { Medicine } from './models/Medicine';
import { StorageManager } from './services/StorageManager';
import { FirebaseService } from './services/FirebaseService';
import { MedicineCard } from './components/MedicineCard';
import { AddMedicineModal } from './components/AddMedicineModal';
import { BulkAddModal } from './components/BulkAddModal';
import { Button, Input, Badge } from './components/ui/BaseComponents';

function App() {
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [useCloud, setUseCloud] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [useCloud]);

  const loadData = async () => {
    try {
      setSyncing(true);
      if (useCloud) {
        // Load from Firebase
        const data = await FirebaseService.getAllMedicines();
        console.log("Loaded from Firebase:", data);
        setMedicines(data);
      } else {
        // Load from localStorage
        const data = StorageManager.load();
        console.log("Loaded from localStorage:", data);
        setMedicines(data);
      }
      setLoaded(true);
    } catch (error) {
      console.error("Load error:", error);
      alert("Veri yükleme hatası: " + error.message);
      // Fallback to localStorage
      const data = StorageManager.load();
      setMedicines(data);
      setLoaded(true);
    } finally {
      setSyncing(false);
    }
  };

  // Save to localStorage (backup)
  useEffect(() => {
    if (loaded && !useCloud) {
      console.log("Saving to localStorage:", medicines);
      StorageManager.save(medicines);
    }
  }, [medicines, loaded, useCloud]);

  const handleAddMedicine = async (data) => {
    try {
      setSyncing(true);
      if (editingId) {
        // Update existing
        if (useCloud) {
          await FirebaseService.updateMedicine(editingId, data);
          setMedicines(prev => prev.map(m =>
            m.id === editingId ? { ...m, ...data } : m
          ));
        } else {
          setMedicines(prev => prev.map(m =>
            m.id === editingId ? { ...m, ...data } : m
          ));
        }
        setEditingId(null);
      } else {
        // Add new
        if (useCloud) {
          const newMed = await FirebaseService.addMedicine(data);
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
      setModalInitialData(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Kaydetme hatası: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleBulkAdd = async (medicinesData) => {
    try {
      setSyncing(true);
      if (useCloud) {
        const addedMedicines = [];
        for (const data of medicinesData) {
          const newMed = await FirebaseService.addMedicine(data);
          addedMedicines.push(newMed);
        }
        setMedicines(prev => [...addedMedicines, ...prev]);
      } else {
        const newMedicines = medicinesData.map(data =>
          new Medicine(
            null,
            data.name,
            data.quantity,
            data.expiryDate,
            data.notes,
            data.activeIngredient1,
            data.activeIngredient2,
            data.activeIngredient3
          )
        );
        setMedicines(prev => [...newMedicines, ...prev]);
      }
    } catch (error) {
      console.error("Bulk add error:", error);
      alert("Toplu ekleme hatası: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingId(medicine.id);
    setModalInitialData(medicine);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bu ilacı silmek istediğinize emin misiniz?")) return;

    try {
      setSyncing(true);
      if (useCloud) {
        await FirebaseService.deleteMedicine(id);
      }
      setMedicines(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error("Delete error:", error);
      alert("Silme hatası: " + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await StorageManager.importFromJSON(file);
      if (Array.isArray(data)) {
        setMedicines(data);
        alert("Veriler başarıyla yüklendi!");
      }
    } catch (err) {
      alert("Hata: " + err.message);
    }
    e.target.value = null;
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Package size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">İlaç Stok Takip</h1>
                <div className="flex items-center gap-2 mt-1">
                  {syncing ? (
                    <Badge variant="default" className="text-xs animate-pulse">Senkronize ediliyor...</Badge>
                  ) : (
                    <Badge variant={useCloud ? "success" : "default"} className="text-xs">
                      {useCloud ? <><Cloud size={12} className="mr-1" /> Bulut</> : <><HardDrive size={12} className="mr-1" /> Yerel</>}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="İlaç ara..."
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:bg-white/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setUseCloud(!useCloud)}
                className="px-3 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm whitespace-nowrap"
                title={useCloud ? "Yerel Depolamaya Geç" : "Bulut Depolamaya Geç"}
              >
                {useCloud ? <HardDrive size={18} /> : <Cloud size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Actions Toolbar */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
          <div className="flex gap-2">
            <Button onClick={() => { setEditingId(null); setModalInitialData(null); setIsAddModalOpen(true); }}>
              <Plus size={20} /> Tek İlaç Ekle
            </Button>
            <Button variant="secondary" onClick={() => setIsBulkAddModalOpen(true)}>
              <PlusCircle size={20} className="text-purple-600" /> Toplu Ekle
            </Button>
          </div>

          <div className="flex gap-2">
            <input type="file" id="json-upload" className="hidden" accept=".json" onChange={handleImport} />
            <Button variant="ghost" onClick={() => document.getElementById('json-upload').click()} title="Yedekten Yükle">
              <Upload size={20} />
            </Button>
            <Button variant="ghost" onClick={() => StorageManager.exportToJSON(medicines)} title="Yedeği İndir">
              <Download size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        {medicines.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package size={64} className="mx-auto mb-4 opacity-20" />
            <p className="text-xl">Henüz ilaç eklenmemiş.</p>
            <p className="text-sm">"Tek İlaç Ekle" veya "Toplu Ekle" butonunu kullanarak başlayın.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedicines.map(med => (
              <MedicineCard
                key={med.id}
                medicine={med}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {filteredMedicines.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-400">
                Aranan kriterlere uygun ilaç bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddMedicineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddMedicine}
        initialData={modalInitialData}
        isEdit={!!editingId}
      />

      <BulkAddModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        onSave={handleBulkAdd}
      />
    </div>
  );
}

export default App;
