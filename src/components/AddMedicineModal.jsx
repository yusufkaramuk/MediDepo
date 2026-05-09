import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button, Input } from './ui/BaseComponents';

export const AddMedicineModal = ({ isOpen, onClose, onSave, initialData, isEdit }) => {
    const [formData, setFormData] = useState({
        name: '',
        quantity: '',
        expiryDate: '',
        activeIngredient1: '',
        activeIngredient2: '',
        activeIngredient3: '',
        notes: '',
        createdAt: ''
    });

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    quantity: initialData.quantity || '',
                    expiryDate: initialData.expiryDate || '',
                    activeIngredient1: initialData.activeIngredient1 || '',
                    activeIngredient2: initialData.activeIngredient2 || '',
                    activeIngredient3: initialData.activeIngredient3 || '',
                    notes: initialData.notes || '',
                    createdAt: initialData.createdAt || ''
                });
            } else {
                setFormData({ name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '', createdAt: '' });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('İlaç adı zorunludur!');
            return;
        }
        onSave(formData);
        setFormData({ name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '', createdAt: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-800">
                        {isEdit ? 'İlaç Düzenle' : 'Yeni İlaç Ekle'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <Input
                        label="İlaç Adı *"
                        placeholder="Örn: Parol"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Etken Madde 1"
                            placeholder="Örn: Parasetamol"
                            value={formData.activeIngredient1}
                            onChange={e => setFormData({ ...formData, activeIngredient1: e.target.value })}
                        />
                        <Input
                            label="Etken Madde 2"
                            placeholder="Opsiyonel"
                            value={formData.activeIngredient2}
                            onChange={e => setFormData({ ...formData, activeIngredient2: e.target.value })}
                        />
                        <Input
                            label="Etken Madde 3"
                            placeholder="Opsiyonel"
                            value={formData.activeIngredient3}
                            onChange={e => setFormData({ ...formData, activeIngredient3: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Miktar"
                            placeholder="Örn: 500mg, 1 kutu"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                        />
                        <Input
                            label="Son Kullanma (Ay/Yıl)"
                            type="month"
                            value={formData.expiryDate}
                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Notlar</label>
                        <textarea
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all min-h-[80px] resize-y"
                            placeholder="Kullanım talimatı vb..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
                        <Button type="submit">
                            <Save size={18} />
                            Kaydet
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
