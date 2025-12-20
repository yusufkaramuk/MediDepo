import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Button, Input } from './ui/BaseComponents';

export const BulkAddModal = ({ isOpen, onClose, onSave }) => {
    const [medicines, setMedicines] = useState([
        { name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '' }
    ]);

    const addRow = () => {
        setMedicines([...medicines, { name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '' }]);
    };

    const removeRow = (index) => {
        if (medicines.length === 1) return;
        setMedicines(medicines.filter((_, i) => i !== index));
    };

    const updateRow = (index, field, value) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const validMedicines = medicines.filter(m => m.name.trim() !== '');
        if (validMedicines.length === 0) {
            alert("En az bir ilaç adı girmelisiniz!");
            return;
        }
        onSave(validMedicines);
        setMedicines([{ name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '' }]);
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            setMedicines([{ name: '', quantity: '', expiryDate: '', activeIngredient1: '', activeIngredient2: '', activeIngredient3: '', notes: '' }]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl shadow-xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Toplu İlaç Ekle</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-4">
                            {medicines.map((med, index) => (
                                <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-3">
                                        <Input
                                            placeholder="İlaç Adı *"
                                            value={med.name}
                                            onChange={(e) => updateRow(index, 'name', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                        <Input
                                            placeholder="Etken Madde 1"
                                            value={med.activeIngredient1}
                                            onChange={(e) => updateRow(index, 'activeIngredient1', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                        <Input
                                            placeholder="Etken Madde 2"
                                            value={med.activeIngredient2}
                                            onChange={(e) => updateRow(index, 'activeIngredient2', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                        <Input
                                            placeholder="Etken Madde 3"
                                            value={med.activeIngredient3}
                                            onChange={(e) => updateRow(index, 'activeIngredient3', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                        <Input
                                            placeholder="Miktar"
                                            value={med.quantity}
                                            onChange={(e) => updateRow(index, 'quantity', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                        <Input
                                            type="month"
                                            placeholder="Ay/Yıl"
                                            value={med.expiryDate}
                                            onChange={(e) => updateRow(index, 'expiryDate', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                        <Input
                                            placeholder="Not"
                                            value={med.notes}
                                            onChange={(e) => updateRow(index, 'notes', e.target.value)}
                                            className="md:col-span-1"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                        disabled={medicines.length === 1}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={addRow}
                            className="mt-4 w-full"
                        >
                            <Plus size={18} />
                            Satır Ekle
                        </Button>
                    </div>

                    <div className="p-6 border-t bg-white flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
                        <Button type="submit">
                            <Save size={18} />
                            Tümünü Kaydet ({medicines.filter(m => m.name.trim()).length} adet)
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
