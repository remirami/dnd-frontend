import apiClient from './client';
import type { Character, CharacterCreateData } from '@/lib/types/character';

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export const charactersApi = {
    getAll: () => apiClient.get<PaginatedResponse<Character>>('/characters/'),

    getById: (id: number) => apiClient.get<Character>(`/characters/${id}/`),

    create: (data: CharacterCreateData) =>
        apiClient.post<Character>('/characters/', data),

    update: (id: number, data: Partial<Character>) =>
        apiClient.patch<Character>(`/characters/${id}/`, data),

    delete: (id: number) => apiClient.delete(`/characters/${id}/`),

    getCharacterSheet: (id: number) =>
        apiClient.get(`/characters/${id}/character_sheet/`),

    // Inventory
    getInventory: (id: number) => apiClient.get(`/characters/${id}/inventory/`),
    addItem: (id: number, data: { item_id: number; quantity?: number; equipment_slot?: string }) =>
        apiClient.post(`/characters/${id}/inventory/`, data),
    equipItem: (id: number, data: { character_item_id: number; equipment_slot?: string }) =>
        apiClient.post(`/characters/${id}/equip_item/`, data),
    unequipItem: (id: number, data: { character_item_id: number }) =>
        apiClient.post(`/characters/${id}/unequip_item/`, data),
    removeItem: (id: number, characterItemId: number) =>
        apiClient.post(`/characters/${id}/remove_item/`, { character_item_id: characterItemId }),
    attuneItem: (id: number, characterItemId: number) =>
        apiClient.post(`/characters/${id}/attune_item/`, { character_item_id: characterItemId }),
    unattuneItem: (id: number, characterItemId: number) =>
        apiClient.post(`/characters/${id}/unattune_item/`, { character_item_id: characterItemId }),
    updateStats: (id: number, stats: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number }) =>
        apiClient.post(`/characters/${id}/update_stats/`, stats),

    // Spells
    getSpellInfo: (id: number) => apiClient.get(`/characters/${id}/spell_info/`),
    learnSpell: (id: number, data: { spell_id?: number; spell_name?: string; spell_level: number; school?: string; description?: string; is_ritual?: boolean }) =>
        apiClient.post(`/characters/${id}/learn_spell/`, data),
    prepareSpells: (id: number, spell_ids: number[]) =>
        apiClient.post(`/characters/${id}/prepare_spells/`, { spell_ids }),
    addToSpellbook: (id: number, data: { spell_id?: number; spell_name?: string; spell_level: number; school?: string; description?: string; is_ritual?: boolean }) =>
        apiClient.post(`/characters/${id}/add_to_spellbook/`, data),
    removeSpell: (id: number, characterSpellId: number) =>
        apiClient.post(`/characters/${id}/remove_spell/`, { character_spell_id: characterSpellId }),

    // New Preparation Endpoints
    getPreparationStatus: (id: number) => apiClient.get(`/characters/${id}/preparation_status/`),
    prepareSpell: (id: number, data: { spell_id: number; prepare: boolean }) =>
        apiClient.post(`/characters/${id}/prepare_spell/`, data),
    finalizeLevelUpSpells: (id: number, spellIds: number[]) =>
        apiClient.post(`/characters/${id}/finalize_level_up_spells/`, { spell_ids: spellIds }),

    // HP Management
    updateHP: (id: number, data: { action: 'heal' | 'damage' | 'temp'; amount: number }) =>
        apiClient.post(`/characters/${id}/update_hp/`, data),

    // Level up
    levelUp: (id: number, class_id?: number) =>
        apiClient.post(`/characters/${id}/level_up/`, { class_id }),

    // Features
    updateFeature: (id: number, featureId: number, data: { selection: string[] }) =>
        apiClient.patch(`/character-features/${featureId}/`, data),

    getMulticlassInfo: (id: number) =>
        apiClient.get(`/characters/${id}/multiclass_info/`),

    // Reference
    getClasses: () => apiClient.get('/character-classes/'),

    // ASI/Feats
    getAvailableFeats: (id: number) =>
        apiClient.get(`/characters/${id}/available_feats/`),
    applyASI: (id: number, data: { level: number; choice_type: 'asi'; asi_choice: { [key: string]: number } } | { level: number; choice_type: 'feat'; feat_id: number }) =>
        apiClient.post(`/characters/${id}/apply_asi/`, data),

    // Subclasses
    // Subclasses
    getEligibleSubclasses: (id: number) =>
        apiClient.get(`/characters/${id}/eligible_subclasses/`),

    chooseSubclass: (id: number, data: { subclass: string }) =>
        apiClient.post(`/characters/${id}/choose_subclass/`, data),

    // Languages
    getEligibleLanguages: (id: number) =>
        apiClient.get(`/characters/${id}/eligible_languages/`),

    chooseLanguages: (id: number, data: { language_ids: number[] }) =>
        apiClient.post(`/characters/${id}/choose_languages/`, data),

    // Resource Management (Resting/Slots)
    longRest: (id: number) => apiClient.post(`/characters/${id}/long_rest/`),
    shortRest: (id: number, data: { hit_dice_to_spend: number }) => apiClient.post(`/characters/${id}/short_rest/`, data),
    expendSpellSlot: (id: number, level: number) => apiClient.post(`/characters/${id}/expend_spell_slot/`, { level }),
    restoreSpellSlot: (id: number, level: number) => apiClient.post(`/characters/${id}/restore_spell_slot/`, { level }),
};
